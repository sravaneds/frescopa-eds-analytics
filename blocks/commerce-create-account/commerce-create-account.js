/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
import { SignUp } from '@dropins/storefront-auth/containers/SignUp.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import { checkIsAuthenticated } from '../../scripts/configs.js';
import {
  authPrivacyPolicyConsentSlot,
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_LOGIN_PATH,
} from '../../scripts/constants.js';
import { rootLink } from '../../scripts/scripts.js';

// Initialize
import '../../scripts/initializers/auth.js';

export default async function decorate(block) {
  if (checkIsAuthenticated()) {
    window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
  } else {
    // Adobe Client Data Layer: signup engagement (signupInteraction)
    window.adobeDataLayer = window.adobeDataLayer || [];
    // the drop-in can call both callbacks below for one signup; report the completion once
    let completed = false;

    await authRenderer.render(SignUp, {
      hideCloseBtnOnEmailConfirmation: true,
      routeSignIn: () => rootLink(CUSTOMER_LOGIN_PATH),
      // called after the account was created and the customer was signed in automatically
      routeRedirectOnSignIn: () => {
        if (!completed) {
          completed = true;
          // complete: the account was created
          window.adobeDataLayer.push({
            event: 'signupInteraction',
            component: { type: 'signup', location: 'signup-form', action: 'complete' },
          });
        }
        return rootLink(CUSTOMER_ACCOUNT_PATH);
      },
      // called after the account was created when there is no automatic sign-in
      // (e.g. email confirmation required)
      onSuccessCallback: async () => {
        if (completed) return;
        completed = true;
        // complete: the account was created
        window.adobeDataLayer.push({
          event: 'signupInteraction',
          component: { type: 'signup', location: 'signup-form', action: 'complete' },
        });
      },
      slots: {
        ...authPrivacyPolicyConsentSlot,
      },
    })(block);

    // impression: the signup form is 50 % visible, reported once per page view
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        window.adobeDataLayer.push({
          event: 'signupInteraction',
          component: { type: 'signup', location: 'signup-form', action: 'impression' },
        });
      }, { threshold: 0.5 });
      observer.observe(block);
    }

    // start: the visitor types in the first field of the form (autofocus does not count).
    // Field values are never read.
    block.addEventListener('input', (e) => {
      if (!e.target.matches('input, select, textarea')) return;
      window.adobeDataLayer.push({
        event: 'signupInteraction',
        component: {
          type: 'signup', location: 'signup-form', field: e.target.name || '', action: 'start',
        },
      });
    }, { capture: true, once: true });

    // click: the "Create account" CTA was clicked (or Enter pressed)
    block.addEventListener('submit', (e) => {
      window.adobeDataLayer.push({
        event: 'signupInteraction',
        component: {
          type: 'signup',
          location: 'signup-form',
          ctaText: (e.submitter?.textContent || '').trim(),
          action: 'click',
        },
      });
    }, true);
  }
}
