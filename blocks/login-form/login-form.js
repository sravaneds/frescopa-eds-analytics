/**
 * Login form block for CUG authentication.
 *
 * Renders an email/password form that POSTs to /auth/login.
 * Reads `redirect` and `error` from the page URL search params
 * so the worker can pass back context after a failed attempt.
 */
export default function decorate(block) {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') || '/';
  const error = params.get('error');

  block.innerHTML = '';

  if (error) {
    const msg = document.createElement('div');
    msg.className = 'login-form-error';
    msg.setAttribute('role', 'alert');
    msg.textContent = error === 'missing'
      ? 'Email and password are required.'
      : 'Invalid email or password.';
    block.append(msg);
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `/auth/login?redirect=${encodeURIComponent(redirect)}`;

  const emailLabel = document.createElement('label');
  emailLabel.htmlFor = 'email';
  emailLabel.textContent = 'Email';

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.id = 'email';
  emailInput.name = 'email';
  emailInput.required = true;
  emailInput.autocomplete = 'email';
  emailInput.autofocus = true;

  const passwordLabel = document.createElement('label');
  passwordLabel.htmlFor = 'password';
  passwordLabel.textContent = 'Password';

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'password';
  passwordInput.name = 'password';
  passwordInput.required = true;
  passwordInput.autocomplete = 'current-password';

  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Sign in';

  form.append(emailLabel, emailInput, passwordLabel, passwordInput, button);
  block.append(form);

  // Adobe Client Data Layer: login engagement (loginInteraction)
  window.adobeDataLayer = window.adobeDataLayer || [];

  // failure: the server sent the visitor back with ?error=. Only counted when the form was
  // submitted in this session (pending flag), so reloading the error page is not counted again
  let pending = null;
  try {
    pending = JSON.parse(sessionStorage.getItem('acdl:login-pending'));
  } catch (e) {
    pending = null;
  }
  if (error && pending) {
    sessionStorage.removeItem('acdl:login-pending');
    window.adobeDataLayer.push({
      event: 'loginInteraction',
      component: {
        type: 'login', location: 'login-form', reason: error, action: 'failure',
      },
    });
  }

  // impression: the login form is 50 % visible, reported once per page view
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      window.adobeDataLayer.push({
        event: 'loginInteraction',
        component: { type: 'login', location: 'login-form', action: 'impression' },
      });
    }, { threshold: 0.5 });
    observer.observe(block);
  }

  // click: "Sign in" clicked (or Enter pressed) with both fields filled in. The success is
  // reported on the next page by the header (blocks/header/renderCugUser.js) once /auth/me
  // confirms the session
  form.addEventListener('submit', () => {
    try {
      sessionStorage.setItem('acdl:login-pending', JSON.stringify({ location: 'login-form', time: Date.now() }));
    } catch (e) {
      // storage unavailable: the click is still tracked
    }
    window.adobeDataLayer.push({
      event: 'loginInteraction',
      component: {
        type: 'login', location: 'login-form', ctaText: button.textContent, action: 'click',
      },
    });
  });
}
