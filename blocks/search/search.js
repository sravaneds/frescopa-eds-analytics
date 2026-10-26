import { pushEvent, SITE_ROOT } from '../../scripts/aep/datalayer.js';

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

/**
 * Search block.
 * Rows (model order): placeholder | scope (products, content, stores) | popular terms
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

  const run = (term, trigger) => {
    if (scope === 'products') {
      const detail = { term, resultCount: null };
      document.dispatchEvent(new CustomEvent('aep:product-search', { detail }));
      if (detail.resultCount === null) {
        pushEvent('searchSubmit', {
          SearchTerm: term, searchType, trigger, component: 'search', resultCount: -1,
        });
        window.location.href = `${SITE_ROOT}/products?q=${encodeURIComponent(term)}`;
        return;
      }
      status.textContent = `${detail.resultCount} result${detail.resultCount === 1 ? '' : 's'} for "${term}"`;
      pushEvent(detail.resultCount ? 'searchSubmit' : 'searchNoResults', {
        SearchTerm: term, searchType, trigger, component: 'search', resultCount: detail.resultCount,
      });
      return;
    }
    const resultCount = filterPage(term, block);
    status.textContent = term ? `${resultCount} result${resultCount === 1 ? '' : 's'} for "${term}"` : '';
    if (term) {
      pushEvent(resultCount ? 'searchSubmit' : 'searchNoResults', {
        SearchTerm: term, searchType, trigger, component: 'search', resultCount,
      });
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
        run(term, 'suggestion');
      });
      chips.append(chip);
    });
    block.append(chips);
  }
}
