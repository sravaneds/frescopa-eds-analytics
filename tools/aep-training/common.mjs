/**
 * Shared content, scenes and Target activity catalogue for the AEP training site.
 */
import {
  DAM, img, h, p, primary, secondary, columns, cta, cards, url, testimonials, esc,
} from './html.mjs';
import { CATEGORIES } from './catalog.mjs';

export const PALETTES = {
  electronics: CATEGORIES.electronics.colors,
  fashion: CATEGORIES.fashion.colors,
  home: CATEGORIES['home-appliances'].colors,
  deals: ['#c2410c', '#fdba74'],
  member: ['#6d28d9', '#c4b5fd'],
  support: ['#334155', '#94a3b8'],
  teal: ['#0f766e', '#5eead4'],
};

/** Scene illustrations generated into DAM/scenes/<key>.svg */
export const SCENES = {
  'home-new': { colors: PALETTES.electronics, glyphs: ['headphones', 'sneaker', 'coffee'], title: 'Electronics, fashion and home essentials' },
  'home-returning': { colors: PALETTES.teal, glyphs: ['laptop', 'watch'], title: 'Recommended picks for you' },
  'home-member': { colors: PALETTES.member, glyphs: ['bag', 'speaker'], title: 'NovaMart Rewards member offers' },
  shop: { colors: PALETTES.electronics, glyphs: ['phone', 'jacket', 'blender'], title: 'Shop all departments' },
  electronics: { colors: PALETTES.electronics, glyphs: ['laptop', 'headphones', 'camera'], title: 'Electronics' },
  fashion: { colors: PALETTES.fashion, glyphs: ['dress', 'sneaker', 'sunglasses'], title: 'Fashion' },
  'home-appliances': { colors: PALETTES.home, glyphs: ['coffee', 'blender', 'vacuum'], title: 'Home appliances' },
  'best-sellers': { colors: PALETTES.deals, glyphs: ['sneaker', 'airfryer', 'speaker'], title: 'Best sellers' },
  'new-arrivals': { colors: PALETTES.teal, glyphs: ['laptop', 'dress', 'purifier'], title: 'New arrivals' },
  deals: { colors: PALETTES.deals, glyphs: ['tv', 'vacuum', 'boot'], title: 'Deals' },
  seasonal: { colors: ['#b45309', '#fcd34d'], glyphs: ['jacket', 'kettle', 'boot'], title: 'Seasonal offers' },
  'seasonal-europe': { colors: ['#9a3412', '#fdba74'], glyphs: ['jacket', 'coffee'], title: 'Autumn in Europe' },
  membership: { colors: PALETTES.member, glyphs: ['bag', 'watch', 'mixer'], title: 'NovaMart Rewards' },
  'membership-premium': { colors: ['#854d0e', '#fde047'], glyphs: ['watch', 'camera'], title: 'Gold member benefits' },
  about: { colors: PALETTES.teal, glyphs: ['backpack', 'speaker', 'kettle'], title: 'About NovaMart' },
  blog: { colors: PALETTES.support, glyphs: ['headphones', 'hoodie', 'mixer'], title: 'The NovaMart Edit' },
  'blog-headphones': { colors: PALETTES.electronics, glyphs: ['headphones', 'earbuds'], title: 'Choosing noise cancelling headphones' },
  'blog-wardrobe': { colors: PALETTES.fashion, glyphs: ['hoodie', 'dress', 'boot'], title: 'Capsule wardrobe essentials' },
  'blog-kitchen': { colors: PALETTES.home, glyphs: ['coffee', 'airfryer', 'kettle'], title: 'Smart kitchen guide' },
  support: { colors: PALETTES.support, glyphs: ['phone', 'laptop'], title: 'Customer support' },
  stores: { colors: PALETTES.teal, glyphs: ['bag', 'tv'], title: 'Find a store' },
  recommendations: { colors: PALETTES.member, glyphs: ['camera', 'sneaker', 'blender'], title: 'Picked for you' },
  'tile-electronics': {
    colors: PALETTES.electronics, glyphs: ['laptop', 'headphones'], title: 'Electronics', w: 800, h: 600,
  },
  'tile-fashion': {
    colors: PALETTES.fashion, glyphs: ['jacket', 'sneaker'], title: 'Fashion', w: 800, h: 600,
  },
  'tile-home': {
    colors: PALETTES.home, glyphs: ['coffee', 'blender'], title: 'Home appliances', w: 800, h: 600,
  },
  'tile-deals': {
    colors: PALETTES.deals, glyphs: ['tv', 'vacuum'], title: 'Deals', w: 800, h: 600,
  },
  'tile-new': {
    colors: PALETTES.teal, glyphs: ['dress', 'purifier'], title: 'New arrivals', w: 800, h: 600,
  },
  'tile-best': {
    colors: ['#b45309', '#fcd34d'], glyphs: ['sneaker', 'airfryer'], title: 'Best sellers', w: 800, h: 600,
  },
  'tile-member': {
    colors: PALETTES.member, glyphs: ['bag', 'watch'], title: 'Rewards', w: 800, h: 600,
  },
  'tile-store': {
    colors: PALETTES.support, glyphs: ['backpack', 'speaker'], title: 'Store', w: 800, h: 600,
  },
};

export const scene = (key) => `${DAM}/scenes/${key}.svg`;

export const AVATARS = [
  ['PS', '#1d4ed8'], ['MJ', '#be185d'], ['LC', '#047857'], ['DK', '#c2410c'], ['AR', '#6d28d9'], ['TN', '#0f766e'],
];
export const avatar = (i) => `${DAM}/avatars/${AVATARS[i][0].toLowerCase()}.svg`;

/**
 * Adobe Target activities used across the site. The generator checks that every
 * activity referenced in section metadata exists here.
 */
export const ACTIVITIES = {
  'XT-HOME-HERO': { name: 'Home hero by visitor type', type: 'XT', goal: 'Hero CTR, visits to shop', kpi: 'heroClick / propositionDisplay' },
  'XT-HOME-CART-REMINDER': { name: 'Cart abandoner reminder banner', type: 'XT', goal: 'Recover abandoned carts', kpi: 'bannerClick -> checkoutStart' },
  'AB-HOME-PROMO': { name: 'Flash sale banner copy test', type: 'A/B', goal: 'Banner CTR', kpi: 'bannerClick / bannerImpression' },
  'XT-HOME-CTA': { name: 'Personalized home CTA by affinity', type: 'XT', goal: 'CTA CTR, category visits', kpi: 'ctaClick' },
  'XT-SHOP-FEATURED': { name: 'Shop landing featured department', type: 'XT', goal: 'Category entry rate', kpi: 'ctaClick -> categoryView' },
  'XT-GEO-PROMO': { name: 'Location-based category promotions', type: 'XT', goal: 'Category conversion by region', kpi: 'bannerClick, cartAdd' },
  'XT-CATEGORY-OFFER': { name: 'Audience-specific category offers', type: 'XT', goal: 'Coupon usage, AOV', kpi: 'couponCopy -> couponApply' },
  'XT-PLP-OFFER': { name: 'Product listing offer banner', type: 'XT', goal: 'Product click-through', kpi: 'productClick' },
  'RECS-PDP-SIMILAR': { name: 'PDP recommended products (people who viewed this)', type: 'Recommendations', goal: 'Product discovery', kpi: 'recommendationClick' },
  'RECS-PDP-CROSS-SELL': { name: 'PDP cross-sell (frequently bought together)', type: 'Recommendations', goal: 'Units per order', kpi: 'cartAdd from recommendations' },
  'RECS-RECENTLY-VIEWED': { name: 'Recently viewed products (profile)', type: 'Recommendations', goal: 'Return-to-product rate', kpi: 'recommendationClick' },
  'AB-PDP-TRUST': { name: 'PDP trust messaging test', type: 'A/B', goal: 'Add to cart rate', kpi: 'cartAdd / productView' },
  'XT-BESTSELLERS': { name: 'Best sellers frequent buyer perk', type: 'XT', goal: 'Repeat purchase', kpi: 'cartAdd' },
  'XT-NEW-ARRIVALS': { name: 'New arrivals feature by affinity', type: 'XT', goal: 'New product views', kpi: 'productClick' },
  'MVT-DEALS': { name: 'Deals headline x banner multivariate test', type: 'MVT', goal: 'Deals revenue per visit', kpi: 'cartAdd, checkoutComplete' },
  'XT-SEASONAL-HERO': { name: 'Seasonal hero by location', type: 'XT', goal: 'Seasonal collection CTR', kpi: 'heroClick' },
  'XT-WISHLIST': { name: 'Wishlist sign-in prompt', type: 'XT', goal: 'Login rate', kpi: 'loginComplete' },
  'XT-CART-HIGH-VALUE': { name: 'Discount banner for high cart value', type: 'XT', goal: 'Checkout rate for $300+ carts', kpi: 'couponApply VIP20 -> checkoutStart' },
  'XT-CART-COUPON': { name: 'Personalized coupon offer', type: 'XT', goal: 'Coupon redemption', kpi: 'couponApply' },
  'RECS-CART-CROSS-SELL': { name: 'Cart cross-sell recommendations', type: 'Recommendations', goal: 'AOV', kpi: 'cartAdd source=cart-cross-sell' },
  'AB-CHECKOUT-TRUST': { name: 'Checkout trust badges vs social proof', type: 'A/B', goal: 'Checkout completion', kpi: 'checkoutComplete / checkoutStart' },
  'XT-CONFIRMATION-NEXT': { name: 'Post-purchase next best action', type: 'XT', goal: 'Membership enrolment, repeat visit', kpi: 'membershipEnroll' },
  'XT-ACCOUNT': { name: 'My account logged-in vs anonymous', type: 'XT', goal: 'Login rate', kpi: 'loginComplete' },
  'XT-ORDERS-REORDER': { name: 'Order history reorder prompt', type: 'XT', goal: 'Repeat purchase', kpi: 'productClick' },
  'XT-TRACKING-HELP': { name: 'Tracking page help content', type: 'XT', goal: 'Self-service rate', kpi: 'orderTrack' },
  'XT-SUPPORT-PRIORITY': { name: 'Priority support for high-value customers', type: 'XT', goal: 'CSAT, contact deflection', kpi: 'ctaClick' },
  'XT-CONTACT': { name: 'Contact page cart help', type: 'XT', goal: 'Cart recovery', kpi: 'ctaClick -> checkoutStart' },
  'AB-ABOUT-CTA': { name: 'About page CTA copy test', type: 'A/B', goal: 'Shop entry from About', kpi: 'ctaClick' },
  'XT-BLOG-NEWSLETTER': { name: 'Blog reader newsletter prompt', type: 'XT', goal: 'Newsletter sign-ups', kpi: 'ctaClick' },
  'AB-BLOG-CTA': { name: 'Article CTA test', type: 'A/B', goal: 'Article-to-product CTR', kpi: 'ctaClick -> productView' },
  'XT-STORES': { name: 'Nearest store promotion by location', type: 'XT', goal: 'Store visits', kpi: 'ctaClick (directions)' },
  'XT-MEMBERSHIP-HERO': { name: 'Premium user messaging', type: 'XT', goal: 'Member engagement', kpi: 'heroClick' },
  'XT-MEMBERSHIP-ENROLL': { name: 'New user enrollment banner', type: 'XT', goal: 'Enrollment rate', kpi: 'membershipEnroll' },
  'XT-FAQ-HELP': { name: 'FAQ contextual help', type: 'XT', goal: 'Cart recovery from FAQ', kpi: 'ctaClick' },
  'XT-LEGAL': { name: 'Legal pages preference centre prompt', type: 'XT', goal: 'Preference centre visits', kpi: 'ctaClick' },
  'RECS-USER-AFFINITY': { name: 'Top picks by user affinity', type: 'Recommendations', goal: 'Recommendation CTR', kpi: 'recommendationClick' },
  'XT-RECS-AFFINITY': { name: 'Category affinity grid', type: 'XT', goal: 'Category conversion', kpi: 'productClick, cartAdd' },
  'XT-404-RECOVERY': { name: '404 recovery recommendations', type: 'XT', goal: 'Bounce reduction', kpi: 'productClick from 404' },
};

export const trustColumns = () => columns([
  `${h(3, 'Free shipping')}${p('On orders over $75. Same-day delivery in select cities.')}`,
  `${h(3, '30-day returns')}${p('Changed your mind? Return it free within 30 days.')}`,
  `${h(3, 'Price match')}${p('Found it cheaper? We will match the price.')}`,
  `${h(3, 'Secure checkout')}${p('Encrypted payments and buyer protection.')}`,
]);

export const rewardsCta = () => cta(`${h(2, 'Join NovaMart Rewards')}${p('Earn 2 points for every $1, get members-only prices and free express shipping.')}${primary('membership', 'Join for free')}${secondary('faq', 'How it works')}`, { variants: ['dark'] });

export const helpCta = () => cta(`${h(2, 'Need help?')}${p('Our support team is available 7 days a week, 8am to 10pm.')}${primary('support', 'Visit support')}${secondary('contact', 'Contact us')}`);

export const categoryCards = () => cards([
  { image: scene('tile-electronics'), alt: 'Laptop and headphones', body: `${h(3, 'Electronics')}${p('Headphones, laptops, phones, cameras and smart home.')}${p(`<a href="${url('electronics')}">Shop electronics</a>`)}` },
  { image: scene('tile-fashion'), alt: 'Jacket and sneakers', body: `${h(3, 'Fashion')}${p('Outerwear, sneakers, dresses and accessories.')}${p(`<a href="${url('fashion')}">Shop fashion</a>`)}` },
  { image: scene('tile-home'), alt: 'Espresso machine and blender', body: `${h(3, 'Home Appliances')}${p('Kitchen, cleaning and air care appliances.')}${p(`<a href="${url('home-appliances')}">Shop home appliances</a>`)}` },
]);

export const collectionCards = () => cards([
  { image: scene('tile-best'), alt: 'Best selling products', body: `${h(3, 'Best Sellers')}${p('What everyone is buying right now.')}${p(`<a href="${url('best-sellers')}">See best sellers</a>`)}` },
  { image: scene('tile-new'), alt: 'New arrivals', body: `${h(3, 'New Arrivals')}${p('Fresh drops across every department.')}${p(`<a href="${url('new-arrivals')}">See what is new</a>`)}` },
  { image: scene('tile-deals'), alt: 'Deals', body: `${h(3, 'Deals')}${p('Limited-time prices on top brands.')}${p(`<a href="${url('deals')}">Shop deals</a>`)}` },
  { image: scene('seasonal'), alt: 'Seasonal offers', body: `${h(3, 'Seasonal Offers')}${p('Fall favourites and holiday gifting.')}${p(`<a href="${url('seasonal-offers')}">Shop the season</a>`)}` },
]);

export const reviews = () => testimonials([
  {
    image: avatar(0), quote: 'Ordered the Nova Pro headphones on Monday, had them Tuesday. The noise cancelling is unreal.', name: 'Priya S.', role: 'Verified buyer, San Jose', rating: 5,
  },
  {
    image: avatar(1), quote: 'The Rewards points add up fast. Free express shipping as a Gold member is a game changer.', name: 'Marcus J.', role: 'Gold member, Chicago', rating: 5,
  },
  {
    image: avatar(2), quote: 'Returned a jacket that did not fit and the refund landed in two days. Easy.', name: 'Lena C.', role: 'Verified buyer, Berlin', rating: 4,
  },
]);

export const heroContent = (title, text, ctas = []) => `<h1>${esc(title)}</h1>${p(esc(text))}${ctas.map(([path, label, kind]) => (kind === 'secondary' ? secondary(path, label) : primary(path, label))).join('')}`;

export const imageParagraph = (key, alt) => p(img(scene(key), alt));
