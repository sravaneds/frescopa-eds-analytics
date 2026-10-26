import { loadCSS } from '../../scripts/aem.js';
import { pushEvent } from '../../scripts/aep/datalayer.js';
import { parseProductRow, renderProductCard, getListName } from '../../scripts/aep/product-card.js';

const PRICE_RANGES = [
  {
    id: '0-50', label: 'Under $50', min: 0, max: 50,
  },
  {
    id: '50-150', label: '$50 - $150', min: 50, max: 150,
  },
  {
    id: '150-500', label: '$150 - $500', min: 150, max: 500,
  },
  {
    id: '500-', label: '$500 and up', min: 500, max: Infinity,
  },
];

const SORTS = {
  featured: () => 0,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  name: (a, b) => a.productName.localeCompare(b.productName),
};

const titleCase = (s) => s.replace(/(^|-)([a-z])/g, (m, sep, c) => `${sep ? ' ' : ''}${c.toUpperCase()}`);

function select(id, label, options) {
  const wrap = document.createElement('div');
  wrap.className = 'product-grid-filter';
  wrap.innerHTML = `<label for="${id}">${label}</label><select id="${id}"></select>`;
  const el = wrap.querySelector('select');
  options.forEach(([value, text]) => el.add(new Option(text, value)));
  return wrap;
}

let gridCount = 0;

/**
 * Product grid with filters, sort and keyword search.
 * Each row is a product: image | name | sku | price | compare-at | category | brand | rating
 * | badge | link. Variant "filters" shows the filter toolbar.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  loadCSS(`${window.hlx.codeBasePath}/styles/product-card.css`);
  gridCount += 1;
  const id = `product-grid-${gridCount}`;
  const listName = getListName(block);
  const items = [...block.children].map((row) => ({ row, product: parseProductRow(row) }))
    .filter(({ product }) => product.productId);

  const list = document.createElement('ul');
  list.className = 'product-grid-list';
  list.id = `${id}-list`;
  const cards = items.map(({ row, product }, i) => ({
    product,
    position: i + 1,
    el: renderProductCard(product, {
      listName, position: i + 1, row, source: listName,
    }),
  }));
  cards.forEach(({ el }) => list.append(el));

  block.textContent = '';
  block.dataset.selfTracking = 'true';
  block.dataset.trackImpression = 'productListImpression';
  block.dataset.trackListName = listName;
  block.dataset.trackProductIds = cards.map((c) => c.product.productId).join(',');
  block.dataset.trackResultCount = cards.length;

  const status = document.createElement('p');
  status.className = 'product-grid-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const empty = document.createElement('p');
  empty.className = 'product-grid-empty';
  empty.hidden = true;
  empty.textContent = 'No products match your selection. Try removing a filter.';

  const params = new URLSearchParams(window.location.search);
  const state = {
    q: params.get('q') || '',
    category: params.get('category') || '',
    brand: '',
    price: '',
    sale: false,
    sort: params.get('sort') || 'featured',
  };

  const apply = () => {
    const term = state.q.toLowerCase();
    const range = PRICE_RANGES.find((r) => r.id === state.price);
    const visible = cards.filter(({ product: p }) => (!term || `${p.productName} ${p.brand} ${p.category}`.toLowerCase().includes(term))
      && (!state.category || p.category === state.category)
      && (!state.brand || p.brand === state.brand)
      && (!range || (p.price >= range.min && p.price < range.max))
      && (!state.sale || p.compareAtPrice > p.price));
    const sorted = state.sort === 'featured' ? visible : [...visible].sort((a, b) => SORTS[state.sort](a.product, b.product));
    cards.forEach(({ el }) => { el.hidden = true; });
    sorted.forEach(({ el }) => {
      el.hidden = false;
      list.append(el);
    });
    status.textContent = `${sorted.length} of ${cards.length} products${state.q ? ` for "${state.q}"` : ''}`;
    empty.hidden = sorted.length > 0;
    return sorted.length;
  };

  if (block.classList.contains('filters')) {
    const toolbar = document.createElement('form');
    toolbar.className = 'product-grid-toolbar';
    toolbar.setAttribute('aria-label', 'Filter products');
    const categories = [...new Set(cards.map((c) => c.product.category).filter(Boolean))];
    const brands = [...new Set(cards.map((c) => c.product.brand).filter(Boolean))].sort();

    const search = document.createElement('div');
    search.className = 'product-grid-filter product-grid-keyword';
    search.innerHTML = `<label for="${id}-q">Search</label><input id="${id}-q" type="search" placeholder="Search products" autocomplete="off">`;
    const qInput = search.querySelector('input');
    qInput.value = state.q;
    toolbar.append(search);

    const controls = [];
    if (categories.length > 1) {
      controls.push(['category', select(`${id}-category`, 'Category', [['', 'All categories'], ...categories.map((c) => [c, titleCase(c)])])]);
    }
    if (brands.length > 1) controls.push(['brand', select(`${id}-brand`, 'Brand', [['', 'All brands'], ...brands.map((b) => [b, b])])]);
    controls.push(['price', select(`${id}-price`, 'Price', [['', 'Any price'], ...PRICE_RANGES.map((r) => [r.id, r.label])])]);
    controls.push(['sort', select(`${id}-sort`, 'Sort by', [['featured', 'Featured'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['rating', 'Top rated'], ['name', 'Name']])]);
    controls.forEach(([key, wrap]) => {
      const el = wrap.querySelector('select');
      el.value = state[key];
      el.addEventListener('change', () => {
        state[key] = el.value;
        const resultCount = apply();
        pushEvent(key === 'sort' ? 'sortApply' : 'filterApply', {
          component: 'product-grid',
          listName,
          filterType: key,
          filterValue: el.value || 'all',
          filterLabel: el.options[el.selectedIndex].text,
          resultCount,
        });
      });
      toolbar.append(wrap);
    });

    const sale = document.createElement('div');
    sale.className = 'product-grid-filter product-grid-sale';
    sale.innerHTML = `<input id="${id}-sale" type="checkbox"><label for="${id}-sale">On sale</label>`;
    sale.querySelector('input').addEventListener('change', (e) => {
      state.sale = e.target.checked;
      const resultCount = apply();
      pushEvent('filterApply', {
        component: 'product-grid', listName, filterType: 'sale', filterValue: String(state.sale), resultCount,
      });
    });
    toolbar.append(sale);

    const clear = document.createElement('button');
    clear.type = 'reset';
    clear.className = 'product-grid-clear';
    clear.textContent = 'Clear filters';
    clear.dataset.trackHandled = 'true';
    toolbar.addEventListener('reset', () => {
      Object.assign(state, {
        q: '', category: '', brand: '', price: '', sale: false, sort: 'featured',
      });
      window.setTimeout(() => {
        const resultCount = apply();
        pushEvent('filterClear', { component: 'product-grid', listName, resultCount });
      });
    });
    toolbar.append(clear);

    const submitSearch = () => {
      state.q = qInput.value.trim();
      const resultCount = apply();
      if (state.q) {
        pushEvent(resultCount ? 'searchSubmit' : 'searchNoResults', {
          SearchTerm: state.q, searchType: 'product', resultCount, component: 'product-grid', listName,
        });
      }
    };
    let timer;
    qInput.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(submitSearch, 800);
    });
    toolbar.addEventListener('submit', (e) => {
      e.preventDefault();
      window.clearTimeout(timer);
      submitSearch();
    });
    block.append(toolbar);
  }

  // keyword search from the Search block or the header
  document.addEventListener('aep:product-search', (e) => {
    state.q = e.detail.term || '';
    const input = block.querySelector('.product-grid-keyword input');
    if (input) input.value = state.q;
    e.detail.resultCount = apply();
  });

  block.append(status, list, empty);
  apply();
  if (state.q) {
    pushEvent('searchResultsView', {
      SearchTerm: state.q, searchType: 'product', resultCount: list.querySelectorAll('.product-card:not([hidden])').length, listName,
    });
  }
}
