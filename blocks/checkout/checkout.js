import { pushEvent, SITE_ROOT } from '../../scripts/aep/datalayer.js';
import { getProfile, DEMO_CUSTOMER } from '../../scripts/aep/profile.js';
import {
  getCart, placeOrder, getShippingPrice, formatPrice, SHIPPING_METHODS, PAYMENT_METHODS,
} from '../../scripts/aep/store.js';

function radios(name, legend, options, render) {
  const fieldset = document.createElement('fieldset');
  fieldset.className = `checkout-options checkout-${name}`;
  fieldset.innerHTML = `<legend>${legend}</legend>`;
  options.forEach((option, i) => {
    const id = `checkout-${name}-${option.id}`;
    const label = document.createElement('label');
    label.htmlFor = id;
    label.innerHTML = `<input type="radio" name="${name}" id="${id}" value="${option.id}" ${i === 0 ? 'checked' : ''} required> <span></span>`;
    label.querySelector('span').textContent = render(option);
    fieldset.append(label);
  });
  return fieldset;
}

function field(name, label, value, type = 'text', autocomplete = '') {
  return `<div class="checkout-field"><label for="checkout-${name}">${label}</label>
    <input id="checkout-${name}" name="${name}" type="${type}" value="${value}" required ${autocomplete ? `autocomplete="${autocomplete}"` : ''}></div>`;
}

/**
 * Checkout (demo store). Optional authored row: intro text.
 * Tracks checkoutStart, checkoutStep, shippingSelect, paymentSelect, checkoutComplete.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const intro = block.firstElementChild?.firstElementChild;
  const cart = getCart();
  block.textContent = '';
  block.dataset.selfTracking = 'true';

  if (!cart.items.length) {
    block.innerHTML = `<div class="checkout-empty"><h2>Your cart is empty</h2><p><a href="${SITE_ROOT}/shop" class="button">Start shopping</a></p></div>`;
    return;
  }

  const profile = getProfile();
  const customer = profile.loggedIn ? DEMO_CUSTOMER : { firstName: '', lastName: '', email: '' };
  const form = document.createElement('form');
  form.className = 'checkout-form';
  form.noValidate = false;
  if (intro) {
    const introWrap = document.createElement('div');
    introWrap.className = 'checkout-intro';
    introWrap.append(...intro.childNodes);
    form.append(introWrap);
  }
  const contact = document.createElement('fieldset');
  contact.className = 'checkout-address';
  contact.innerHTML = `<legend>1. Contact &amp; shipping address</legend>
    ${field('email', 'Email', customer.email, 'email', 'email')}
    ${field('firstName', 'First name', customer.firstName, 'text', 'given-name')}
    ${field('lastName', 'Last name', customer.lastName, 'text', 'family-name')}
    ${field('street', 'Street address', profile.loggedIn ? '600 Townsend St' : '', 'text', 'street-address')}
    ${field('city', 'City', profile.loggedIn ? 'San Francisco' : '', 'text', 'address-level2')}
    ${field('zip', 'ZIP code', profile.loggedIn ? '94103' : '', 'text', 'postal-code')}`;

  const shipping = radios('shipping', '2. Shipping method', SHIPPING_METHODS, (m) => {
    const price = getShippingPrice(m.id, cart);
    return `${m.label} — ${price ? formatPrice(price) : 'Free'}`;
  });
  const payment = radios('payment', '3. Payment method', PAYMENT_METHODS, (m) => m.label);
  const paymentNote = document.createElement('p');
  paymentNote.className = 'checkout-note';
  paymentNote.textContent = 'Training store: no payment is taken and no card details are collected.';
  payment.append(paymentNote);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'button checkout-submit';
  submit.textContent = 'Place order';
  const error = document.createElement('p');
  error.className = 'checkout-error';
  error.setAttribute('role', 'alert');
  form.append(contact, shipping, payment, error, submit);

  const summary = document.createElement('aside');
  summary.className = 'checkout-summary';
  summary.setAttribute('aria-label', 'Order summary');
  const renderSummary = () => {
    const method = form.elements.shipping.value;
    const ship = getShippingPrice(method, cart);
    const tax = Math.round(cart.total * 0.08 * 100) / 100;
    summary.innerHTML = `<h2>Order summary</h2>
      <ul>${cart.items.map((i) => `<li><span></span><span>${formatPrice(i.price * i.quantity)}</span></li>`).join('')}</ul>
      <dl>
        <dt>Subtotal</dt><dd>${formatPrice(cart.subtotal)}</dd>
        ${cart.discount ? `<dt>Discount (${cart.couponCode})</dt><dd>−${formatPrice(cart.discount)}</dd>` : ''}
        <dt>Shipping</dt><dd>${ship ? formatPrice(ship) : 'Free'}</dd>
        <dt>Estimated tax</dt><dd>${formatPrice(tax)}</dd>
        <dt class="checkout-total">Total</dt><dd class="checkout-total">${formatPrice(cart.total + ship + tax)}</dd>
      </dl>`;
    summary.querySelectorAll('li > span:first-child').forEach((el, i) => {
      el.textContent = `${cart.items[i].quantity} × ${cart.items[i].productName}`;
    });
  };

  block.append(form, summary);
  renderSummary();

  const products = cart.items.map((i) => ({
    productId: i.productId, productName: i.productName, price: i.price, quantity: i.quantity,
  }));
  pushEvent('checkoutStart', {
    cartId: cart.cartId, itemCount: cart.itemCount, cartTotal: cart.total, products,
  });

  const steps = new Set();
  const step = (name, number) => {
    if (steps.has(name)) return;
    steps.add(name);
    pushEvent('checkoutStep', { checkoutStep: name, checkoutStepNumber: number });
  };
  contact.addEventListener('focusin', () => step('shipping-address', 1));
  shipping.addEventListener('change', () => {
    renderSummary();
    step('shipping-method', 2);
    const method = form.elements.shipping.value;
    pushEvent('shippingSelect', {
      shippingMethod: method, shippingCost: getShippingPrice(method, cart), cartTotal: cart.total,
    });
  });
  payment.addEventListener('change', () => {
    step('payment', 3);
    pushEvent('paymentSelect', { paymentMethod: form.elements.payment.value, cartTotal: cart.total });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      error.textContent = 'Please complete all required fields.';
      form.querySelector(':invalid')?.focus();
      pushEvent('checkoutError', { errorType: 'validation', field: form.querySelector(':invalid')?.name });
      return;
    }
    error.textContent = '';
    submit.disabled = true;
    step('review', 4);
    const order = placeOrder({
      shipping: form.elements.shipping.value,
      payment: form.elements.payment.value,
      email: form.elements.email.value,
    });
    // short delay so Adobe Tags rules can send the purchase beacon before navigating
    if (order) {
      window.setTimeout(() => {
        window.location.href = `${SITE_ROOT}/order-confirmation?order=${order.orderId}`;
      }, 500);
    }
  });
}
