/**
 * Entry point of the AEP training runtime. Only used on pages with the
 * "aep-training" template so other site pages are not affected.
 *
 * Eager:   visitor profile -> audiences -> personalization -> data layer state + pageView
 * Lazy:    interaction tracking, proposition display tracking, JSON-LD, debug panel
 * Delayed: Adobe Tags (Launch) embed and Adobe Target decisions via Web SDK
 */
import { getMetadata, loadScript, loadCSS } from '../aem.js';
import {
  pushState, pushEvent, buildPageContext, buildProductContext, buildCampaignContext,
  buildUserContext, getState,
} from './datalayer.js';
import {
  startVisit, getAudiences, getPrimaryAudience, recordCategoryView, recordArticleRead,
  updateProfile,
} from './profile.js';
import { getCart, cartState } from './store.js';
import {
  applyPersonalization, buildPersonalizationContext, trackPropositions, requestTargetDecisions,
} from './personalization.js';

const LAUNCH_KEY = 'aep:launch-url';
const DEBUG_KEY = 'aep:debug';

export function isTrainingPage() {
  return document.body.classList.contains('aep-training');
}

function pageEvents(page) {
  if (page.pageType === 'category' || page.pageType === 'product-listing') {
    recordCategoryView(page.category);
    pushEvent('categoryView', { category: page.category, pageType: page.pageType });
  }
  if (page.pageType === 'article') {
    recordArticleRead(page.pageId);
    pushEvent('articleView', {
      articleId: page.pageId,
      articleTitle: document.querySelector('main h1')?.textContent.trim() || page.title,
      author: getMetadata('author'),
      articleCategory: page.category,
      publishedDate: getMetadata('published-date'),
    });
  }
  if (page.pageType === 'error') {
    pushEvent('errorPageView', { errorCode: '404', requestedUrl: page.url, referrer: document.referrer });
  }
}

/**
 * Runs before the first section loads (no network requests, localStorage only).
 * @param {Element} main decorated main element
 */
export function initEager(main) {
  const profile = startVisit();
  const cart = getCart();
  const audiences = getAudiences(cart);
  const propositions = applyPersonalization(main, { audiences, visitorId: profile.visitorId });
  const page = buildPageContext();
  const campaign = buildCampaignContext();
  if (campaign.campaignId) updateProfile((p) => { p.lastCampaignId = campaign.campaignId; });

  pushState({
    page,
    user: buildUserContext(profile, audiences, getPrimaryAudience(audiences)),
    product: buildProductContext(),
    ...cartState(),
    campaign,
    personalization: buildPersonalizationContext(propositions),
  });
  pushEvent('pageView', {
    pageType: page.pageType,
    category: page.category,
    audienceType: getState('user.audienceType'),
    personalizationVariant: getState('personalization.personalizationVariant'),
  });
  pageEvents(page);
}

function debugEnabled() {
  const param = new URLSearchParams(window.location.search).get('aep-debug');
  if (param === '0' || param === 'false') sessionStorage.removeItem(DEBUG_KEY);
  else if (param !== null) sessionStorage.setItem(DEBUG_KEY, 'true');
  return sessionStorage.getItem(DEBUG_KEY) === 'true';
}

export async function initLazy(main) {
  const [{ default: initTracking }, { default: decorateSeo }] = await Promise.all([
    import('./tracking.js'),
    import('./seo.js'),
  ]);
  initTracking();
  trackPropositions(main);
  decorateSeo();
  if (debugEnabled()) {
    loadCSS(`${window.hlx.codeBasePath}/scripts/aep/debug-panel.css`);
    const { default: initDebugPanel } = await import('./debug-panel.js');
    initDebugPanel();
  }
}

/**
 * Adobe Tags embed URL from page metadata "Launch URL" (bulk metadata recommended) or a
 * trainee override stored with localStorage.setItem('aep:launch-url', '<embed url>').
 * Only Adobe hosted embeds (assets.adobedtm.com) are accepted.
 */
function getLaunchUrl() {
  const candidates = [localStorage.getItem(LAUNCH_KEY), getMetadata('launch-url')];
  return candidates.find((url) => {
    if (!url) return false;
    try {
      const { protocol, hostname } = new URL(url);
      return protocol === 'https:' && hostname === 'assets.adobedtm.com';
    } catch (e) {
      return false;
    }
  }) || '';
}

export async function initDelayed(main) {
  const launchUrl = getLaunchUrl();
  if (!launchUrl) return;
  await loadScript(launchUrl, { async: '' });
  await requestTargetDecisions(main);
}
