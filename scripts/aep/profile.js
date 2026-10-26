/**
 * Visitor profile for the AEP training site.
 * Keeps a small, anonymous, first-party profile in localStorage that drives the
 * audience simulator and the data layer `user` object. Everything here mimics what
 * Adobe Target / Real-Time CDP would know about a visitor so trainees can build
 * audiences and rules against realistic attributes.
 */

const PROFILE_KEY = 'aep:profile';
const SESSION_KEY = 'aep:session';
const OVERRIDE_KEY = 'aep:audience-override';
const CART_KEY = 'aep:cart';
const MAX_RECENT = 12;

export const DEMO_CUSTOMER = {
  customerId: 'CUST-100245',
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'alex.morgan@example.com',
  loyaltyTier: 'gold',
};

/**
 * Adobe Target audience definitions mirrored locally.
 * `rule` is evaluated against the profile and the current cart.
 */
export const AUDIENCES = [
  {
    id: 'new-visitors',
    name: 'New Visitors',
    description: 'First visit (visit count = 1).',
    rule: (p) => p.visitCount <= 1,
  },
  {
    id: 'returning-visitors',
    name: 'Returning Visitors',
    description: 'Visit count greater than 1.',
    rule: (p) => p.visitCount > 1,
  },
  {
    id: 'anonymous-users',
    name: 'Anonymous Users',
    description: 'Not signed in.',
    rule: (p) => !p.loggedIn,
  },
  {
    id: 'logged-in-users',
    name: 'Logged-In Users',
    description: 'Signed in (authState = authenticated).',
    rule: (p) => p.loggedIn,
  },
  {
    id: 'high-value-customers',
    name: 'High Value Customers',
    description: 'Lifetime value >= $1,000 or loyalty tier gold/platinum.',
    rule: (p) => p.lifetimeValue >= 1000 || (p.loggedIn && ['gold', 'platinum'].includes(p.loyaltyTier)),
  },
  {
    id: 'frequent-buyers',
    name: 'Frequent Buyers',
    description: '3 or more completed orders.',
    rule: (p) => p.orderCount >= 3,
  },
  {
    id: 'electronics-shoppers',
    name: 'Electronics Shoppers',
    description: '3+ electronics category/product views, or electronics is the top category.',
    rule: (p) => (p.categoryViews.electronics || 0) >= 3 || topCategory(p) === 'electronics',
  },
  {
    id: 'fashion-shoppers',
    name: 'Fashion Shoppers',
    description: '3+ fashion category/product views, or fashion is the top category.',
    rule: (p) => (p.categoryViews.fashion || 0) >= 3 || topCategory(p) === 'fashion',
  },
  {
    id: 'cart-abandoners',
    name: 'Cart Abandoners',
    description: 'Left a previous session with items in the cart and no order.',
    rule: (p) => p.cartAbandoned,
  },
  {
    id: 'blog-readers',
    name: 'Blog Readers',
    description: 'Read 2 or more blog articles.',
    rule: (p) => p.articlesRead >= 2,
  },
];

/**
 * Conditions that are not audiences on their own but can be used in
 * personalization rules (section metadata "Audience").
 */
const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || '';
const WEST_COAST = ['America/Los_Angeles', 'America/Vancouver', 'America/Phoenix', 'America/Denver'];
const EAST_COAST = ['America/New_York', 'America/Toronto', 'America/Detroit', 'America/Chicago'];

export const CONDITIONS = {
  'high-cart-value': (p, cart) => cart.subtotal >= 300,
  'first-time-buyers': (p) => p.orderCount === 1,
  // location proxies from the browser time zone (Adobe Target uses geo.* edge attributes)
  'geo-us-west': () => WEST_COAST.includes(timeZone()),
  'geo-us-east': () => EAST_COAST.includes(timeZone()),
  'geo-europe': () => timeZone().startsWith('Europe/'),
  'empty-cart': (p, cart) => cart.itemCount === 0,
  'premium-members': (p) => p.member && ['gold', 'platinum'].includes(p.loyaltyTier),
  'non-members': (p) => !p.member,
};

function topCategory(p) {
  const entries = Object.entries(p.categoryViews || {});
  if (!entries.length) return '';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][1] >= 2 ? entries[0][0] : '';
}

function read(storage, key, fallback) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (e) {
    return fallback;
  }
}

function write(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // storage full or disabled, profile is best effort
  }
}

function randomId(prefix) {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rnd}`;
}

function defaultProfile() {
  return {
    visitorId: randomId('V'),
    visitCount: 0,
    pageViews: 0,
    firstVisit: new Date().toISOString(),
    lastVisit: null,
    loggedIn: false,
    customerId: '',
    firstName: '',
    loyaltyTier: 'none',
    member: false,
    orderCount: 0,
    lifetimeValue: 0,
    categoryViews: {},
    recentlyViewed: [],
    articlesRead: 0,
    readArticles: [],
    cartAbandoned: false,
    lastCampaignId: '',
  };
}

export function getProfile() {
  return { ...defaultProfile(), ...read(localStorage, PROFILE_KEY, {}) };
}

export function saveProfile(profile) {
  write(localStorage, PROFILE_KEY, profile);
  document.dispatchEvent(new CustomEvent('aep:profile-updated', { detail: profile }));
  return profile;
}

/**
 * Applies a mutation to the stored profile.
 * @param {Function} fn receives the profile, may mutate it
 */
export function updateProfile(fn) {
  const profile = getProfile();
  fn(profile);
  return saveProfile(profile);
}

/**
 * Starts (or continues) a visit. A new session increments the visit count and
 * evaluates cart abandonment from the previous session.
 */
export function startVisit() {
  const session = read(sessionStorage, SESSION_KEY, null);
  return updateProfile((p) => {
    if (!session) {
      const cart = read(localStorage, CART_KEY, { items: [] });
      p.cartAbandoned = p.visitCount > 0 && (cart.items || []).length > 0;
      p.visitCount += 1;
      p.lastVisit = new Date().toISOString();
      write(sessionStorage, SESSION_KEY, { sessionId: randomId('S'), start: Date.now() });
    }
    p.pageViews += 1;
  });
}

export function getSessionId() {
  return read(sessionStorage, SESSION_KEY, {}).sessionId || '';
}

export function recordCategoryView(category) {
  if (!category) return;
  const key = category.toLowerCase().replace(/\s+/g, '-');
  updateProfile((p) => {
    p.categoryViews[key] = (p.categoryViews[key] || 0) + 1;
  });
}

export function recordProductView(product) {
  if (!product?.productId) return;
  updateProfile((p) => {
    p.recentlyViewed = [
      product,
      ...p.recentlyViewed.filter((item) => item.productId !== product.productId),
    ].slice(0, MAX_RECENT);
    if (product.category) {
      const key = product.category.toLowerCase().replace(/\s+/g, '-');
      p.categoryViews[key] = (p.categoryViews[key] || 0) + 1;
    }
  });
}

export function recordArticleRead(articleId) {
  updateProfile((p) => {
    if (!p.readArticles.includes(articleId)) {
      p.readArticles.push(articleId);
      p.articlesRead = p.readArticles.length;
    }
  });
}

export function recordOrder(total) {
  updateProfile((p) => {
    p.orderCount += 1;
    p.lifetimeValue = Math.round((p.lifetimeValue + total) * 100) / 100;
    p.cartAbandoned = false;
  });
}

export function signIn(customer = DEMO_CUSTOMER) {
  return updateProfile((p) => {
    p.loggedIn = true;
    p.customerId = customer.customerId;
    p.firstName = customer.firstName;
    p.loyaltyTier = customer.loyaltyTier;
  });
}

export function signOut() {
  return updateProfile((p) => {
    p.loggedIn = false;
    p.customerId = '';
    p.firstName = '';
  });
}

export function enrollMembership() {
  return updateProfile((p) => {
    p.member = true;
    if (p.loyaltyTier === 'none') p.loyaltyTier = 'silver';
  });
}

export function resetProfile() {
  ['aep:profile', 'aep:cart', 'aep:wishlist', 'aep:orders', OVERRIDE_KEY].forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(OVERRIDE_KEY);
}

/**
 * QA overrides, similar to Target QA preview links:
 * ?aep-audience=returning-visitors,logged-in-users (persists for the session)
 * ?aep-audience=clear removes the override
 */
export function getAudienceOverride() {
  const param = new URLSearchParams(window.location.search).get('aep-audience');
  if (param === 'clear') {
    sessionStorage.removeItem(OVERRIDE_KEY);
    return null;
  }
  if (param) {
    const list = param.split(',').map((a) => a.trim()).filter(Boolean);
    write(sessionStorage, OVERRIDE_KEY, list);
    return list;
  }
  return read(sessionStorage, OVERRIDE_KEY, null);
}

export function setAudienceOverride(list) {
  if (!list || !list.length) sessionStorage.removeItem(OVERRIDE_KEY);
  else write(sessionStorage, OVERRIDE_KEY, list);
}

/**
 * Evaluates all audiences and conditions for the visitor.
 * @param {Object} cart cart summary ({ subtotal, itemCount })
 * @returns {string[]} qualified audience and condition ids
 */
export function getAudiences(cart = { subtotal: 0, itemCount: 0 }) {
  const override = getAudienceOverride();
  if (override) return override;
  const p = getProfile();
  const audiences = AUDIENCES.filter((a) => a.rule(p, cart)).map((a) => a.id);
  Object.entries(CONDITIONS).forEach(([id, rule]) => {
    if (rule(p, cart)) audiences.push(id);
  });
  return audiences;
}

/**
 * Primary audience used for the `audienceType` analytics variable.
 * Ordered from most to least specific.
 */
export function getPrimaryAudience(audiences) {
  const priority = [
    'high-value-customers', 'frequent-buyers', 'cart-abandoners', 'electronics-shoppers',
    'fashion-shoppers', 'blog-readers', 'logged-in-users', 'returning-visitors', 'new-visitors',
    'anonymous-users',
  ];
  return priority.find((id) => audiences.includes(id)) || 'anonymous-users';
}
