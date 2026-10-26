import { loadCSS, getMetadata } from '../../scripts/aem.js';
import { pushEvent } from '../../scripts/aep/datalayer.js';
import { getProfile } from '../../scripts/aep/profile.js';
import { parseProductRow, renderProductCard, getListName } from '../../scripts/aep/product-card.js';

/**
 * Horizontally scrolling product list.
 * Rows: products (same fields as Product Grid).
 * Variants:
 *  - recently-viewed: products come from the visitor profile (authored rows are a fallback)
 *  - recommendations: tracked as recommendationClick (Adobe Target Recommendations location)
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  loadCSS(`${window.hlx.codeBasePath}/styles/product-card.css`);
  const listName = getListName(block);
  const recentlyViewed = block.classList.contains('recently-viewed');
  const isRecs = recentlyViewed || block.classList.contains('recommendations');
  const event = isRecs ? 'recommendationClick' : 'productCarouselClick';

  let items = [...block.children].map((row) => ({ row, product: parseProductRow(row) }))
    .filter(({ product }) => product.productId);
  if (recentlyViewed) {
    const current = getMetadata('product-id');
    const viewed = getProfile().recentlyViewed.filter((p) => p.productId !== current);
    if (viewed.length) items = viewed.map((product) => ({ row: null, product }));
  }
  block.textContent = '';
  if (!items.length) {
    block.closest('.section')?.classList.add('product-carousel-empty');
    return;
  }

  const list = document.createElement('ul');
  list.className = 'product-carousel-list';
  list.setAttribute('tabindex', '0');
  list.setAttribute('aria-label', listName.replace(/-/g, ' '));
  items.forEach(({ row, product }, i) => {
    list.append(renderProductCard(product, {
      listName, position: i + 1, row, event, source: listName,
    }));
  });

  const scrollBy = (dir) => {
    const card = list.querySelector('.product-card');
    list.scrollBy({ left: dir * (card ? card.offsetWidth + 16 : 300), behavior: 'smooth' });
    pushEvent('carouselNavigate', {
      component: 'product-carousel', listName, action: dir > 0 ? 'next' : 'previous',
    });
  };
  const nav = document.createElement('div');
  nav.className = 'product-carousel-nav';
  [['previous', -1], ['next', 1]].forEach(([label, dir]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `product-carousel-${label}`;
    button.setAttribute('aria-label', `Scroll ${label} products`);
    button.dataset.trackHandled = 'true';
    button.addEventListener('click', () => scrollBy(dir));
    nav.append(button);
  });

  block.dataset.selfTracking = 'true';
  block.dataset.trackImpression = isRecs ? 'recommendationImpression' : 'productListImpression';
  block.dataset.trackListName = listName;
  block.dataset.trackProductIds = items.map((i) => i.product.productId).join(',');
  block.dataset.trackSource = recentlyViewed ? 'recently-viewed' : 'authored';
  block.append(nav, list);
}
