/**
 * Demo commerce store (cart, wishlist, orders) for the AEP training site.
 * Data lives in localStorage so the full shopping journey can be tracked without a
 * commerce backend. Every mutation pushes the matching data layer event and the
 * updated `cart` state.
 */
import { pushEvent, pushState, CURRENCY } from './datalayer.js';
import { recordOrder } from './profile.js';

const CART_KEY = 'aep:cart';
const WISHLIST_KEY = 'aep:wishlist';
const ORDERS_KEY = 'aep:orders';

export const COUPONS = {
  SAVE10: { type: 'percent', value: 10, label: '10% off your order' },
  WELCOME15: { type: 'percent', value: 15, label: '15% off for new customers' },
  VIP20: {
    type: 'percent', value: 20, label: '20% member discount', minSubtotal: 300,
  },
  FREESHIP: { type: 'shipping', value: 0, label: 'Free shipping' },
};

export const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard (5-7 business days)', price: 5.99 },
  { id: 'express', label: 'Express (2-3 business days)', price: 14.99 },
  { id: 'next-day', label: 'Next day', price: 24.99 },
  { id: 'pickup', label: 'Store pickup', price: 0 },
];

export const PAYMENT_METHODS = [
  { id: 'credit-card', label: 'Credit card' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'apple-pay', label: 'Apple Pay' },
  { id: 'gift-card', label: 'Gift card' },
];

const FREE_SHIPPING_THRESHOLD = 75;

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (e) {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  document.dispatchEvent(new CustomEvent('aep:store-updated', { detail: { key } }));
}

const round = (n) => Math.round(n * 100) / 100;

export function formatPrice(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY }).format(value || 0);
}

function rawCart() {
  return read(CART_KEY, { cartId: '', items: [], couponCode: '' });
}

/**
 * Cart summary as exposed in the data layer `cart` object.
 */
export function getCart() {
  const cart = rawCart();
  const items = cart.items || [];
  const subtotal = round(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const coupon = COUPONS[cart.couponCode];
  let discount = 0;
  if (coupon?.type === 'percent') discount = round((subtotal * coupon.value) / 100);
  const freeShipping = coupon?.type === 'shipping' || subtotal >= FREE_SHIPPING_THRESHOLD;
  return {
    cartId: cart.cartId,
    currency: CURRENCY,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    uniqueItems: items.length,
    subtotal,
    discount,
    total: round(subtotal - discount),
    couponCode: cart.couponCode || '',
    freeShipping,
    items: items.map((i) => ({ ...i })),
  };
}

function cartState() {
  const cart = getCart();
  return { cart: { ...cart, items: cart.items.map(({ image: _image, ...rest }) => rest) } };
}

function saveCart(cart) {
  write(CART_KEY, cart);
  pushState(cartState());
}

function toItem(product, quantity) {
  return {
    productId: product.productId,
    productName: product.productName,
    price: Number(product.price) || 0,
    category: product.category || '',
    brand: product.brand || '',
    image: product.image || '',
    url: product.url || '',
    quantity,
  };
}

/**
 * @param {Object} product product object (productId, productName, price, ...)
 * @param {number} quantity quantity to add
 * @param {string} source component that triggered the add (product-grid, pdp, ...)
 */
export function addToCart(product, quantity = 1, source = '') {
  const cart = rawCart();
  const isFirstItem = !cart.items.length;
  if (!cart.cartId) cart.cartId = `CART-${Date.now().toString(36).toUpperCase()}`;
  const existing = cart.items.find((i) => i.productId === product.productId);
  if (existing) existing.quantity += quantity;
  else cart.items.push(toItem(product, quantity));
  write(CART_KEY, cart);
  if (isFirstItem) pushEvent('cartOpen', { cartId: cart.cartId });
  pushEvent('cartAdd', {
    productId: product.productId,
    productName: product.productName,
    category: product.category,
    price: Number(product.price) || 0,
    quantity,
    source,
  }, cartState());
}

export function updateQuantity(productId, quantity) {
  const cart = rawCart();
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) return;
  const delta = quantity - item.quantity;
  if (quantity <= 0) {
    // eslint-disable-next-line no-use-before-define
    removeFromCart(productId, 'cart');
    return;
  }
  item.quantity = quantity;
  write(CART_KEY, cart);
  pushEvent(delta > 0 ? 'cartAdd' : 'cartRemove', {
    productId,
    productName: item.productName,
    price: item.price,
    quantity: Math.abs(delta),
    source: 'cart-quantity',
  }, cartState());
}

export function removeFromCart(productId, source = 'cart') {
  const cart = rawCart();
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) return;
  cart.items = cart.items.filter((i) => i.productId !== productId);
  if (!cart.items.length) cart.couponCode = '';
  write(CART_KEY, cart);
  pushEvent('cartRemove', {
    productId,
    productName: item.productName,
    price: item.price,
    quantity: item.quantity,
    source,
  }, cartState());
}

/**
 * Applies a coupon code. Returns { ok, message }.
 */
export function applyCoupon(code) {
  const couponCode = (code || '').trim().toUpperCase();
  const coupon = COUPONS[couponCode];
  const before = getCart();
  let ok = Boolean(coupon);
  let message = coupon ? `${coupon.label} applied.` : `"${couponCode}" is not a valid code.`;
  if (coupon?.minSubtotal && before.subtotal < coupon.minSubtotal) {
    ok = false;
    message = `${couponCode} needs a subtotal of ${formatPrice(coupon.minSubtotal)} or more.`;
  }
  if (ok) {
    const cart = rawCart();
    cart.couponCode = couponCode;
    saveCart(cart);
  }
  const after = getCart();
  pushEvent('couponApply', {
    couponCode,
    couponStatus: ok ? 'success' : 'invalid',
    discountAmount: after.discount,
    message,
  }, cartState());
  return { ok, message };
}

export function removeCoupon() {
  const cart = rawCart();
  const { couponCode } = cart;
  cart.couponCode = '';
  saveCart(cart);
  pushEvent('couponRemove', { couponCode }, cartState());
}

export function clearCart() {
  write(CART_KEY, { cartId: '', items: [], couponCode: '' });
  pushState(cartState());
}

export function getShippingPrice(methodId, cart = getCart()) {
  const method = SHIPPING_METHODS.find((m) => m.id === methodId) || SHIPPING_METHODS[0];
  if (cart.freeShipping && method.id === 'standard') return 0;
  return method.price;
}

/* Wishlist */

export function getWishlist() {
  return read(WISHLIST_KEY, []);
}

export function isInWishlist(productId) {
  return getWishlist().some((p) => p.productId === productId);
}

export function addToWishlist(product, source = '') {
  const list = getWishlist();
  if (list.some((p) => p.productId === product.productId)) return;
  list.unshift(toItem(product, 1));
  write(WISHLIST_KEY, list);
  pushEvent('wishlistAdd', {
    productId: product.productId,
    productName: product.productName,
    category: product.category,
    price: Number(product.price) || 0,
    source,
  });
}

export function removeFromWishlist(productId, source = '') {
  const list = getWishlist();
  const item = list.find((p) => p.productId === productId);
  if (!item) return;
  write(WISHLIST_KEY, list.filter((p) => p.productId !== productId));
  pushEvent('wishlistRemove', { productId, productName: item.productName, source });
}

export function toggleWishlist(product, source = '') {
  if (isInWishlist(product.productId)) {
    removeFromWishlist(product.productId, source);
    return false;
  }
  addToWishlist(product, source);
  return true;
}

/* Orders */

export function getOrders() {
  return read(ORDERS_KEY, []);
}

export function getOrder(orderId) {
  return getOrders().find((o) => o.orderId.toLowerCase() === (orderId || '').trim().toLowerCase());
}

/**
 * Converts the cart into an order and pushes checkoutComplete (purchase).
 */
export function placeOrder({ shipping, payment, email }) {
  const cart = getCart();
  if (!cart.items.length) return null;
  const shippingPrice = getShippingPrice(shipping, cart);
  const tax = round((cart.total) * 0.08);
  const order = {
    orderId: `NM-${Math.floor(100000 + Math.random() * 900000)}`,
    date: new Date().toISOString(),
    status: 'Processing',
    email: email || '',
    shippingMethod: shipping,
    paymentMethod: payment,
    items: cart.items,
    itemCount: cart.itemCount,
    subtotal: cart.subtotal,
    discount: cart.discount,
    couponCode: cart.couponCode,
    shipping: shippingPrice,
    tax,
    total: round(cart.total + shippingPrice + tax),
    currency: CURRENCY,
  };
  write(ORDERS_KEY, [order, ...getOrders()]);
  recordOrder(order.total);
  pushEvent('checkoutComplete', {
    orderId: order.orderId,
    revenue: order.total,
    tax: order.tax,
    shipping: order.shipping,
    discount: order.discount,
    couponCode: order.couponCode,
    shippingMethod: shipping,
    paymentMethod: payment,
    products: order.items.map((i) => ({
      productId: i.productId, productName: i.productName, price: i.price, quantity: i.quantity,
    })),
  }, {
    transaction: {
      orderId: order.orderId,
      total: order.total,
      currency: CURRENCY,
      paymentMethod: payment,
      shippingMethod: shipping,
    },
  });
  clearCart();
  return order;
}

/**
 * Creates sample historic orders so Order History / Track Orders have data
 * for a signed-in demo customer.
 */
export function seedDemoOrders() {
  if (getOrders().length) return;
  const day = 24 * 60 * 60 * 1000;
  const sample = [
    {
      orderId: 'NM-482913',
      status: 'Delivered',
      daysAgo: 42,
      shippingMethod: 'standard',
      items: [{
        productId: 'EL-1001', productName: 'Nova Pro Wireless Headphones', price: 249, quantity: 1,
      }],
    },
    {
      orderId: 'NM-517204',
      status: 'Shipped',
      daysAgo: 4,
      shippingMethod: 'express',
      items: [
        {
          productId: 'FA-2003', productName: 'Trailblazer Running Sneakers', price: 119, quantity: 1,
        },
        {
          productId: 'FA-2006', productName: 'Weekender Canvas Tote', price: 59, quantity: 2,
        },
      ],
    },
  ];
  const orders = sample.map((s) => {
    const subtotal = round(s.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
    const tax = round(subtotal * 0.08);
    return {
      orderId: s.orderId,
      date: new Date(Date.now() - s.daysAgo * day).toISOString(),
      status: s.status,
      shippingMethod: s.shippingMethod,
      paymentMethod: 'credit-card',
      items: s.items,
      itemCount: s.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      discount: 0,
      shipping: 0,
      tax,
      total: round(subtotal + tax),
      currency: CURRENCY,
    };
  });
  write(ORDERS_KEY, orders);
}

export { cartState };
