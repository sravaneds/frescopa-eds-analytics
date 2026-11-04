/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import { checkIsAuthenticated } from '../../scripts/configs.js';
import { CUSTOMER_FORGOTPASSWORD_PATH, CUSTOMER_ACCOUNT_PATH } from '../../scripts/constants.js';
import { rootLink } from '../../scripts/scripts.js';
import { getComponentId } from '../../scripts/analytics/adobe-data-layer.js';
import {
  trackLoginBlock, withAuthTracking, createLoginResultHandlers,
} from '../../scripts/analytics/auth.js';

// Initialize
import '../../scripts/initializers/auth.js';

export default async function decorate(block) {
  if (checkIsAuthenticated()) {
    window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
  } else {
    // analytics (loginInteraction): success / failure from the drop-in callbacks,
    // reported once per sign-in attempt
    const result = createLoginResultHandlers('commerce-login', getComponentId(block, 'login'));
    await authRenderer.render(SignIn, withAuthTracking({
      routeForgotPassword: () => rootLink(CUSTOMER_FORGOTPASSWORD_PATH),
      routeRedirectOnSignIn: () => rootLink(CUSTOMER_ACCOUNT_PATH),
    }, result))(block);
    trackLoginBlock(block, 'commerce-login', result.reset);
  }
}
