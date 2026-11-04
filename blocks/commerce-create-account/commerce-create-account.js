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
import { trackSignupBlock, withAuthTracking } from '../../scripts/analytics/auth.js';

// Initialize
import '../../scripts/initializers/auth.js';

export default async function decorate(block) {
  if (checkIsAuthenticated()) {
    window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
  } else {
    // analytics (signupInteraction): impression, start (first field typed in), click (submit)
    // and complete. The drop-in calls onSuccessCallback or routeRedirectOnSignIn only after
    // the account was created.
    const complete = trackSignupBlock(block, 'signup-form');
    await authRenderer.render(SignUp, withAuthTracking({
      hideCloseBtnOnEmailConfirmation: true,
      routeSignIn: () => rootLink(CUSTOMER_LOGIN_PATH),
      routeRedirectOnSignIn: () => rootLink(CUSTOMER_ACCOUNT_PATH),
      slots: {
        ...authPrivacyPolicyConsentSlot,
      },
    }, { onSuccess: complete }))(block);
  }
}
