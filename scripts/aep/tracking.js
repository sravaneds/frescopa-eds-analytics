/**
 * Automatic interaction tracking for the AEP training site.
 *
 * - Click tracking: every link/button is tracked. The event name comes from
 *   [data-track] on the element (set by blocks) or from the block it lives in.
 * - Scroll depth: 25/50/75/90/100 % milestones.
 * - Reading time: active reading milestones on article pages.
 * - Impressions: elements with [data-track-impression] when 50 % visible.
 * - Action links: authored links to #aep:sign-in, #aep:sign-out, #aep:enroll,
 *   #aep:reset-profile trigger demo account actions.
 */
import {
  pushEvent, pushState, getState, buildUserContext,
} from './datalayer.js';
import {
  signIn, signOut, enrollMembership, resetProfile, getProfile, getAudiences, getPrimaryAudience,
} from './profile.js';
import { getCart } from './store.js';

const BLOCK_EVENTS = {
  hero: 'heroClick',
  banner: 'bannerClick',
  cta: 'ctaClick',
  teaser: 'ctaClick',
  cards: 'ctaClick',
  columns: 'ctaClick',
  carousel: 'carouselClick',
  'product-carousel': 'productCarouselClick',
  testimonials: 'ctaClick',
  tabs: 'ctaClick',
  accordion: 'ctaClick',
  faq: 'ctaClick',
  header: 'navClick',
  footer: 'footerClick',
};

function blockPosition(block) {
  const name = block.dataset.blockName;
  const all = [...document.querySelectorAll(`main .block[data-block-name="${name}"]`)];
  return all.indexOf(block) + 1;
}

function sectionIndex(section) {
  if (!section) return 0;
  return [...document.querySelectorAll('main > .section')].indexOf(section) + 1;
}

/**
 * Collects the context of a clicked element.
 */
export function getClickContext(el) {
  const block = el.closest('.block, header, footer');
  const section = el.closest('main > .section');
  const component = block?.dataset.blockName || block?.tagName.toLowerCase() || 'default-content';
  const campaignEl = el.closest('[data-campaign-id]');
  const href = el.getAttribute('href') || '';
  return {
    CTAName: (el.dataset.ctaName || el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
    linkUrl: href ? new URL(href, window.location.href).href : '',
    linkType: el.tagName === 'BUTTON' ? 'button' : 'link',
    component,
    componentPosition: block?.classList.contains('block') ? blockPosition(block) : 0,
    sectionPosition: sectionIndex(section),
    targetLocation: section?.dataset.targetLocation || '',
    personalizationVariant: section?.dataset.aepVariant || '',
    campaignId: campaignEl?.dataset.campaignId || getState('campaign.campaignId') || '',
  };
}

function refreshUser() {
  const profile = getProfile();
  const audiences = getAudiences(getCart());
  pushState({ user: buildUserContext(profile, audiences, getPrimaryAudience(audiences)) });
}

const ACTIONS = {
  'sign-in': () => {
    signIn();
    refreshUser();
    pushEvent('loginComplete', { loginMethod: 'demo', customerId: getProfile().customerId });
  },
  'sign-out': () => {
    signOut();
    refreshUser();
    pushEvent('logout', {});
  },
  enroll: () => {
    enrollMembership();
    refreshUser();
    pushEvent('membershipEnroll', { loyaltyTier: getProfile().loyaltyTier });
  },
  'reset-profile': () => {
    resetProfile();
    pushEvent('profileReset', {});
  },
};

function handleAction(link, event) {
  const hash = link.hash || '';
  if (!hash.startsWith('#aep:')) return false;
  event.preventDefault();
  const action = ACTIONS[hash.slice(5)];
  if (action) {
    action();
    window.setTimeout(() => window.location.reload(), 150);
  }
  return true;
}

function onClick(e) {
  const el = e.target.closest('a, button, [data-track]');
  if (!el || el.closest('.aep-debug')) return;
  if (el.dataset.trackHandled === 'true') return;
  const context = getClickContext(el);
  if (el.tagName === 'A' && handleAction(el, e)) {
    pushEvent('ctaClick', { ...context, actionLink: true });
    return;
  }
  // form controls inside blocks report their own events
  if (el.tagName === 'BUTTON' && !el.dataset.track && el.closest('form, .block[data-self-tracking]')) return;
  const event = el.dataset.track || BLOCK_EVENTS[context.component] || (el.tagName === 'A' ? 'linkClick' : 'ctaClick');
  const extra = {};
  Object.entries(el.dataset).forEach(([key, value]) => {
    if (key.startsWith('track') && !['track', 'trackHandled', 'trackObserved', 'trackImpression'].includes(key)) {
      const name = key.slice(5);
      extra[name.charAt(0).toLowerCase() + name.slice(1)] = value;
    }
  });
  pushEvent(event, { ...context, ...extra });
}

function trackScrollDepth() {
  const milestones = [25, 50, 75, 90, 100];
  const reached = new Set();
  let ticking = false;
  const check = () => {
    ticking = false;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    const percent = scrollable <= 0 ? 100 : Math.round((window.scrollY / scrollable) * 100);
    milestones.forEach((m) => {
      if (percent >= m && !reached.has(m)) {
        reached.add(m);
        pushEvent('scrollDepth', { scrollDepth: m, pageHeight: doc.scrollHeight });
      }
    });
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(check);
    }
  }, { passive: true });
}

function trackReadingTime() {
  const article = document.querySelector('main');
  const words = (article?.textContent || '').trim().split(/\s+/).length;
  const estimatedMinutes = Math.max(1, Math.round(words / 230));
  const milestones = [15, 30, 60, 120, 300];
  let active = 0;
  let maxScroll = 0;
  const timer = window.setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    active += 1;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 100;
    maxScroll = Math.max(maxScroll, percent);
    if (milestones.includes(active)) {
      pushEvent('readingTime', {
        readingSeconds: active, estimatedMinutes, percentRead: maxScroll, milestone: `${active}s`,
      });
    }
    if (active >= milestones[milestones.length - 1]) window.clearInterval(timer);
  }, 1000);
  window.addEventListener('pagehide', () => {
    pushEvent('readingTime', {
      readingSeconds: active, estimatedMinutes, percentRead: maxScroll, milestone: 'exit',
    });
  }, { once: true });
}

/**
 * Observes elements with [data-track-impression="eventName"].
 */
export function observeImpressions(root = document) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);
      const info = { component: el.closest('.block')?.dataset.blockName || '' };
      Object.entries(el.dataset).forEach(([key, value]) => {
        if (key.startsWith('track') && !['trackImpression', 'track', 'trackObserved'].includes(key)) {
          const name = key.slice(5);
          info[name.charAt(0).toLowerCase() + name.slice(1)] = value;
        }
      });
      pushEvent(el.dataset.trackImpression, info);
    });
  }, { threshold: 0.5 });
  root.querySelectorAll('[data-track-impression]:not([data-track-observed])').forEach((el) => {
    el.dataset.trackObserved = 'true';
    observer.observe(el);
  });
}

let initialized = false;

export default function initTracking() {
  if (initialized) return;
  initialized = true;
  document.addEventListener('click', onClick);
  trackScrollDepth();
  const pageType = getState('page.pageType');
  if (pageType === 'article') trackReadingTime();
  observeImpressions();
  document.addEventListener('aep:block-rendered', (e) => observeImpressions(e.detail?.block || document));
}
