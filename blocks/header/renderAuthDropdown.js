/* eslint-disable import/prefer-default-export */
import * as authApi from '@dropins/storefront-auth/api.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import { events } from '@dropins/tools/event-bus.js';
import { getCookie } from '../../scripts/configs.js';
import { CUSTOMER_FORGOTPASSWORD_PATH } from '../../scripts/constants.js';
import { rootLink } from '../../scripts/scripts.js';

function checkAndRedirect(redirections) {
  Object.entries(redirections).some(([currentPath, redirectPath]) => {
    if (window.location.pathname.includes(currentPath)) {
      window.location.href = redirectPath;
      return true;
    }
    return false;
  });
}

function renderSignIn(element) {
  // Adobe Client Data Layer: header sign-in dropdown (loginInteraction)
  window.adobeDataLayer = window.adobeDataLayer || [];
  // one success or failure per sign-in attempt, reset on every submit
  let resultReported = false;
  authRenderer.render(SignIn, {
    // the drop-in calls this only after a successful sign-in (no redirect in the dropdown)
    onSuccessCallback: () => {
      if (resultReported) return;
      resultReported = true;
      // success: the customer signed in from the header dropdown
      window.adobeDataLayer.push({
        event: 'loginInteraction',
        component: { type: 'login', location: 'header-dropdown', action: 'success' },
      });
    },
    // the drop-in calls this when the credentials are rejected or the request fails
    onErrorCallback: () => {
      if (resultReported) return;
      resultReported = true;
      // failure: the sign-in from the header dropdown was rejected
      window.adobeDataLayer.push({
        event: 'loginInteraction',
        component: { type: 'login', location: 'header-dropdown', action: 'failure' },
      });
    },
    formSize: 'small',
    routeForgotPassword: () => rootLink(CUSTOMER_FORGOTPASSWORD_PATH),
  })(element);

  // click: the sign-in button in the dropdown was clicked (or Enter pressed)
  element.addEventListener('submit', (e) => {
    resultReported = false;
    window.adobeDataLayer.push({
      event: 'loginInteraction',
      component: {
        type: 'login',
        location: 'header-dropdown',
        ctaText: (e.submitter?.textContent || '').trim(),
        action: 'click',
      },
    });
  }, true);
}

export function renderAuthDropdown(navTools) {
  const dropdownElement = document.createRange().createContextualFragment(`
 <div class="dropdown-wrapper nav-tools-wrapper">
    <button type="button" class="nav-dropdown-button" aria-haspopup="dialog" aria-expanded="false" aria-controls="login-modal"></button>
    <div class="nav-auth-menu-panel nav-tools-panel">
      <div id="auth-dropin-container"></div>
      <ul class="authenticated-user-menu">
         <li><a href="${rootLink('/customer/account')}">My Account</a></li>
          <li><button>Logout</button></li>
      </ul>
    </div>
 </div>`);

  navTools.append(dropdownElement);

  const authDropDownPanel = navTools.querySelector('.nav-auth-menu-panel');
  const authDropDownMenuList = navTools.querySelector(
    '.authenticated-user-menu',
  );
  const authDropinContainer = navTools.querySelector('#auth-dropin-container');
  const loginButton = navTools.querySelector('.nav-dropdown-button');
  const logoutButtonElement = navTools.querySelector(
    '.authenticated-user-menu > li > button',
  );

  authDropDownPanel.addEventListener('click', (e) => e.stopPropagation());

  async function toggleDropDownAuthMenu(state) {
    const show = state ?? !authDropDownPanel.classList.contains('nav-tools-panel--show');

    authDropDownPanel.classList.toggle('nav-tools-panel--show', show);
    authDropDownPanel.setAttribute('role', 'dialog');
    authDropDownPanel.setAttribute('aria-hidden', 'false');
    authDropDownPanel.setAttribute('aria-labelledby', 'modal-title');
    authDropDownPanel.setAttribute('aria-describedby', 'modal-description');
    authDropDownPanel.focus();
  }

  loginButton.addEventListener('click', () => toggleDropDownAuthMenu());
  document.addEventListener('click', async (e) => {
    const clickOnDropDownPanel = authDropDownPanel.contains(e.target);
    const clickOnLoginButton = loginButton.contains(e.target);

    if (!clickOnDropDownPanel && !clickOnLoginButton) {
      await toggleDropDownAuthMenu(false);
    }
  });

  logoutButtonElement.addEventListener('click', async () => {
    await authApi.revokeCustomerToken();
    checkAndRedirect({
      '/customer': rootLink('/customer/login'),
      '/order-details': rootLink('/'),
    });
  });

  renderSignIn(authDropinContainer);

  const updateDropDownUI = (isAuthenticated) => {
    const getUserTokenCookie = getCookie('auth_dropin_user_token');
    const getUserNameCookie = getCookie('auth_dropin_firstname');

    if (isAuthenticated || getUserTokenCookie) {
      authDropDownMenuList.style.display = 'block';
      authDropinContainer.style.display = 'none';
      loginButton.textContent = `Hi, ${getUserNameCookie}`;
    } else {
      authDropDownMenuList.style.display = 'none';
      authDropinContainer.style.display = 'block';
      loginButton.innerHTML = `
      <svg
          width="25"
          height="25"
          viewBox="0 0 24 24"
          aria-label="My Account"
          >
          <g fill="none" stroke="#000000" stroke-width="1.5">
          <circle cx="12" cy="6" r="4"></circle>
          <path d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z"></path></g></svg>
        `;
    }
  };

  events.on('authenticated', (isAuthenticated) => {
    updateDropDownUI(isAuthenticated);
  });

  updateDropDownUI();
}
