/**
 * Adobe Client Data Layer (ACDL) helpers for the AEP training site.
 *
 * State model (see docs/aep-training/08-sample-data-layer.md):
 * { page, user, product, cart, campaign, personalization }
 *
 * Events are pushed as { event, eventInfo, ...stateUpdates } so Adobe Tags rules can
 * listen with the ACDL extension ("Data Pushed" -> specific event) and read
 * %event.eventInfo.*% or the computed state (e.g. page.pageName).
 */
import { getMetadata } from '../aem.js';

export const SITE_NAME = 'novamart';
/**
 * Site root, so links work wherever the site is mounted:
 * /content/aep-training (local preview, Universal Editor), /aep-training (sub-path mapping)
 * or '' when /content/aep-training is published at the root of the domain.
 */
function detectSiteRoot() {
  const { pathname } = window.location;
  if (pathname.startsWith('/content/aep-training')) return '/content/aep-training';
  if (pathname === '/aep-training' || pathname.startsWith('/aep-training/')) return '/aep-training';
  return '';
}
export const SITE_ROOT = detectSiteRoot();
export const CURRENCY = 'USD';

const MAX_LOG = 50;

window.aepTraining = window.aepTraining || { events: [], propositions: [] };

export function getDataLayer() {
  window.adobeDataLayer = window.adobeDataLayer || [];
  return window.adobeDataLayer;
}

/**
 * Returns the computed ACDL state if the library is loaded, otherwise the
 * locally tracked snapshot.
 */
export function getState(path) {
  const dl = getDataLayer();
  if (typeof dl.getState === 'function') return dl.getState(path);
  const state = window.aepTraining.state || {};
  if (!path) return state;
  return path.split('.').reduce((obj, key) => (obj ? obj[key] : undefined), state);
}

function mergeSnapshot(updates) {
  const state = window.aepTraining.state || {};
  Object.entries(updates).forEach(([key, value]) => {
    state[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? { ...(state[key] || {}), ...value }
      : value;
  });
  window.aepTraining.state = state;
}

/**
 * Pushes state without an event (e.g. cart totals after an update).
 * @param {Object} updates partial state, e.g. { cart: {...} }
 */
export function pushState(updates) {
  mergeSnapshot(updates);
  getDataLayer().push(updates);
}

/**
 * Pushes an event to the data layer.
 * @param {string} event event name, e.g. "ctaClick"
 * @param {Object} eventInfo event specific attributes
 * @param {Object} stateUpdates optional state merged into the data layer
 */
export function pushEvent(event, eventInfo = {}, stateUpdates = {}) {
  const info = {
    ...eventInfo,
    pageName: getState('page.pageName'),
    timestamp: new Date().toISOString(),
  };
  mergeSnapshot(stateUpdates);
  const entry = { event, eventInfo: info, ...stateUpdates };
  getDataLayer().push(entry);
  const log = window.aepTraining.events;
  log.unshift({ event, eventInfo: info, state: stateUpdates });
  if (log.length > MAX_LOG) log.length = MAX_LOG;
  document.dispatchEvent(new CustomEvent('aep:event', { detail: entry }));
  return entry;
}

function slug(value) {
  return (value || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getEnvironment() {
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname.startsWith('127.')) return 'local';
  if (hostname.endsWith('.aem.page') || hostname.endsWith('.hlx.page')) return 'preview';
  if (hostname.includes('adobeaemcloud.com')) return 'author';
  return 'production';
}

/**
 * Path segments of the page below the site root.
 * /content/aep-training/account/orders -> ['account', 'orders']
 */
export function getPageSegments() {
  const path = window.location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
  const rel = path.startsWith(SITE_ROOT) ? path.slice(SITE_ROOT.length) : path;
  return rel.split('/').filter(Boolean);
}

export function buildPageContext() {
  const segments = getPageSegments();
  const pageType = getMetadata('page-type') || 'content';
  const siteSection = getMetadata('site-section') || segments[0] || 'home';
  const pageName = getMetadata('page-name')
    || [SITE_NAME, ...(segments.length ? segments : ['home'])].join(':');
  return {
    pageName,
    pageType,
    siteSection,
    subSection: segments[1] || '',
    category: getMetadata('category') || '',
    template: getMetadata('template') || '',
    title: document.title,
    language: document.documentElement.lang || 'en',
    url: window.location.href.split('#')[0],
    path: window.location.pathname,
    referrer: document.referrer,
    server: window.location.hostname,
    environment: getEnvironment(),
    contentType: getMetadata('content-type') || '',
    pageId: getMetadata('page-id') || slug(pageName),
  };
}

export function buildProductContext() {
  const productId = getMetadata('product-id');
  if (!productId) return {};
  return {
    productId,
    productName: getMetadata('product-name'),
    category: getMetadata('category'),
    brand: getMetadata('product-brand'),
    price: parseFloat(getMetadata('product-price')) || 0,
    currency: CURRENCY,
  };
}

export function buildCampaignContext() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('cid') || params.get('utm_campaign') || getMetadata('campaign-id') || '';
  return {
    campaignId,
    source: params.get('utm_source') || '',
    medium: params.get('utm_medium') || '',
    content: params.get('utm_content') || '',
    term: params.get('utm_term') || '',
    internalCampaignId: params.get('icid') || '',
  };
}

/**
 * Builds the user object from the visitor profile.
 * @param {Object} profile visitor profile
 * @param {string[]} audiences qualified audiences
 * @param {string} audienceType primary audience
 */
export function buildUserContext(profile, audiences, audienceType) {
  return {
    visitorId: profile.visitorId,
    authState: profile.loggedIn ? 'authenticated' : 'anonymous',
    loginStatus: profile.loggedIn ? 'logged-in' : 'guest',
    customerId: profile.customerId || '',
    visitorType: profile.visitCount > 1 ? 'returning' : 'new',
    visitCount: profile.visitCount,
    loyaltyTier: profile.loyaltyTier,
    member: profile.member,
    orderCount: profile.orderCount,
    lifetimeValue: profile.lifetimeValue,
    audienceType,
    audiences,
  };
}
