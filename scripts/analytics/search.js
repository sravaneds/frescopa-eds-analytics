/**
 * Search engagement tracking (event: searchInteraction).
 *
 * action: open | submit | suggestion-click | result-click | results-view | clear | error
 * location: header | search-block | product-grid
 *
 * Search terms are normalized and anything that looks like an email address or a long
 * number (phone, card, order number) is redacted before it reaches the data layer.
 */
import {
  pushDataLayerEvent, trackClicks, cleanText, getElementText, getLinkUrl,
} from './adobe-data-layer.js';

export const SEARCH_EVENT = 'searchInteraction';

/**
 * @param {string} term raw search term
 * @returns {string} lower-case term with personal data redacted, max 100 characters
 */
export function sanitizeSearchTerm(term) {
  return cleanText(term, 200)
    .toLowerCase()
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]')
    .replace(/\d[\d\s-]{5,}\d/g, '[number]')
    .slice(0, 100);
}

/**
 * Pushes a searchInteraction event.
 * @param {string} action see module comment
 * @param {Object} details
 * @param {string} details.location header | search-block | product-grid
 * @param {string} [details.searchTerm] raw term (sanitized here)
 * @param {number} [details.resultCount] number of results, -1 when not known on this page
 * @param {Object} [options] pushDataLayerEvent options
 * @returns {Object|null} pushed entry
 */
export function pushSearch(action, { searchTerm, resultCount, ...details } = {}, options = {}) {
  const component = { type: 'search', action, ...details };
  if (searchTerm !== undefined) component.searchTerm = sanitizeSearchTerm(searchTerm);
  if (resultCount !== undefined) {
    component.resultCount = Number.isFinite(resultCount) ? resultCount : -1;
    component.hasResults = component.resultCount !== 0;
  }
  return pushDataLayerEvent(SEARCH_EVENT, { component }, options);
}

/**
 * Tracks a header search form: submit and suggestion clicks inside the panel
 * (e.g. the Live Search autocomplete popover).
 * @param {HTMLFormElement} form search form
 * @param {Object} [options]
 * @param {Element} [options.suggestions] container of autocomplete suggestion links
 * @param {string} [options.scope] search scope reported with the events
 */
export function trackHeaderSearch(form, { suggestions = null, scope = 'site' } = {}) {
  if (!form || form.dataset.analyticsTracked === 'true') return;
  form.dataset.analyticsTracked = 'true';
  form.addEventListener('submit', (e) => {
    const term = form.elements.q?.value || '';
    if (!term.trim()) return;
    // results are on the next page, so the count is not known yet
    pushSearch('submit', {
      location: 'header', scope, trigger: 'submit', searchTerm: term, resultCount: -1,
    }, { domEvent: e });
  }, true);
  if (suggestions) {
    trackClicks(suggestions, 'a[href]', (link, e) => {
      pushSearch('suggestion-click', {
        location: 'header',
        scope,
        searchTerm: form.elements.q?.value || '',
        suggestionText: getElementText(link),
        suggestionUrl: getLinkUrl(link),
      }, { domEvent: e });
    });
  }
}

/**
 * Tracks clicks on rendered search results.
 * @param {Element} container results container
 * @param {Object} details { location, scope }
 * @param {Function} getTerm returns the term the results belong to
 */
export function trackSearchResults(container, details, getTerm) {
  trackClicks(container, 'a[href]', (link, e) => {
    const results = [...container.querySelectorAll('a[href]')];
    pushSearch('result-click', {
      ...details,
      searchTerm: getTerm(),
      resultText: getElementText(link),
      resultUrl: getLinkUrl(link),
      resultPosition: results.indexOf(link) + 1,
    }, { domEvent: e });
  });
}
