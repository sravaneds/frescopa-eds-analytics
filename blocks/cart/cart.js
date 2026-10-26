import { createOptimizedPicture } from '../../scripts/aem.js';
import { pushEvent, SITE_ROOT } from '../../scripts/aep/datalayer.js';
import {
  getCart, updateQuantity, removeFromCart, applyCoupon, removeCoupon, formatPrice,
} from '../../scripts/aep/store.js';

const FREE_SHIPPING = 75;

function itemRow(item) {
  const li = document.createElement('li');
  li.className = 'cart-item';
  li.dataset.productId = item.productId;
  const media = document.createElement('div');
  media.className = 'cart-item-image';
  if (item.image) media.append(createOptimizedPicture(item.image, '', false, [{ width: '160' }]));
  const details = document.createElement('div');
  details.className = 'cart-item-details';
  details.innerHTML = `
    <a class="cart-item-name"></a>
    <p class="cart-item-price"></p>
    <div class="cart-item-qty">
      <button type="button" class="cart-qty-minus" aria-label="Decrease quantity">−</button>
      <input type="number" min="0" max="10" inputmode="numeric" aria-label="Quantity">
      <button type="button" class="cart-qty-plus" aria-label="Increase quantity">+</button>
    </div>
    <button type="button" class="cart-item-remove">Remove</button>`;
  const name = details.querySelector('.cart-item-name');
  name.textContent = item.productName;
  name.href = item.url || '#';
  name.dataset.track = 'productClick';
  name.dataset.trackProductId = item.productId;
  name.dataset.trackListName = 'cart';
  details.querySelector('.cart-item-price').textContent = `${formatPrice(item.price)} each`;
  const input = details.querySelector('input');
  input.value = item.quantity;
  details.querySelector('.cart-qty-minus').addEventListener('click', () => updateQuantity(item.productId, item.quantity - 1));
  details.querySelector('.cart-qty-plus').addEventListener('click', () => updateQuantity(item.productId, item.quantity + 1));
  input.addEventListener('change', () => updateQuantity(item.productId, parseInt(input.value, 10) || 0));
  details.querySelector('.cart-item-remove').setAttribute('aria-label', `Remove ${item.productName}`);
  details.querySelector('.cart-item-remove').addEventListener('click', () => removeFromCart(item.productId, 'cart'));
  const total = document.createElement('p');
  total.className = 'cart-item-total';
  total.textContent = formatPrice(item.price * item.quantity);
  li.append(media, details, total);
  li.querySelectorAll('button').forEach((b) => { b.dataset.trackHandled = 'true'; });
  return li;
}

function couponForm(cart, onMessage) {
  const form = document.createElement('form');
  form.className = 'cart-coupon';
  if (cart.couponCode) {
    form.innerHTML = '<p>Coupon <code></code> applied. <button type="button">Remove</button></p>';
    form.querySelector('code').textContent = cart.couponCode;
    const button = form.querySelector('button');
    button.dataset.trackHandled = 'true';
    button.addEventListener('click', () => removeCoupon());
    return form;
  }
  form.innerHTML = `
    <label for="cart-coupon-code">Coupon code</label>
    <div><input id="cart-coupon-code" name="code" autocomplete="off" placeholder="e.g. SAVE10"><button type="submit" class="button secondary">Apply</button></div>`;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { ok, message } = applyCoupon(form.elements.code.value);
    onMessage(message, ok);
  });
  return form;
}

/**
 * Shopping cart (demo store). Optional authored row: empty-cart message.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const emptyContent = block.firstElementChild?.firstElementChild;
  const emptyHTML = emptyContent?.innerHTML.trim()
    || `<h2>Your cart is empty</h2><p><a href="${SITE_ROOT}/shop">Continue shopping</a></p>`;
  block.dataset.selfTracking = 'true';
  let message = { text: '', ok: true };

  const render = () => {
    const cart = getCart();
    block.textContent = '';
    if (!cart.items.length) {
      const empty = document.createElement('div');
      empty.className = 'cart-empty';
      empty.innerHTML = emptyHTML;
      block.append(empty);
      return;
    }
    const list = document.createElement('ul');
    list.className = 'cart-items';
    list.setAttribute('aria-label', 'Items in your cart');
    cart.items.forEach((item) => list.append(itemRow(item)));

    const summary = document.createElement('aside');
    summary.className = 'cart-summary';
    summary.setAttribute('aria-label', 'Order summary');
    const remaining = Math.max(0, FREE_SHIPPING - cart.subtotal);
    const progress = Math.min(100, Math.round((cart.subtotal / FREE_SHIPPING) * 100));
    summary.innerHTML = `
      <h2>Order summary</h2>
      <p class="cart-shipping-progress">${remaining > 0 ? `You're ${formatPrice(remaining)} away from free shipping.` : 'You qualify for free standard shipping!'}</p>
      <div class="cart-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" aria-label="Free shipping progress"><span style="width:${progress}%"></span></div>
      <dl>
        <dt>Subtotal (${cart.itemCount} items)</dt><dd>${formatPrice(cart.subtotal)}</dd>
        ${cart.discount ? `<dt>Discount</dt><dd>−${formatPrice(cart.discount)}</dd>` : ''}
        <dt>Shipping</dt><dd>${cart.freeShipping ? 'Free' : 'Calculated at checkout'}</dd>
        <dt class="cart-total">Total</dt><dd class="cart-total">${formatPrice(cart.total)}</dd>
      </dl>
      <p class="cart-message" role="status" aria-live="polite"></p>
      <p><a class="button cart-checkout" href="${SITE_ROOT}/checkout">Proceed to checkout</a></p>`;
    const msg = summary.querySelector('.cart-message');
    msg.textContent = message.text;
    msg.classList.toggle('error', !message.ok);
    summary.querySelector('dl').after(couponForm(cart, (text, ok) => {
      message = { text, ok };
      render();
    }));
    block.append(list, summary);
  };

  render();
  document.addEventListener('aep:store-updated', (e) => {
    if (e.detail?.key === 'aep:cart') render();
  });
  const cart = getCart();
  pushEvent('cartView', {
    cartId: cart.cartId,
    itemCount: cart.itemCount,
    cartSubtotal: cart.subtotal,
    couponCode: cart.couponCode,
  });
}
