import { loadCSS } from '../../scripts/aem.js';
import { pushEvent, SITE_ROOT } from '../../scripts/aep/datalayer.js';
import { getWishlist } from '../../scripts/aep/store.js';
import { renderProductCard } from '../../scripts/aep/product-card.js';

/**
 * Wishlist (demo store). Optional authored row: empty-wishlist message.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  loadCSS(`${window.hlx.codeBasePath}/styles/product-card.css`);
  const emptyContent = block.firstElementChild?.firstElementChild;
  const emptyHTML = emptyContent?.innerHTML.trim()
    || `<h2>Your wishlist is empty</h2><p>Tap the heart on any product to save it for later.</p><p><a class="button" href="${SITE_ROOT}/shop">Browse products</a></p>`;
  block.dataset.selfTracking = 'true';

  const render = () => {
    const items = getWishlist();
    block.textContent = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'wishlist-empty';
      empty.innerHTML = emptyHTML;
      block.append(empty);
      return;
    }
    const count = document.createElement('p');
    count.className = 'wishlist-count';
    count.textContent = `${items.length} saved item${items.length === 1 ? '' : 's'}`;
    const list = document.createElement('ul');
    list.className = 'wishlist-list';
    items.forEach((product, i) => {
      list.append(renderProductCard(product, { listName: 'wishlist', position: i + 1, source: 'wishlist' }));
    });
    block.append(count, list);
  };
  render();
  document.addEventListener('aep:store-updated', (e) => {
    if (e.detail?.key === 'aep:wishlist') render();
  });
  pushEvent('wishlistView', { itemCount: getWishlist().length });
}
