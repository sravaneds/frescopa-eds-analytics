import { pushEvent, SITE_ROOT, CURRENCY } from '../../scripts/aep/datalayer.js';
import { loadIndex, searchIndex } from '../../scripts/aep/site-index.js';
import { pushSearch, trackSearchResults } from '../../scripts/analytics/search.js';

let searchCount = 0;

const FILTER_TARGETS = 'main .cards li, main .faq-item, main .accordion-item, main .product-card';

function filterPage(term, block) {
  const items = [...document.querySelectorAll(FILTER_TARGETS)].filter((el) => !block.contains(el));
  let count = 0;
  items.forEach((el) => {
    const match = !term || el.textContent.toLowerCase().includes(term.toLowerCase());
    el.hidden = !match;
    if (match) count += 1;
  });
  return count;
}

const TYPE_LABELS = {
  product: 'Product',
  category: 'Category',
  'product-listing': 'Products',
  merchandising: 'Collection',
  article: 'Article',
  blog: 'Blog',
  support: 'Help',
  faq: 'Help',
  contact: 'Help',
  'store-locator': 'Stores',
  membership: 'Rewards',
  legal: 'Legal',
};

function renderResults(container, results, term) {
  container.textContent = '';
  if (!results.length) {
    const empty = document.createElement('p');
    empty.className = 'search-results-empty';
    empty.textContent = `No results for "${term}". Try a different word, or browse the shop.`;
    container.append(empty);
    return;
  }
  const list = document.createElement('ol');
  list.className = 'search-results-list';
  results.forEach((row, i) => {
    const li = document.createElement('li');
    li.className = 'search-result';
    const link = document.createElement('a');
    link.href = row.path;
    link.dataset.track = 'searchResultClick';
    link.dataset.ctaName = row.title;
    link.dataset.trackSearchTerm = term;
    link.dataset.trackPosition = i + 1;
    link.dataset.trackResultType = row.pageType || '';
    if (row.productId) link.dataset.trackProductId = row.productId;
    const title = document.createElement('h3');
    title.textContent = row.title;
    link.append(title);
    li.append(link);
    const meta = document.createElement('p');
    meta.className = 'search-result-meta';
    const label = TYPE_LABELS[row.pageType] || 'Page';
    const price = parseFloat(row.productPrice);
    meta.textContent = [
      label,
      row.category && row.pageType !== 'blog' ? row.category.replace(/-/g, ' ') : '',
      price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY }).format(price) : '',
    ].filter(Boolean).join(' · ');
    li.append(meta);
    if (row.description) {
      const description = document.createElement('p');
      description.className = 'search-result-description';
      description.textContent = row.description;
      li.append(description);
    }
    list.append(li);
  });
  container.append(list);
}

/**
 * Search block.
 * Rows (model order): placeholder | scope (site, products, content, stores) | popular terms
 *  - site: searches all published pages via the query index and lists the results
 *  - products: filters the Product Grid on the page or opens the product listing page
 *  - content / stores: filters cards, FAQ and accordion items on the page
 * @param {Element} block The block element
 */
export default function decorate(block) {
  searchCount += 1;
  const cells = [...block.children].map((r) => r.firstElementChild);
  const [placeholderCell, scopeCell, popularCell] = cells;
  const placeholder = (placeholderCell?.textContent || '').trim() || 'Search products';
  const scope = ((scopeCell?.textContent || '').trim() || 'products').toLowerCase();
  const popular = (popularCell?.textContent || '').split(',').map((t) => t.trim()).filter(Boolean);
  const id = `search-${searchCount}`;

  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');
  form.innerHTML = `
    <label for="${id}" class="visually-hidden"></label>
    <input id="${id}" name="q" type="search" autocomplete="off">
    <button type="submit" class="button">Search</button>
    <p class="search-status" role="status" aria-live="polite"></p>`;
  form.querySelector('label').textContent = placeholder;
  const input = form.querySelector('input');
  input.placeholder = placeholder;
  input.value = new URLSearchParams(window.location.search).get('q') || '';
  const status = form.querySelector('.search-status');
  const searchType = scope === 'stores' ? 'store' : scope;

  const results = document.createElement('div');
  results.className = 'search-results';

  // analytics (searchInteraction): shared attributes of this search block
  const analytics = { location: 'search-block', scope };
  trackSearchResults(results, analytics, () => input.value);

  const runSite = async (term, trigger) => {
    const url = new URL(window.location.href);
    if (term) url.searchParams.set('q', term);
    else url.searchParams.delete('q');
    window.history.replaceState(null, '', url);
    if (!term) {
      status.textContent = '';
      results.textContent = '';
      if (trigger === 'clear') pushSearch('clear', analytics);
      return;
    }
    status.textContent = 'Searching…';
    try {
      const rows = await loadIndex();
      const found = searchIndex(rows, term);
      status.textContent = `${found.length} result${found.length === 1 ? '' : 's'} for "${term}"`;
      renderResults(results, found, term);
      pushEvent(found.length ? 'searchSubmit' : 'searchNoResults', {
        SearchTerm: term, searchType, trigger, component: 'search', resultCount: found.length,
      });
      pushSearch('submit', {
        ...analytics, trigger, searchTerm: term, resultCount: found.length,
      });
    } catch (e) {
      status.textContent = 'Search is not available right now. Please try again later.';
      results.textContent = '';
      pushEvent('searchError', {
        SearchTerm: term, searchType, trigger, component: 'search', errorMessage: e.message,
      });
      pushSearch('error', { ...analytics, trigger, searchTerm: term });
    }
  };

  const run = (term, trigger) => {
    if (scope === 'site') {
      runSite(term, trigger);
      return;
    }
    if (scope === 'products') {
      const detail = { term, resultCount: null };
      document.dispatchEvent(new CustomEvent('aep:product-search', { detail }));
      if (detail.resultCount === null) {
        pushEvent('searchSubmit', {
          SearchTerm: term, searchType, trigger, component: 'search', resultCount: -1,
        });
        // results are counted on the product listing page (results-view)
        pushSearch('submit', {
          ...analytics, trigger, searchTerm: term, resultCount: -1,
        });
        window.location.href = `${SITE_ROOT}/products?q=${encodeURIComponent(term)}`;
        return;
      }
      status.textContent = `${detail.resultCount} result${detail.resultCount === 1 ? '' : 's'} for "${term}"`;
      pushEvent(detail.resultCount ? 'searchSubmit' : 'searchNoResults', {
        SearchTerm: term, searchType, trigger, component: 'search', resultCount: detail.resultCount,
      });
      if (term) {
        pushSearch('submit', {
          ...analytics, trigger, searchTerm: term, resultCount: detail.resultCount,
        });
      } else if (trigger === 'clear') {
        pushSearch('clear', analytics);
      }
      return;
    }
    const resultCount = filterPage(term, block);
    status.textContent = term ? `${resultCount} result${resultCount === 1 ? '' : 's'} for "${term}"` : '';
    if (term) {
      pushEvent(resultCount ? 'searchSubmit' : 'searchNoResults', {
        SearchTerm: term, searchType, trigger, component: 'search', resultCount,
      });
      pushSearch('submit', {
        ...analytics, trigger, searchTerm: term, resultCount,
      });
    } else if (trigger === 'clear') {
      pushSearch('clear', analytics);
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run(input.value.trim(), 'submit');
  });
  input.addEventListener('search', () => {
    if (!input.value) run('', 'clear');
  });

  block.textContent = '';
  block.dataset.selfTracking = 'true';
  block.append(form);
  if (scope === 'site') {
    block.append(results);
    if (input.value.trim()) runSite(input.value.trim(), 'url');
  }

  if (popular.length) {
    const chips = document.createElement('div');
    chips.className = 'search-popular';
    chips.innerHTML = '<span>Popular:</span>';
    popular.forEach((term) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.textContent = term;
      chip.dataset.trackHandled = 'true';
      chip.addEventListener('click', () => {
        input.value = term;
        pushEvent('searchSuggestionClick', { SearchTerm: term, searchType, component: 'search' });
        pushSearch('suggestion-click', { ...analytics, searchTerm: term, suggestionText: term });
        run(term, 'suggestion');
      });
      chips.append(chip);
    });
    form.after(chips);
  }
}
