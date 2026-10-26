/**
 * Shared product model + product card rendering used by product-grid, product-carousel,
 * wishlist and cart cross-sell.
 *
 * Authored product row (one cell per field, in this order):
 * image | name | sku | price | compare-at price | category | brand | rating | badge | link
 */
import { createOptimizedPicture } from '../aem.js';
import { moveInstrumentation, isSameOriginImage } from '../scripts.js';
import {
  addToCart, toggleWishlist, isInWishlist, formatPrice,
} from './store.js';

const FIELDS = ['image', 'productName', 'productId', 'price', 'compareAtPrice', 'category', 'brand', 'rating', 'badge', 'url'];

const text = (cell) => (cell?.textContent || '').trim();
const num = (value) => parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;

/**
 * Reads a product from an authored block row.
 * @param {Element} row block row
 */
export function parseProductRow(row) {
  const cells = [...row.children];
  const get = (field) => cells[FIELDS.indexOf(field)];
  const img = get('image')?.querySelector('img');
  const link = get('url')?.querySelector('a');
  return {
    productId: text(get('productId')),
    productName: text(get('productName')),
    price: num(text(get('price'))),
    compareAtPrice: num(text(get('compareAtPrice'))),
    category: text(get('category')).toLowerCase(),
    brand: text(get('brand')),
    rating: num(text(get('rating'))),
    badge: text(get('badge')),
    url: link?.getAttribute('href') || text(get('url')),
    image: img?.getAttribute('src') || '',
    imageAlt: img?.getAttribute('alt') || text(get('productName')),
  };
}

function stars(rating) {
  const full = Math.round(rating);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}

function picture(product) {
  if (!product.image) return null;
  if (!isSameOriginImage(product.image)) {
    const pic = document.createElement('picture');
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.imageAlt || product.productName;
    img.loading = 'lazy';
    pic.append(img);
    return pic;
  }
  return createOptimizedPicture(product.image, product.imageAlt || product.productName, false, [{ width: '500' }]);
}

/**
 * Data attributes picked up by the global click tracker (scripts/aep/tracking.js).
 */
export function productTrackingAttrs(el, product, { listName, position }) {
  el.dataset.trackProductId = product.productId;
  el.dataset.trackProductName = product.productName;
  el.dataset.trackCategory = product.category;
  el.dataset.trackPrice = product.price;
  el.dataset.trackListName = listName;
  el.dataset.trackPosition = position;
}

/**
 * Renders a product card.
 * @param {Object} product product
 * @param {Object} options { listName, position, source, event, row }
 */
export function renderProductCard(product, {
  listName = '', position = 1, source = '', event = 'productClick', row = null, headingLevel = 3,
} = {}) {
  const li = document.createElement('li');
  li.className = 'product-card';
  if (row) moveInstrumentation(row, li);
  li.dataset.productId = product.productId;
  li.dataset.category = product.category;
  li.dataset.brand = product.brand;
  li.dataset.price = product.price;
  li.dataset.rating = product.rating;

  const link = document.createElement('a');
  link.className = 'product-card-link';
  link.href = product.url || '#';
  link.dataset.track = event;
  link.dataset.ctaName = product.productName;
  productTrackingAttrs(link, product, { listName, position });

  const media = document.createElement('div');
  media.className = 'product-card-image';
  const pic = picture(product);
  if (pic) media.append(pic);
  if (product.badge) {
    const badge = document.createElement('span');
    badge.className = 'product-card-badge';
    badge.textContent = product.badge;
    media.append(badge);
  }
  const name = document.createElement(`h${headingLevel}`);
  name.className = 'product-card-name';
  name.textContent = product.productName;
  link.append(media, name);
  li.append(link);

  const meta = document.createElement('div');
  meta.className = 'product-card-meta';
  if (product.brand) {
    const brand = document.createElement('p');
    brand.className = 'product-card-brand';
    brand.textContent = product.brand;
    meta.append(brand);
  }
  if (product.rating) {
    const rating = document.createElement('p');
    rating.className = 'product-card-rating';
    rating.innerHTML = `<span aria-hidden="true">${stars(product.rating)}</span> <span class="visually-hidden">Rated</span> ${product.rating.toFixed(1)}<span class="visually-hidden"> out of 5</span>`;
    meta.append(rating);
  }
  const price = document.createElement('p');
  price.className = 'product-card-price';
  price.innerHTML = `<span class="product-card-price-final">${formatPrice(product.price)}</span>`;
  if (product.compareAtPrice > product.price) {
    price.innerHTML += ` <s><span class="visually-hidden">Was </span>${formatPrice(product.compareAtPrice)}</s>`;
    li.dataset.onSale = 'true';
  }
  meta.append(price);
  li.append(meta);

  const actions = document.createElement('div');
  actions.className = 'product-card-actions';
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'button product-card-add';
  add.textContent = 'Add to cart';
  add.setAttribute('aria-label', `Add ${product.productName} to cart`);
  add.dataset.trackHandled = 'true';
  add.addEventListener('click', () => {
    addToCart(product, 1, source || listName);
    add.textContent = 'Added ✓';
    window.setTimeout(() => { add.textContent = 'Add to cart'; }, 1500);
  });

  const wish = document.createElement('button');
  wish.type = 'button';
  wish.className = 'product-card-wishlist';
  wish.dataset.trackHandled = 'true';
  const setWish = (on) => {
    wish.setAttribute('aria-pressed', on);
    wish.setAttribute('aria-label', `${on ? 'Remove' : 'Save'} ${product.productName} ${on ? 'from' : 'to'} wishlist`);
    wish.innerHTML = `<span aria-hidden="true">${on ? '♥' : '♡'}</span>`;
  };
  setWish(isInWishlist(product.productId));
  wish.addEventListener('click', () => setWish(toggleWishlist(product, source || listName)));
  actions.append(add, wish);
  li.append(actions);
  return li;
}

/**
 * Name of a product list for analytics: block "list-name" class, nearest heading, block name.
 */
export function getListName(block) {
  const section = block.closest('.section');
  const heading = section?.querySelector('h2, h3');
  const slug = (heading?.textContent || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return block.dataset.listName || slug || block.dataset.blockName;
}
