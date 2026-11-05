/**
 * Page-view schema for the Adobe Client Data Layer, pushed once on every page.
 *
 * What is pushed into window.adobeDataLayer:
 * {
 *   event: 'pageviewer',                 // lets an Adobe Tags rule listen for this push
 *   page: {
 *     event: 'pageviewer',
 *     pageInfo: { pageName, pageType, sitePath },
 *     urlInfo: { host, queryParamsInfo },
 *   },
 *   campainInfo: { utm_campaign, utm_medium, utm_source, at_src },
 * }
 * A value that is not available on the opened page is null.
 * The objects are merged into the data layer state, next to the objects already there
 * (adobeDataLayer.getState('page.pageInfo'), getState('campainInfo')).
 */
import { getMetadata } from './aem.js';

const EVENT_NAME = 'pageviewer';
const CAMPAIGN_PARAMS = ['utm_campaign', 'utm_medium', 'utm_source', 'at_src'];

/** Trimmed text, or null when the value is missing or empty. */
const valueOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
};

/**
 * pageName and pageType from the page information.
 * Training pages (template "aep-training") use the same values as the existing `page`
 * object (e.g. novamart:shop / shop). Other pages use the "page-name" / "page-type" page
 * properties, then the page title and the page type detected by scripts.js.
 * @param {string} detectedPageType page type detected in loadEager (CMS, Product, ...)
 */
async function getPageInfo(detectedPageType) {
  let pageName = valueOrNull(getMetadata('page-name'));
  let pageType = valueOrNull(getMetadata('page-type'));
  if (document.body.classList.contains('aep-training')) {
    const { buildPageContext } = await import('./aep/datalayer.js');
    const context = buildPageContext();
    pageName = pageName || valueOrNull(context.pageName);
    pageType = pageType || valueOrNull(context.pageType);
  }
  return {
    pageName: pageName || valueOrNull(document.title),
    pageType: pageType || valueOrNull(detectedPageType),
    sitePath: valueOrNull(window.location.pathname),
  };
}

/** host and query string of the opened URL; queryParamsInfo is null without query params. */
function getUrlInfo() {
  const { host, search } = window.location;
  return {
    host: valueOrNull(host),
    queryParamsInfo: search && search.length > 1 ? valueOrNull(search.slice(1)) : null,
  };
}

/** Campaign parameters from the opened URL; each one is null when it is not in the URL. */
function getCampaignInfo() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(CAMPAIGN_PARAMS.map((name) => [name, valueOrNull(params.get(name))]));
}

async function push(detectedPageType) {
  try {
    const pageInfo = await getPageInfo(detectedPageType);
    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push({
      event: EVENT_NAME,
      page: {
        event: EVENT_NAME,
        pageInfo,
        urlInfo: getUrlInfo(),
      },
      campainInfo: getCampaignInfo(),
    });
  } catch (e) {
    console.warn('page-view schema could not be pushed', e);
  }
}

/**
 * Pushes the page-view schema. A page that the browser prerenders (speculation rules) is
 * only pushed once the visitor actually opens it.
 * @param {string} detectedPageType page type detected in loadEager (CMS, Product, ...)
 */
export default function pushPageViewSchema(detectedPageType) {
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', () => push(detectedPageType), { once: true });
  } else {
    push(detectedPageType);
  }
}
