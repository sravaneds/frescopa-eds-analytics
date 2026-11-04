/**
 * CUG (Closed User Group) user info for the header.
 *
 * Calls /auth/me to check authentication state and renders
 * a sign-in link or user name with a dropdown menu containing
 * "My Portal" and "Sign out" links.
 */

export default async function renderCugUser(navTools) {
  const wrapper = document.createElement('div');
  wrapper.className = 'cug-user-wrapper nav-tools-wrapper';

  let user;
  try {
    const resp = await fetch('/auth/me');
    user = resp.ok ? await resp.json() : null;
  } catch {
    user = null;
  }

  // Adobe Client Data Layer: success of a login submitted from the login form block
  // (blocks/login-form). Reported once, and only within 5 minutes of the submit.
  try {
    const pending = JSON.parse(sessionStorage.getItem('acdl:login-pending'));
    if (pending && user?.authenticated) {
      sessionStorage.removeItem('acdl:login-pending');
      if (Date.now() - pending.time < 5 * 60 * 1000) {
        window.adobeDataLayer = window.adobeDataLayer || [];
        window.adobeDataLayer.push({
          event: 'loginInteraction',
          component: { type: 'login', location: pending.location, action: 'success' },
        });
      }
    }
  } catch (e) {
    // storage unavailable or invalid value: nothing to report
  }

  if (!user?.authenticated) {
    const signIn = document.createElement('a');
    signIn.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    signIn.className = 'cug-sign-in';
    signIn.textContent = 'Sign in';
    wrapper.append(signIn);
  } else {
    const trigger = document.createElement('button');
    trigger.className = 'cug-dropdown-trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.textContent = user.name || user.email;
    wrapper.append(trigger);

    const menu = document.createElement('div');
    menu.className = 'cug-dropdown-menu';

    const portal = document.createElement('a');
    portal.href = '/auth/portal';
    portal.textContent = 'My Portal';

    const signOut = document.createElement('a');
    signOut.href = '/auth/logout';
    signOut.textContent = 'Sign out';

    menu.append(portal, signOut);
    wrapper.append(menu);

    trigger.addEventListener('click', () => {
      const open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('cug-dropdown-menu--open', !open);
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        trigger.setAttribute('aria-expanded', 'false');
        menu.classList.remove('cug-dropdown-menu--open');
      }
    });
  }

  navTools.append(wrapper);
}
