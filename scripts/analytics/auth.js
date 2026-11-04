/**
 * Login and signup engagement tracking.
 *
 * loginInteraction  action: impression | click | success | failure
 * signupInteraction action: impression | click | start | complete
 *
 * `location` tells where the interaction happened (login-form, commerce-login,
 * header-dropdown, signup-form, link). No credentials or form values are ever read.
 */
import {
  pushDataLayerEvent, trackImpression, trackClicks, getComponentId, getElementText,
  getLinkUrl, safeSession,
} from './adobe-data-layer.js';

export const LOGIN_EVENT = 'loginInteraction';
export const SIGNUP_EVENT = 'signupInteraction';

/** Set when a login form posts to the server; resolved on the next page view. */
const PENDING_LOGIN_KEY = 'acdl:login-pending';
const PENDING_TTL_MS = 5 * 60 * 1000;

/** Links that open the signup journey (account creation page or Rewards enrollment). */
const SIGNUP_LINK = /(\/customer\/create(-account)?|\/create-account|\/sign-?up|\/register)(\.html)?\/?$/i;
const ENROLL_HASH = '#aep:enroll';

/**
 * Pushes a loginInteraction event.
 * @param {string} action impression | click | success | failure
 * @param {Object} details extra component attributes (location, method, ...)
 * @param {Object} options pushDataLayerEvent options
 */
export function pushLogin(action, details = {}, options = {}) {
  return pushDataLayerEvent(LOGIN_EVENT, {
    component: { type: 'login', action, ...details },
  }, options);
}

/**
 * Pushes a signupInteraction event.
 * @param {string} action impression | click | start | complete
 * @param {Object} details extra component attributes (location, method, ...)
 * @param {Object} options pushDataLayerEvent options
 */
export function pushSignup(action, details = {}, options = {}) {
  return pushDataLayerEvent(SIGNUP_EVENT, {
    component: { type: 'signup', action, ...details },
  }, options);
}

/**
 * Impression and submit ("button click") tracking shared by all login blocks.
 * The submit event covers both the button click and pressing Enter, once per attempt.
 * @param {Element} block login block
 * @param {string} location reporting location
 * @param {Function} [onSubmit] called after the click is tracked
 */
export function trackLoginBlock(block, location, onSubmit) {
  if (!block || block.dataset.analyticsTracked === 'true') return;
  block.dataset.analyticsTracked = 'true';
  const componentId = getComponentId(block, 'login');
  trackImpression(block, () => pushLogin('impression', { location }, { componentId }));
  block.addEventListener('submit', (e) => {
    pushLogin('click', { location }, { componentId, domEvent: e });
    if (onSubmit) onSubmit();
  }, true);
}

/**
 * Impression, start, click and completion tracking for signup blocks.
 * "start" fires on the first field the visitor types in (not on autofocus).
 * @param {Element} block signup block
 * @param {string} location reporting location
 * @returns {Function} complete() pushes the completion once per block instance
 */
export function trackSignupBlock(block, location) {
  const componentId = getComponentId(block, 'signup');
  let completed = false;
  const complete = () => {
    if (completed) return;
    completed = true;
    pushSignup('complete', { location }, { componentId });
  };
  if (!block || block.dataset.analyticsTracked === 'true') return complete;
  block.dataset.analyticsTracked = 'true';

  trackImpression(block, () => pushSignup('impression', { location }, { componentId }));
  const onStart = (e) => {
    if (!e.target?.matches?.('input, select, textarea')) return;
    block.removeEventListener('input', onStart, true);
    pushSignup('start', { location }, { componentId });
  };
  block.addEventListener('input', onStart, true);
  block.addEventListener('submit', (e) => {
    pushSignup('click', { location, ctaText: getElementText(e.submitter) || 'submit' }, { componentId, domEvent: e });
  }, true);
  return complete;
}

/**
 * Wraps Adobe Commerce auth drop-in options (SignIn / SignUp containers) with tracking.
 * Existing callbacks keep working: the drop-in only calls routeRedirectOnSignIn and
 * onSuccessCallback after a successful request and onErrorCallback after a failed one.
 * @param {Object} options drop-in options
 * @param {Object} handlers { onSuccess, onFailure }
 * @returns {Object} options with tracking callbacks
 */
export function withAuthTracking(options = {}, {
  onSuccess = () => {}, onFailure = () => {},
} = {}) {
  const { onSuccessCallback, onErrorCallback, routeRedirectOnSignIn } = options;
  const tracked = {
    ...options,
    onSuccessCallback: async (value) => {
      onSuccess();
      if (typeof onSuccessCallback === 'function') await onSuccessCallback(value);
    },
    onErrorCallback: (error) => {
      onFailure(error);
      if (typeof onErrorCallback === 'function') onErrorCallback(error);
    },
  };
  if (typeof routeRedirectOnSignIn === 'function') {
    tracked.routeRedirectOnSignIn = () => {
      onSuccess();
      return routeRedirectOnSignIn();
    };
  }
  return tracked;
}

/**
 * Login and failure callbacks for a drop-in sign-in form, deduplicated per attempt.
 * @param {string} location reporting location
 * @param {string} componentId component id
 */
export function createLoginResultHandlers(location, componentId = '') {
  let reported = false;
  return {
    reset: () => { reported = false; },
    onSuccess: () => {
      if (reported) return;
      reported = true;
      pushLogin('success', { location }, { componentId });
    },
    onFailure: () => {
      if (reported) return;
      reported = true;
      pushLogin('failure', { location }, { componentId });
    },
  };
}

/**
 * Server-side (CUG) login: the form posts to /auth/login, which redirects back to the login
 * page with ?error=... on failure or to the target page on success. The pending flag lets
 * the next page view report the result exactly once.
 * @param {string} location reporting location
 */
export function markLoginPending(location) {
  safeSession.set(PENDING_LOGIN_KEY, { location, time: Date.now() });
}

/**
 * Reports a pending server-side login result. Call on the login page with failed = true
 * when the server returned an error, or without arguments on any other page view.
 * @param {Object} [options]
 * @param {boolean} [options.failed] login page shows an error
 * @param {boolean} [options.onLoginPage] current page shows the login form
 */
export function resolvePendingLogin({ failed = false, onLoginPage = false } = {}) {
  const pending = safeSession.get(PENDING_LOGIN_KEY);
  if (!pending) return;
  if (!pending.time || Date.now() - pending.time > PENDING_TTL_MS) {
    safeSession.remove(PENDING_LOGIN_KEY);
    return;
  }
  if (failed) {
    safeSession.remove(PENDING_LOGIN_KEY);
    pushLogin('failure', { location: pending.location });
    return;
  }
  // back on the login form without an error: the result is unknown, do not count it
  safeSession.remove(PENDING_LOGIN_KEY);
  if (!onLoginPage) pushLogin('success', { location: pending.location });
}

/**
 * Site-wide signup CTA tracking: links to the account creation page or Rewards enrollment.
 * One delegated listener for the whole document, so authored links anywhere are covered.
 */
export function trackSignupLinks() {
  if (document.documentElement.dataset.analyticsSignupLinks === 'true') return;
  document.documentElement.dataset.analyticsSignupLinks = 'true';
  trackClicks(document, 'a[href]', (link, e) => {
    const href = link.getAttribute('href') || '';
    const isEnroll = href.endsWith(ENROLL_HASH);
    let isSignup = false;
    try {
      isSignup = SIGNUP_LINK.test(new URL(href, window.location.href).pathname);
    } catch (err) {
      isSignup = false;
    }
    if (!isEnroll && !isSignup) return;
    pushSignup('click', {
      location: 'link',
      method: isEnroll ? 'membership' : 'account',
      ctaText: getElementText(link),
      ctaUrl: isEnroll ? '' : getLinkUrl(link),
    }, { domEvent: e });
  });
}
