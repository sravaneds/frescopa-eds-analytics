/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import { checkIsAuthenticated } from '../../scripts/configs.js';
import { CUSTOMER_FORGOTPASSWORD_PATH, CUSTOMER_ACCOUNT_PATH } from '../../scripts/constants.js';
import { rootLink } from '../../scripts/scripts.js';

// Initialize
import '../../scripts/initializers/auth.js';

export default async function decorate(block) {
  if (checkIsAuthenticated()) {
    window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
  } else {
    // Adobe Client Data Layer: login engagement (loginInteraction)
    window.adobeDataLayer = window.adobeDataLayer || [];
    // one success or failure per sign-in attempt, reset on every submit
    let resultReported = false;

    await authRenderer.render(SignIn, {
      routeForgotPassword: () => rootLink(CUSTOMER_FORGOTPASSWORD_PATH),
      // the drop-in calls this only after a successful sign-in, right before redirecting
      routeRedirectOnSignIn: () => {
        if (!resultReported) {
          resultReported = true;
          // success: the customer signed in
          window.adobeDataLayer.push({
            event: 'loginInteraction',
            component: { type: 'login', location: 'commerce-login', action: 'success' },
          });
        }
        return rootLink(CUSTOMER_ACCOUNT_PATH);
      },
      // the drop-in calls this when the credentials are rejected or the request fails
      onErrorCallback: () => {
        if (resultReported) return;
        resultReported = true;
        // failure: the sign-in was rejected
        window.adobeDataLayer.push({
          event: 'loginInteraction',
          component: { type: 'login', location: 'commerce-login', action: 'failure' },
        });
      },
    })(block);

    // impression: the sign-in form is 50 % visible, reported once per page view
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        window.adobeDataLayer.push({
          event: 'loginInteraction',
          component: { type: 'login', location: 'commerce-login', action: 'impression' },
        });
      }, { threshold: 0.5 });
      observer.observe(block);
    }

    // click: the sign-in button was clicked (or Enter pressed), once per attempt
    block.addEventListener('submit', (e) => {
      resultReported = false;
      window.adobeDataLayer.push({
        event: 'loginInteraction',
        component: {
          type: 'login',
          location: 'commerce-login',
          ctaText: (e.submitter?.textContent || '').trim(),
          action: 'click',
        },
      });
    }, true);
  }
}
