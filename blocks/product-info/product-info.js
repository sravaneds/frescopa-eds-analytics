import { createOptimizedPicture } from '../../scripts/aem.js';
import { isSameOriginImage } from '../../scripts/scripts.js';
import { pushEvent, pushState, CURRENCY } from '../../scripts/aep/datalayer.js';
import { recordProductView } from '../../scripts/aep/profile.js';
import {
  addToCart, toggleWishlist, isInWishlist, formatPrice,
} from '../../scripts/aep/store.js';
import { addJsonLd } from '../../scripts/aep/seo.js';

const text = (cell) => (cell?.textContent || '').trim();
const num = (cell) => parseFloat(text(cell).replace(/[^0-9.]/g, '')) || 0;

function buildGallery(pictures, product) {
  const gallery = document.createElement('div');
  gallery.className = 'product-info-gallery';
  const main = document.createElement('button');
  main.type = 'button';
  main.className = 'product-info-main-image';
  main.setAttribute('aria-label', 'Zoom image');
  main.dataset.trackHandled = 'true';
  const thumbs = document.createElement('div');
  thumbs.className = 'product-info-thumbs';
  const sources = pictures.map((pic) => {
    const img = pic.querySelector('img');
    return { src: img.getAttribute('src'), alt: img.alt || product.productName };
  });
  const render = (index) => {
    const { src, alt } = sources[index];
    const pic = isSameOriginImage(src)
      ? createOptimizedPicture(src, alt, index === 0, [{ width: '900' }])
      : Object.assign(document.createElement('img'), { src, alt });
    main.replaceChildren(pic);
    thumbs.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', i === index));
  };
  sources.forEach(({ src, alt }, i) => {
    if (sources.length < 2) return;
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.dataset.trackHandled = 'true';
    thumb.setAttribute('aria-label', `Show image ${i + 1} of ${sources.length}`);
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    thumb.append(img);
    thumb.addEventListener('click', () => {
      render(i);
      pushEvent('galleryInteraction', {
        component: 'product-info', action: 'thumbnail', imageIndex: i + 1, imageAlt: alt, productId: product.productId,
      });
    });
    thumbs.append(thumb);
  });
  main.addEventListener('click', () => {
    const zoomed = gallery.classList.toggle('zoomed');
    main.setAttribute('aria-label', zoomed ? 'Zoom out' : 'Zoom image');
    pushEvent('galleryInteraction', {
      component: 'product-info', action: zoomed ? 'zoom-in' : 'zoom-out', productId: product.productId,
    });
  });
  if (sources.length) render(0);
  gallery.append(main, thumbs);
  return gallery;
}

/**
 * Product details (PDP buy box).
 * Rows (model order): images | name | sku | price | compare-at price | brand | category | rating
 * | review count | description | options (comma separated colours/sizes)
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cells = [...block.children].map((row) => row.firstElementChild);
  const [imagesCell, nameCell, skuCell, priceCell, compareCell, brandCell, categoryCell,
    ratingCell, reviewsCell, descriptionCell, optionsCell] = cells;
  const product = {
    productId: text(skuCell),
    productName: text(nameCell),
    price: num(priceCell),
    compareAtPrice: num(compareCell),
    brand: text(brandCell),
    category: text(categoryCell).toLowerCase(),
    rating: num(ratingCell),
    reviewCount: num(reviewsCell),
    url: window.location.pathname,
  };
  const pictures = [...(imagesCell?.querySelectorAll('picture') || [])];
  product.image = pictures[0]?.querySelector('img')?.getAttribute('src') || '';
  const options = text(optionsCell).split(',').map((o) => o.trim()).filter(Boolean);

  const info = document.createElement('div');
  info.className = 'product-info-details';
  info.innerHTML = `
    <p class="product-info-brand"></p>
    <h1 class="product-info-name"></h1>
    <p class="product-info-sku">SKU: <span></span></p>
    <a class="product-info-rating" href="#reviews" data-track="reviewsClick"></a>
    <p class="product-info-price"></p>
    <fieldset class="product-info-options" hidden><legend>Colour</legend></fieldset>
    <div class="product-info-buy">
      <label for="product-info-qty">Quantity</label>
      <input id="product-info-qty" type="number" min="1" max="10" value="1" inputmode="numeric">
      <button type="button" class="button product-info-add">Add to cart</button>
      <button type="button" class="button secondary product-info-wishlist"></button>
    </div>
    <p class="product-info-message" role="status" aria-live="polite"></p>
    <p class="product-info-delivery">Free standard shipping on orders over $75. 30-day returns.</p>
    <div class="product-info-description"></div>`;
  info.querySelector('.product-info-brand').textContent = product.brand;
  info.querySelector('.product-info-name').textContent = product.productName;
  info.querySelector('.product-info-sku span').textContent = product.productId;
  const rating = info.querySelector('.product-info-rating');
  if (product.rating) {
    rating.textContent = `★ ${product.rating.toFixed(1)} (${product.reviewCount} reviews)`;
    rating.setAttribute('aria-label', `Rated ${product.rating} out of 5, read ${product.reviewCount} reviews`);
    rating.dataset.trackProductId = product.productId;
  } else rating.remove();
  const price = info.querySelector('.product-info-price');
  price.innerHTML = `<span>${formatPrice(product.price)}</span>`;
  if (product.compareAtPrice > product.price) {
    const save = Math.round(100 - (product.price / product.compareAtPrice) * 100);
    price.innerHTML += ` <s><span class="visually-hidden">Was </span>${formatPrice(product.compareAtPrice)}</s> <strong>Save ${save}%</strong>`;
  }
  if (descriptionCell) info.querySelector('.product-info-description').append(...descriptionCell.childNodes);

  const fieldset = info.querySelector('.product-info-options');
  let selectedOption = options[0] || '';
  if (options.length) {
    fieldset.hidden = false;
    options.forEach((option, i) => {
      const id = `product-option-${i}`;
      fieldset.insertAdjacentHTML('beforeend', `<input type="radio" name="product-option" id="${id}" ${i === 0 ? 'checked' : ''}><label for="${id}"></label>`);
      const input = fieldset.querySelector(`#${id}`);
      input.value = option;
      fieldset.querySelector(`label[for="${id}"]`).textContent = option;
      input.addEventListener('change', () => {
        selectedOption = option;
        pushEvent('productOptionSelect', {
          productId: product.productId, optionType: 'colour', optionValue: option,
        });
      });
    });
  }

  const qty = info.querySelector('#product-info-qty');
  const message = info.querySelector('.product-info-message');
  const add = info.querySelector('.product-info-add');
  add.dataset.trackHandled = 'true';
  add.addEventListener('click', () => {
    const quantity = Math.max(1, Math.min(10, parseInt(qty.value, 10) || 1));
    addToCart({ ...product, productName: product.productName, option: selectedOption }, quantity, 'pdp');
    message.textContent = `${quantity} × ${product.productName} added to your cart.`;
  });
  const wish = info.querySelector('.product-info-wishlist');
  wish.dataset.trackHandled = 'true';
  const setWish = (on) => {
    wish.textContent = on ? '♥ Saved to wishlist' : '♡ Add to wishlist';
    wish.setAttribute('aria-pressed', on);
  };
  setWish(isInWishlist(product.productId));
  wish.addEventListener('click', () => setWish(toggleWishlist(product, 'pdp')));

  block.textContent = '';
  block.append(buildGallery(pictures, product), info);

  recordProductView({
    productId: product.productId,
    productName: product.productName,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    category: product.category,
    brand: product.brand,
    rating: product.rating,
    image: product.image,
    url: product.url,
  });
  const productState = {
    productId: product.productId,
    productName: product.productName,
    category: product.category,
    brand: product.brand,
    price: product.price,
    currency: CURRENCY,
    rating: product.rating,
    inStock: true,
  };
  pushState({ product: productState });
  pushEvent('productView', productState);

  addJsonLd('product', {
    '@type': 'Product',
    name: product.productName,
    sku: product.productId,
    brand: { '@type': 'Brand', name: product.brand },
    image: product.image ? new URL(product.image, window.location.href).href : undefined,
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount,
    } : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: CURRENCY,
      availability: 'https://schema.org/InStock',
      url: window.location.href,
    },
  });
}
