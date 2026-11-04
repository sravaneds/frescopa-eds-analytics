/**
 * Page-level engagement analytics, started once per page in the lazy phase
 * (scripts/scripts.js -> loadLazy). Block-level tracking is started by each block.
 */
import initPageEngagement from './page-engagement.js';
import { resolvePendingLogin, trackSignupLinks } from './auth.js';

let initialized = false;

export default function initAnalytics() {
  if (initialized) return;
  initialized = true;
  initPageEngagement();
  trackSignupLinks();
  // result of a server-side (CUG) login submitted on the previous page; the login form
  // block reports failures itself when it renders the error
  const loginError = new URLSearchParams(window.location.search).has('error');
  resolvePendingLogin({ onLoginPage: loginError || !!document.querySelector('.login-form') });
}
