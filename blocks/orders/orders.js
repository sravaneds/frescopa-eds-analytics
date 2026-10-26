import { pushEvent, SITE_ROOT } from '../../scripts/aep/datalayer.js';
import { getProfile } from '../../scripts/aep/profile.js';
import {
  getOrders, getOrder, seedDemoOrders, formatPrice, SHIPPING_METHODS,
} from '../../scripts/aep/store.js';

const STATUSES = ['Ordered', 'Processing', 'Shipped', 'Out for delivery', 'Delivered'];
const dateFmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

function itemsList(order) {
  const ul = document.createElement('ul');
  ul.className = 'orders-items';
  order.items.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = '<span></span><span></span>';
    li.firstElementChild.textContent = `${item.quantity} × ${item.productName}`;
    li.lastElementChild.textContent = formatPrice(item.price * item.quantity);
    ul.append(li);
  });
  return ul;
}

function totals(order) {
  const dl = document.createElement('dl');
  dl.className = 'orders-totals';
  dl.innerHTML = `<dt>Subtotal</dt><dd>${formatPrice(order.subtotal)}</dd>
    ${order.discount ? `<dt>Discount</dt><dd>−${formatPrice(order.discount)}</dd>` : ''}
    <dt>Shipping</dt><dd>${order.shipping ? formatPrice(order.shipping) : 'Free'}</dd>
    <dt>Tax</dt><dd>${formatPrice(order.tax)}</dd>
    <dt class="orders-total">Total</dt><dd class="orders-total">${formatPrice(order.total)}</dd>`;
  return dl;
}

function timeline(order) {
  const current = Math.max(0, STATUSES.indexOf(order.status));
  const ol = document.createElement('ol');
  ol.className = 'orders-timeline';
  STATUSES.forEach((status, i) => {
    const li = document.createElement('li');
    li.textContent = status;
    if (i <= current) li.classList.add('done');
    if (i === current) li.setAttribute('aria-current', 'step');
    ol.append(li);
  });
  return ol;
}

function renderHistory(block) {
  const profile = getProfile();
  if (!profile.loggedIn) {
    block.innerHTML = `<div class="orders-signin"><h2>Sign in to see your orders</h2>
      <p>Use the demo account to explore order history and logged-in personalization.</p>
      <p><a class="button" href="#aep:sign-in">Sign in as demo customer</a></p></div>`;
    pushEvent('orderHistoryView', { orderCount: 0, authState: 'anonymous' });
    return;
  }
  seedDemoOrders();
  const orders = getOrders();
  const table = document.createElement('table');
  table.innerHTML = `<caption class="visually-hidden">Your orders</caption>
    <thead><tr><th scope="col">Order</th><th scope="col">Date</th><th scope="col">Items</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead><tbody></tbody>`;
  const tbody = table.querySelector('tbody');
  orders.forEach((order) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<th scope="row"></th><td>${dateFmt.format(new Date(order.date))}</td><td>${order.itemCount}</td><td>${formatPrice(order.total)}</td><td><span class="orders-status"></span></td><td><a></a></td>`;
    tr.querySelector('th').textContent = order.orderId;
    tr.querySelector('.orders-status').textContent = order.status;
    const link = tr.querySelector('a');
    link.href = `${SITE_ROOT}/account/track-order?order=${order.orderId}`;
    link.textContent = 'Track';
    link.setAttribute('aria-label', `Track order ${order.orderId}`);
    link.dataset.track = 'orderTrackClick';
    link.dataset.trackOrderId = order.orderId;
    tbody.append(tr);
  });
  block.append(table);
  pushEvent('orderHistoryView', { orderCount: orders.length, authState: 'authenticated' });
}

function renderConfirmation(block) {
  const id = new URLSearchParams(window.location.search).get('order');
  const order = (id && getOrder(id)) || getOrders()[0];
  if (!order) {
    block.innerHTML = `<div class="orders-signin"><h2>No recent order found</h2><p><a class="button" href="${SITE_ROOT}/shop">Start shopping</a></p></div>`;
    return;
  }
  const method = SHIPPING_METHODS.find((m) => m.id === order.shippingMethod);
  const wrap = document.createElement('div');
  wrap.className = 'orders-confirmation';
  wrap.innerHTML = `<p class="orders-check" aria-hidden="true">✓</p>
    <h2>Thank you for your order!</h2>
    <p>Order number <strong></strong> · ${dateFmt.format(new Date(order.date))}</p>
    <p></p>`;
  wrap.querySelector('strong').textContent = order.orderId;
  wrap.querySelector('p:last-of-type').textContent = `Shipping: ${method?.label || order.shippingMethod}. A confirmation email is on its way${order.email ? ` to ${order.email}` : ''}.`;
  wrap.append(itemsList(order), totals(order));
  const actions = document.createElement('p');
  actions.innerHTML = `<a class="button" href="${SITE_ROOT}/account/track-order?order=${order.orderId}">Track your order</a> <a class="button secondary" href="${SITE_ROOT}/shop">Continue shopping</a>`;
  wrap.append(actions);
  block.append(wrap);
  pushEvent('orderConfirmationView', {
    orderId: order.orderId, revenue: order.total, itemCount: order.itemCount,
  });
}

function renderTracking(block) {
  const form = document.createElement('form');
  form.className = 'orders-track-form';
  form.innerHTML = `<div><label for="orders-track-id">Order number</label>
    <input id="orders-track-id" name="order" required placeholder="NM-123456" autocomplete="off"></div>
    <button type="submit" class="button">Track order</button>`;
  const result = document.createElement('div');
  result.className = 'orders-track-result';
  result.setAttribute('aria-live', 'polite');
  const lookup = (value, trigger) => {
    const order = getOrder(value);
    result.textContent = '';
    if (!order) {
      result.innerHTML = '<p class="orders-error">We couldn\'t find that order. Check the number and try again. Tip: sign in on My Account to load sample orders.</p>';
    } else {
      const h = document.createElement('h2');
      h.textContent = `Order ${order.orderId}: ${order.status}`;
      result.append(h, timeline(order), itemsList(order));
    }
    pushEvent('orderTrack', {
      orderId: value, orderFound: Boolean(order), orderStatus: order?.status || 'not-found', trigger,
    });
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    lookup(form.elements.order.value.trim(), 'form');
  });
  block.append(form, result);
  const param = new URLSearchParams(window.location.search).get('order');
  if (param) {
    form.elements.order.value = param;
    lookup(param, 'link');
  }
}

/**
 * Orders (demo store). Variants: default = order history, "confirmation", "tracking".
 * @param {Element} block The block element
 */
export default function decorate(block) {
  block.textContent = '';
  block.dataset.selfTracking = 'true';
  if (block.classList.contains('confirmation')) renderConfirmation(block);
  else if (block.classList.contains('tracking')) renderTracking(block);
  else renderHistory(block);
}
