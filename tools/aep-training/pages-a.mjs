/* Pages 01-15 of the AEP training site */
import {
  section, variant, hero, h, p, primary, secondary, banner, cta, productCarousel, productGrid,
  tabs, faq, accordion, columns, block, search, ul, img, esc, productImage, url, carousel,
  testimonials,
} from './html.mjs';
import {
  PRODUCTS, byTag, byCategory, bySku, CATEGORIES,
} from './catalog.mjs';
import {
  scene, heroContent, trustColumns, rewardsCta, categoryCards, collectionCards, reviews,
  helpCta, avatar,
} from './common.mjs';

const pick = (...skus) => skus.map(bySku);

/* ---------- 01 Home ---------- */
const home = {
  id: '01',
  name: 'Home',
  path: '',
  title: 'NovaMart | Electronics, Fashion & Home Appliances',
  description: 'Shop the latest electronics, fashion and home appliances at NovaMart. Free shipping over $75, 30-day returns and Rewards points on every order.',
  pageType: 'home',
  siteSection: 'home',
  image: scene('home-new'),
  purpose: 'Primary entry point. Routes visitors into departments and campaigns, and demonstrates visitor-type hero personalization, affinity-based CTAs and campaign banners.',
  extraEvents: ['scrollDepth'],
  rules: [
    'home-hero: logged-in users see the member hero; else returning visitors see "Welcome back"; everyone else (new visitors) sees the first-order WELCOME15 hero.',
    'home-cart-reminder: only cart abandoners see the "You left something in your cart" banner with SAVE10.',
    'home-promo: 50/50 A/B split of two flash-sale banner treatments (sticky per visitor).',
    'home-cta: electronics shoppers get an electronics CTA, fashion shoppers a fashion CTA, everyone else the Rewards CTA.',
  ],
  metrics: ['Hero click-through rate by experience', 'Banner CTR (A vs B) and lift', 'Personalized CTA CTR vs default', 'Scroll depth 50/75/100 % reach', 'Home -> product view rate', 'Revenue per visit by audience'],
  sections: [
    variant({
      location: 'home-hero', activity: 'XT-HOME-HERO', type: 'xt', audience: 'logged-in-users', experience: 'Member Hero',
    }, hero(scene('home-member'), 'Rewards member offers', heroContent('Double points week for members', 'Earn 2x Rewards points on everything until Sunday. Your exclusive member prices are already applied.', [['recommendations', 'Shop your picks'], ['membership', 'View my rewards', 'secondary']]))),
    variant({
      location: 'home-hero', activity: 'XT-HOME-HERO', type: 'xt', audience: 'returning-visitors', experience: 'Returning Visitor Hero',
    }, hero(scene('home-returning'), 'Recommended products', heroContent('Welcome back! Pick up where you left off', 'We saved your recently viewed items and picked a few new favourites for you.', [['recommendations', 'See recommendations'], ['cart', 'View cart', 'secondary']]))),
    variant({
      location: 'home-hero', activity: 'XT-HOME-HERO', type: 'xt', audience: 'new-visitors,default', experience: 'New Visitor Hero',
    }, hero(scene('home-new'), 'Electronics, fashion and home products', heroContent('Tech, style and home. All in one place.', 'New to NovaMart? Take 15% off your first order with code WELCOME15.', [['shop', 'Shop now'], ['deals', 'Explore deals', 'secondary']]))),
    variant({
      location: 'home-cart-reminder', activity: 'XT-HOME-CART-REMINDER', type: 'xt', audience: 'cart-abandoners', experience: 'Cart Reminder', campaignId: 'CMP-CART-RECOVERY',
    }, banner({
      text: `${h(2, 'You left something in your cart')}${p('Complete your order today and take an extra 10% off.')}${primary('cart', 'Return to cart')}`, coupon: 'SAVE10', campaignId: 'CMP-CART-RECOVERY', variants: ['alert', 'dismissible'],
    })),
    section([h(2, 'Shop by category'), categoryCards()]),
    section([h(2, 'Trending now'), p('Our best sellers this week across every department.'), productCarousel(byTag('best-seller'))], { style: 'highlight' }),
    variant({
      location: 'home-promo', activity: 'AB-HOME-PROMO', type: 'ab', audience: '', experience: 'A', campaignId: 'CMP-FLASH-A',
    }, banner({
      text: `${h(2, 'Weekend Flash Sale')}${p('Up to 30% off headphones, TVs and cameras. Ends Sunday at midnight.')}${primary('deals', 'Shop the sale')}`, campaignId: 'CMP-FLASH-A',
    })),
    variant({
      location: 'home-promo', activity: 'AB-HOME-PROMO', type: 'ab', audience: '', experience: 'B', campaignId: 'CMP-FLASH-B',
    }, banner({
      text: `${h(2, 'Flash Sale: big savings on top tech')}${p('48 hours only. Extra 10% off at checkout with your code.')}${primary('deals', 'Grab the deals')}`, coupon: 'SAVE10', campaignId: 'CMP-FLASH-B', variants: ['dark'],
    })),
    section([h(2, 'New arrivals'), productCarousel(byTag('new')), secondary('new-arrivals', 'See all new arrivals')]),
    variant({
      location: 'home-cta', activity: 'XT-HOME-CTA', type: 'xt', audience: 'electronics-shoppers', experience: 'Electronics CTA',
    }, cta(`${h(2, 'Just landed: Pulse X Smartphone')}${p('Triple 50 MP cameras and two-day battery. Trade in your old phone and save up to $300.')}${primary('products/pulse-x-smartphone', 'Discover Pulse X')}${secondary('electronics', 'All electronics')}`, { image: { src: productImage(bySku('EL-1003')), alt: 'Pulse X Smartphone' } })),
    variant({
      location: 'home-cta', activity: 'XT-HOME-CTA', type: 'xt', audience: 'fashion-shoppers', experience: 'Fashion CTA',
    }, cta(`${h(2, 'Your autumn style edit')}${p('Puffer jackets, leather boots and cosy knits picked for you.')}${primary('fashion', 'Shop the edit')}${secondary('seasonal-offers', 'Seasonal offers')}`, { image: { src: productImage(bySku('FA-2001')), alt: 'Summit Puffer Jacket' } })),
    variant({
      location: 'home-cta', activity: 'XT-HOME-CTA', type: 'xt', audience: 'default', experience: 'Rewards CTA',
    }, rewardsCta()),
    section([h(2, 'Loved by 2 million shoppers'), reviews()]),
    section([trustColumns()], { style: 'highlight' }),
  ],
};

/* ---------- 02 Shop ---------- */
const shop = {
  id: '02',
  name: 'Shop',
  path: 'shop',
  title: 'Shop All Departments | NovaMart',
  description: 'Browse every NovaMart department: electronics, fashion and home appliances, plus best sellers, new arrivals and deals.',
  pageType: 'shop',
  siteSection: 'shop',
  image: scene('shop'),
  purpose: 'Department hub that funnels traffic into category pages and collections; demonstrates search tracking and an affinity-based featured department.',
  rules: [
    'shop-featured: electronics shoppers see the electronics feature, fashion shoppers the fashion feature, everyone else a home appliances feature.',
  ],
  metrics: ['Category entry rate from Shop', 'Search usage rate and zero-result rate', 'Featured department CTR by experience'],
  sections: [
    section([hero(scene('shop'), 'All departments', heroContent('Shop all departments', 'Everything you need, from the latest tech to everyday style and smarter home appliances.', [['products', 'Browse all products']]))]),
    section([h(2, 'What are you looking for?'), search('Search 20+ products, brands and categories', 'products', ['headphones', 'jacket', 'espresso', 'sneakers'])]),
    section([h(2, 'Departments'), categoryCards()]),
    variant({
      location: 'shop-featured', activity: 'XT-SHOP-FEATURED', type: 'xt', audience: 'electronics-shoppers', experience: 'Electronics Feature',
    }, [h(2, 'Featured for you: Electronics'), productCarousel(byCategory('electronics'))], 'highlight'),
    variant({
      location: 'shop-featured', activity: 'XT-SHOP-FEATURED', type: 'xt', audience: 'fashion-shoppers', experience: 'Fashion Feature',
    }, [h(2, 'Featured for you: Fashion'), productCarousel(byCategory('fashion'))], 'highlight'),
    variant({
      location: 'shop-featured', activity: 'XT-SHOP-FEATURED', type: 'xt', audience: 'default', experience: 'Home Feature',
    }, [h(2, 'Featured: Home Appliances'), productCarousel(byCategory('home-appliances'))], 'highlight'),
    section([h(2, 'Collections'), collectionCards()]),
    section([trustColumns()]),
  ],
};

/* ---------- 03-05 Category pages ---------- */
const GEO_PROMOS = {
  electronics: {
    'geo-us-west': ['Same-day delivery in the Bay Area and LA', 'Order by 2pm for same-day delivery on thousands of tech products.'],
    'geo-us-east': ['Free next-day pickup in New York and Boston', 'Reserve online and pick up tomorrow at your nearest NovaMart.'],
    'geo-europe': ['Now shipping to Europe, duties included', 'Prices include VAT and import duties. Delivery in 3-5 days.'],
    default: ['Free shipping on orders over $75', 'Plus free returns for 30 days on all electronics.'],
  },
  fashion: {
    'geo-us-west': ['West Coast pop-up: try on in store', 'Visit our San Francisco and LA stores for free alterations this month.'],
    'geo-us-east': ['Winter-ready layers for the East Coast', 'Shop insulated jackets and boots built for real winters.'],
    'geo-europe': ['EU sizes now available', 'Every product page shows EU sizing. Free returns to our Berlin hub.'],
    default: ['Free returns on all fashion', 'Order two sizes, keep the one that fits.'],
  },
  'home-appliances': {
    'geo-us-west': ['Free installation in California', 'Washers and large appliances installed free by certified technicians.'],
    'geo-us-east': ['Next-day delivery for large appliances', 'Available across New York, New Jersey and Massachusetts.'],
    'geo-europe': ['EU plugs and 2-year EU warranty', 'All appliances ship with EU plugs and a 2-year warranty.'],
    default: ['Free delivery on large appliances', 'Plus haul-away of your old appliance for $25.'],
  },
};

const OFFERS = {
  electronics: [
    ['high-value-customers', 'VIP Offer', 'VIP early access', 'As one of our best customers, take 20% off orders over $300.', 'VIP20'],
    ['logged-in-users', 'Member Offer', 'Members save more', 'Earn double points on all electronics this week.', ''],
    ['new-visitors', 'First Order Offer', 'New here? Save 15%', 'Use your welcome code on any electronics order.', 'WELCOME15'],
    ['default', 'Default Offer', 'Trade in and save', 'Trade in your old device and get up to $300 credit.', ''],
  ],
  fashion: [
    ['fashion-shoppers', 'Style Edit Offer', 'Your style, 10% off', 'Because you love fashion: 10% off your next order.', 'SAVE10'],
    ['logged-in-users', 'Member Offer', 'Members get free express shipping', 'On every fashion order, no minimum.', 'FREESHIP'],
    ['new-visitors', 'First Order Offer', 'Welcome! 15% off your first look', 'Use your welcome code at checkout.', 'WELCOME15'],
    ['default', 'Default Offer', 'Buy 2, save 10%', 'Mix and match any two fashion items.', 'SAVE10'],
  ],
  'home-appliances': [
    ['high-value-customers', 'VIP Offer', 'Free installation for VIPs', 'Plus 20% off orders over $300 with your VIP code.', 'VIP20'],
    ['frequent-buyers', 'Loyalty Offer', 'Thanks for coming back', 'Free extended 3-year warranty on any appliance.', ''],
    ['default', 'Default Offer', 'Kitchen upgrade event', 'Save on blenders, air fryers and espresso machines.', 'SAVE10'],
  ],
};

const GUIDES = {
  electronics: [
    ['Headphones', `${h(3, 'Choosing headphones')}${p('Over-ear models give the best noise cancelling and battery life; earbuds win on portability. Look for multipoint Bluetooth if you switch between devices.')}${p(`<a href="${url('blog/how-to-choose-noise-cancelling-headphones')}">Read the full headphone guide</a>`)}`],
    ['Laptops', `${h(3, 'Choosing a laptop')}${p('16 GB of RAM is the sweet spot for multitasking. For travel, aim for under 1.4 kg and 10+ hours of battery.')}`],
    ['TVs', `${h(3, 'Choosing a TV')}${p('Sit about 1.5x the screen diagonal away for 4K. HDR and 120 Hz matter most for movies and gaming.')}`],
  ],
  fashion: [
    ['Size guide', `${h(3, 'Find your size')}${ul(['XS: chest 32-34 in', 'S: chest 35-37 in', 'M: chest 38-40 in', 'L: chest 41-43 in', 'XL: chest 44-46 in'])}`],
    ['Fabric care', `${h(3, 'Fabric care')}${p('Wash linen and organic cotton cold, dry flat. Treat leather boots with conditioner every season.')}`],
    ['Sustainability', `${h(3, 'Made better')}${p('Over 60% of our fashion range uses recycled or organic materials.')}`],
  ],
  'home-appliances': [
    ['Kitchen', `${h(3, 'Kitchen appliances')}${p('Pick a blender with at least 1200 W for smoothies with ice. Air fryers over 5 L feed a family of four.')}`],
    ['Cleaning', `${h(3, 'Cleaning appliances')}${p('Cordless vacuums with 60-minute runtime cover most homes on one charge.')}`],
    ['Energy', `${h(3, 'Energy efficiency')}${p('A-rated washers use up to 40% less energy than older models.')}`],
  ],
};

function categoryPage(id, num, name) {
  const geo = GEO_PROMOS[id];
  const geoSections = Object.entries(geo).map(([audience, [title, text]]) => variant({
    location: `${id}-geo-promo`, activity: 'XT-GEO-PROMO', type: 'xt', audience, experience: audience === 'default' ? 'Default Promo' : `${audience} Promo`, campaignId: `CMP-GEO-${id.toUpperCase()}`,
  }, banner({ text: `<p><strong>${esc(title)}</strong></p>${p(esc(text))}`, campaignId: `CMP-GEO-${id.toUpperCase()}`, variants: ['alert'] })));
  const offerSections = OFFERS[id].map(([audience, experience, title, text, coupon]) => variant({
    location: `${id}-offer`, activity: 'XT-CATEGORY-OFFER', type: 'xt', audience, experience, campaignId: `CMP-OFFER-${id.toUpperCase()}`,
  }, banner({ text: `${h(2, title)}${p(text)}`, coupon, campaignId: `CMP-OFFER-${id.toUpperCase()}` })));
  const products = byCategory(id);
  return {
    id: num,
    name,
    path: id,
    title: `${name} | NovaMart`,
    description: `Shop ${name.toLowerCase()} at NovaMart: ${products.slice(0, 3).map((x) => x.name).join(', ')} and more. Free shipping over $75.`,
    pageType: 'category',
    siteSection: 'shop',
    category: id,
    image: scene(id),
    purpose: `Category landing for ${name}. Demonstrates category views, filter/sort usage, in-grid search, product clicks, location-based promotions and audience-specific offers.`,
    rules: [
      `${id}-geo-promo: visitor location (time zone proxy for Target geo attributes) selects the US West, US East or Europe promotion, otherwise the default.`,
      `${id}-offer: first matching audience wins in this order: ${OFFERS[id].map((o) => o[0]).join(' > ')}.`,
    ],
    metrics: ['Category view to product click rate', 'Filter usage rate and most used filters', 'Search usage and zero results', 'Add to cart rate from grid', 'Offer coupon copy -> apply rate'],
    sections: [
      section([hero(scene(id), name, heroContent(name, `Discover ${products.length} hand-picked ${name.toLowerCase()} products from brands you love.`, [['deals', `${name} deals`]]))]),
      ...geoSections,
      section([h(2, `All ${name.toLowerCase()}`), productGrid(products, ['filters'])]),
      ...offerSections,
      section([h(2, 'Buying guides'), tabs(GUIDES[id])], { style: 'highlight' }),
      section([helpCta()]),
    ],
  };
}

/* ---------- 06 Product Listing ---------- */
const listing = {
  id: '06',
  name: 'Product Listing',
  path: 'products',
  title: 'All Products | NovaMart',
  description: 'Browse and filter every NovaMart product by category, brand, price and rating.',
  pageType: 'product-listing',
  siteSection: 'shop',
  category: 'all',
  image: scene('shop'),
  purpose: 'Search results and full catalogue listing. Receives header/search block queries (?q=) and demonstrates search, filter, sort and product impression tracking.',
  extraEvents: ['searchResultsView'],
  rules: ['plp-offer: cart abandoners see a "finish your order" banner, new visitors the WELCOME15 banner, everyone else a free shipping message.'],
  metrics: ['Search exit rate', 'Null search rate (searchNoResults / searchSubmit)', 'Filter and sort usage', 'Product click-through rate by position'],
  sections: [
    section([h(1, 'All products'), p('Use the filters to narrow down by category, brand and price, or search by keyword.')]),
    variant({
      location: 'plp-offer', activity: 'XT-PLP-OFFER', type: 'xt', audience: 'cart-abandoners', experience: 'Cart Recovery',
    }, banner({ text: `<p><strong>Still thinking it over?</strong> Your cart is saved. Take 10% off when you check out today.</p>${primary('cart', 'View cart')}`, coupon: 'SAVE10', variants: ['alert'] })),
    variant({
      location: 'plp-offer', activity: 'XT-PLP-OFFER', type: 'xt', audience: 'new-visitors', experience: 'Welcome Offer',
    }, banner({ text: '<p><strong>Welcome to NovaMart!</strong> 15% off your first order.</p>', coupon: 'WELCOME15', variants: ['alert'] })),
    variant({
      location: 'plp-offer', activity: 'XT-PLP-OFFER', type: 'xt', audience: 'default', experience: 'Free Shipping',
    }, banner({ text: '<p><strong>Free shipping</strong> on all orders over $75 and free 30-day returns.</p>', variants: ['alert'] })),
    section([productGrid(PRODUCTS, ['filters'])]),
  ],
};

/* ---------- 07 Product Details (template, one page per product) ---------- */
const SPECS = {
  electronics: [['Warranty', '2 years'], ['Connectivity', 'Bluetooth 5.3, USB-C'], ['In the box', 'Device, USB-C cable, quick start guide']],
  fashion: [['Materials', 'Recycled and organic fibres'], ['Fit', 'True to size'], ['Care', 'Machine wash cold']],
  'home-appliances': [['Warranty', '2 years, 3 years for members'], ['Power', '220-240 V / 110-120 V versions'], ['Energy rating', 'A']],
};

const CROSS_SELL = {
  electronics: ['EL-1006', 'EL-1008', 'EL-1004', 'FA-2008'],
  fashion: ['FA-2004', 'FA-2006', 'FA-2005', 'FA-2003'],
  'home-appliances': ['HA-3005', 'HA-3001', 'HA-3007', 'HA-3004'],
};

export function productPage(product, { id = '07', name = 'Product Details' } = {}) {
  const similar = byCategory(product.category).filter((x) => x.sku !== product.sku).slice(0, 6);
  const cross = pick(...CROSS_SELL[product.category]).filter((x) => x.sku !== product.sku);
  const images = [0, 1, 2].map((i) => img(productImage(product, i), `${product.name} view ${i + 1}`)).join('');
  return {
    id,
    name,
    path: `products/${product.slug}`,
    title: `${product.name} | ${product.brand} | NovaMart`,
    description: `${product.description.split('. ')[0]}. Buy the ${product.name} at NovaMart for $${product.price}.`,
    pageType: 'product',
    siteSection: 'shop',
    category: product.category,
    image: productImage(product),
    meta: {
      'product-id': product.sku,
      'product-name': product.name,
      'product-brand': product.brand,
      'product-price': product.price.toFixed(2),
    },
    purpose: 'Product detail page (PDP). Demonstrates product views, image gallery usage, tab clicks, add to cart, wishlist adds, review clicks and Target Recommendations (similar, cross-sell, recently viewed).',
    extraEvents: ['productView', 'galleryInteraction', 'productOptionSelect', 'cartAdd', 'wishlistAdd', 'reviewsClick', 'tabClick'],
    rules: [
      'pdp-recommendations: Target Recommendations "people who viewed this also viewed" (entity.id = productId); simulator shows same-category products.',
      'pdp-cross-sell: "frequently bought together" accessories for the category.',
      'pdp-recently-viewed: products from the visitor profile (hidden on first product view).',
      'pdp-trust: A/B test of free-returns messaging vs. rating social proof.',
    ],
    metrics: ['Product view -> add to cart rate', 'Gallery interaction rate', 'Reviews click rate', 'Recommendation CTR and influenced revenue', 'Wishlist add rate'],
    sections: [
      section([block('product-info', [], [
        [images], [esc(product.name)], [product.sku], [product.price.toFixed(2)],
        [product.compareAt ? product.compareAt.toFixed(2) : ''], [esc(product.brand)], [product.category],
        [product.rating.toFixed(1)], [String(product.reviews)],
        [`${p(esc(product.description))}${ul(['Free standard shipping over $75', '30-day free returns', `${CATEGORIES[product.category].name} expert support`])}`],
        [product.options.join(', ')],
      ])]),
      variant({
        location: 'pdp-trust', activity: 'AB-PDP-TRUST', type: 'ab', audience: '', experience: 'A',
      }, columns([`${h(3, 'Free 30-day returns')}${p('Not right? Send it back for free.')}`, `${h(3, 'Price match promise')}${p('We match any major retailer.')}`, `${h(3, 'Fast delivery')}${p('Most orders arrive in 2-3 days.')}`]), 'highlight'),
      variant({
        location: 'pdp-trust', activity: 'AB-PDP-TRUST', type: 'ab', audience: '', experience: 'B',
      }, [p(`<strong>★ ${product.rating.toFixed(1)} from ${product.reviews.toLocaleString('en-US')} verified buyers.</strong> 94% would recommend this product to a friend.`)], 'highlight'),
      section([tabs([
        ['Description', `${p(esc(product.description))}${p(`Designed by ${esc(product.brand)} for everyday use, backed by NovaMart's 30-day return policy.`)}`],
        ['Specifications', `<table><tbody>${SPECS[product.category].map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}<tr><th scope="row">SKU</th><td>${product.sku}</td></tr></tbody></table>`],
        ['Shipping & returns', `${p('Free standard shipping on orders over $75. Express and next-day options at checkout.')}${p('Free returns within 30 days.')}`],
      ])]),
      variant({
        location: 'pdp-cross-sell', activity: 'RECS-PDP-CROSS-SELL', type: 'recs', audience: 'default', experience: 'Frequently Bought Together',
      }, [h(2, 'Frequently bought together'), productCarousel(cross, ['recommendations'])]),
      section([h(2, 'Customer reviews', 'customer-reviews'), p(`<strong>★ ${product.rating.toFixed(1)} out of 5</strong> based on ${product.reviews.toLocaleString('en-US')} reviews.`), testimonials([
        {
          image: avatar(3), quote: `Exactly as described. The ${product.name} exceeded my expectations.`, name: 'Daniel K.', role: 'Verified buyer', rating: 5,
        },
        {
          image: avatar(4), quote: 'Great quality for the price, and delivery was quicker than promised.', name: 'Aisha R.', role: 'Verified buyer', rating: 4,
        },
        {
          image: avatar(5), quote: 'Second one I have bought. Would recommend to anyone.', name: 'Tom N.', role: 'Gold member', rating: 5,
        },
      ])]),
      variant({
        location: 'pdp-recommendations', activity: 'RECS-PDP-SIMILAR', type: 'recs', audience: 'default', experience: 'Similar Products',
      }, [h(2, 'Customers also viewed'), productCarousel(similar, ['recommendations'])], 'highlight'),
      variant({
        location: 'pdp-recently-viewed', activity: 'RECS-RECENTLY-VIEWED', type: 'recs', audience: 'default', experience: 'Recently Viewed',
      }, [h(2, 'Recently viewed'), productCarousel([], ['recently-viewed'])]),
    ],
  };
}

/* ---------- 08 Best Sellers ---------- */
const bestSellers = {
  id: '08',
  name: 'Best Sellers',
  path: 'best-sellers',
  title: 'Best Sellers | NovaMart',
  description: 'Shop NovaMart best sellers: the most popular electronics, fashion and home appliances this week.',
  pageType: 'merchandising',
  siteSection: 'collections',
  category: 'best-sellers',
  image: scene('best-sellers'),
  purpose: 'Merchandising collection driven by social proof. Shows frequent buyers a loyalty perk.',
  rules: ['bestsellers-offer: frequent buyers (3+ orders) get free express shipping; everyone else sees review highlights.'],
  metrics: ['Collection add to cart rate', 'Perk banner CTR for frequent buyers', 'Revenue per visit'],
  sections: [
    section([hero(scene('best-sellers'), 'Best sellers', heroContent('Best sellers', 'The products our customers love most, updated every week.', [['products?sort=rating', 'Shop top rated']]))]),
    variant({
      location: 'bestsellers-offer', activity: 'XT-BESTSELLERS', type: 'xt', audience: 'frequent-buyers', experience: 'Frequent Buyer Perk', campaignId: 'CMP-LOYAL-SHIP',
    }, banner({ text: `${h(2, 'Thanks for being a regular!')}${p('Enjoy free express shipping on your next order.')}`, coupon: 'FREESHIP', campaignId: 'CMP-LOYAL-SHIP' })),
    variant({
      location: 'bestsellers-offer', activity: 'XT-BESTSELLERS', type: 'xt', audience: 'default', experience: 'Social Proof',
    }, [h(2, 'Why customers love them'), reviews()]),
    section([h(2, 'This week\'s best sellers'), productGrid(byTag('best-seller'), ['filters'])]),
    section([rewardsCta()]),
  ],
};

/* ---------- 09 New Arrivals ---------- */
const newArrivals = {
  id: '09',
  name: 'New Arrivals',
  path: 'new-arrivals',
  title: 'New Arrivals | NovaMart',
  description: 'Discover the latest arrivals at NovaMart: new laptops, earbuds, dresses, backpacks and smart home appliances.',
  pageType: 'merchandising',
  siteSection: 'collections',
  category: 'new-arrivals',
  image: scene('new-arrivals'),
  purpose: 'Freshness-driven collection. Features a new product matched to the visitor\'s category affinity.',
  rules: ['new-arrivals-feature: electronics shoppers see the Lumen Book laptop, fashion shoppers the Riviera dress, others the Barista Touch espresso machine.'],
  metrics: ['New product view rate', 'Feature CTA CTR by affinity', 'Add to cart rate'],
  sections: [
    section([hero(scene('new-arrivals'), 'New arrivals', heroContent('New arrivals', 'Fresh drops across tech, fashion and home. Be the first to try them.', [['products', 'Browse everything']]))]),
    ...[['electronics-shoppers', 'EL-1002', 'Electronics Feature'], ['fashion-shoppers', 'FA-2002', 'Fashion Feature'], ['default', 'HA-3003', 'Home Feature']].map(([audience, sku, experience]) => {
      const prod = bySku(sku);
      return variant({
        location: 'new-arrivals-feature', activity: 'XT-NEW-ARRIVALS', type: 'xt', audience, experience,
      }, cta(`${h(2, `New: ${prod.name}`)}${p(esc(prod.description))}${primary(`products/${prod.slug}`, 'View product')}`, { image: { src: productImage(prod), alt: prod.name } }));
    }),
    section([h(2, 'Just in'), productGrid(byTag('new'), ['filters'])]),
  ],
};

/* ---------- 10 Deals ---------- */
const deals = {
  id: '10',
  name: 'Deals',
  path: 'deals',
  title: 'Deals & Discounts | NovaMart',
  description: 'Save up to 30% on top brands. Shop NovaMart deals on TVs, headphones, vacuums, boots and more.',
  pageType: 'merchandising',
  siteSection: 'collections',
  category: 'deals',
  image: scene('deals'),
  campaignId: 'CMP-DEALS-WEEK',
  purpose: 'Promotional hub and the multivariate test page: two headlines x two banners are combined independently (full factorial MVT).',
  rules: ['MVT-DEALS: deals-headline (A/B) and deals-banner (A/B) are assigned independently per visitor, producing 4 combinations; Target MVT reports element contribution.'],
  metrics: ['Revenue per visit by combination', 'Element contribution (headline vs banner)', 'Coupon copy and apply rate'],
  sections: [
    variant({
      location: 'deals-headline', activity: 'MVT-DEALS', type: 'mvt', audience: '', experience: 'A',
    }, hero(scene('deals'), 'Deals of the week', heroContent('Deals of the week', 'Top brands, lowest prices of the season.', [['#all-deals', 'Shop deals']]))),
    variant({
      location: 'deals-headline', activity: 'MVT-DEALS', type: 'mvt', audience: '', experience: 'B',
    }, hero(scene('deals'), 'Up to 30% off', heroContent('Up to 30% off. This week only.', 'Prices drop on TVs, headphones, vacuums and boots.', [['#all-deals', 'See all deals']]))),
    variant({
      location: 'deals-banner', activity: 'MVT-DEALS', type: 'mvt', audience: '', experience: 'A', campaignId: 'CMP-DEALS-A',
    }, banner({ text: `${h(2, 'Extra 10% off everything on sale')}${p('Stack this code with sale prices at checkout.')}`, coupon: 'SAVE10', campaignId: 'CMP-DEALS-A' })),
    variant({
      location: 'deals-banner', activity: 'MVT-DEALS', type: 'mvt', audience: '', experience: 'B', campaignId: 'CMP-DEALS-B',
    }, banner({ text: `${h(2, 'Free shipping on every deal')}${p('No minimum spend until Sunday.')}`, coupon: 'FREESHIP', campaignId: 'CMP-DEALS-B', variants: ['dark'] })),
    section([h(2, 'All deals', 'all-deals'), productGrid(PRODUCTS.filter((x) => x.compareAt), ['filters'])]),
    section([h(2, 'Deal questions'), faq([
      ['Can I combine coupon codes?', p('One coupon code per order. Coupon codes can be combined with sale prices.')],
      ['Do deals include price match?', p('Yes. If a deal price drops further within 14 days we refund the difference.')],
      ['When do deals end?', p('Weekly deals end Sunday at 11:59pm local time.')],
    ])]),
  ],
};

/* ---------- 11 Seasonal Offers ---------- */
const seasonal = {
  id: '11',
  name: 'Seasonal Offers',
  path: 'seasonal-offers',
  title: 'Seasonal Offers: Fall Favourites | NovaMart',
  description: 'Fall favourites and holiday gift ideas: puffer jackets, leather boots, smart kettles and cosy tech.',
  pageType: 'merchandising',
  siteSection: 'collections',
  category: 'seasonal',
  image: scene('seasonal'),
  campaignId: 'CMP-FALL-2026',
  purpose: 'Seasonal campaign landing with location-aware hero and a collection carousel.',
  rules: ['seasonal-hero: European visitors see the "Autumn in Europe" hero (EU shipping), US West visitors a mild-weather edit, others the default fall hero.'],
  metrics: ['Campaign landing CTR', 'Carousel interaction rate', 'Seasonal collection revenue'],
  sections: [
    variant({
      location: 'seasonal-hero', activity: 'XT-SEASONAL-HERO', type: 'xt', audience: 'geo-europe', experience: 'Europe Hero', campaignId: 'CMP-FALL-EU',
    }, hero(scene('seasonal-europe'), 'Autumn in Europe', heroContent('Autumn favourites, delivered across Europe', 'Duties included and free returns to our Berlin hub.', [['#shop-the-season', 'Shop autumn']]))),
    variant({
      location: 'seasonal-hero', activity: 'XT-SEASONAL-HERO', type: 'xt', audience: 'geo-us-west', experience: 'US West Hero', campaignId: 'CMP-FALL-USW',
    }, hero(scene('seasonal'), 'Fall layers', heroContent('Light layers for West Coast fall', 'Linen, light jackets and outdoor tech for sunny autumn days.', [['#shop-the-season', 'Shop the edit']]))),
    variant({
      location: 'seasonal-hero', activity: 'XT-SEASONAL-HERO', type: 'xt', audience: 'default', experience: 'Default Hero', campaignId: 'CMP-FALL-2026',
    }, hero(scene('seasonal'), 'Fall favourites', heroContent('Fall favourites are here', 'Cosy layers, warm drinks and gifts for everyone on your list.', [['#shop-the-season', 'Shop seasonal offers']]))),
    section([h(2, 'Seasonal collections'), carousel([
      { image: scene('tile-fashion'), alt: 'Outerwear', body: `${h(3, 'Outerwear')}${p('Puffers and boots built for cold mornings.')}${primary('fashion', 'Shop outerwear')}` },
      { image: scene('tile-home'), alt: 'Warm drinks', body: `${h(3, 'Warm drinks')}${p('Espresso machines and smart kettles.')}${primary('home-appliances', 'Shop kitchen')}` },
      { image: scene('tile-electronics'), alt: 'Cosy tech', body: `${h(3, 'Cosy tech')}${p('TVs and speakers for nights in.')}${primary('electronics', 'Shop tech')}` },
    ])]),
    section([h(2, 'Shop the season', 'shop-the-season'), productGrid(byTag('seasonal'), ['filters'])]),
    section([cta(`${h(2, 'Holiday gifting made easy')}${p('Free gift wrap and extended returns until January 31.')}${primary('faq', 'Holiday shipping dates')}`, { variants: ['accent'] })]),
  ],
};

/* ---------- 12 Wishlist ---------- */
const wishlist = {
  id: '12',
  name: 'Wishlist',
  path: 'wishlist',
  title: 'My Wishlist | NovaMart',
  description: 'Your saved NovaMart products.',
  pageType: 'wishlist',
  siteSection: 'account',
  robots: 'noindex, follow',
  purpose: 'Saved products. Demonstrates wishlist views/removals, move to cart and a sign-in prompt for anonymous users.',
  extraEvents: ['wishlistView', 'wishlistRemove', 'cartAdd'],
  rules: ['wishlist-offer: logged-in users see price-drop alert messaging; anonymous users are prompted to sign in to sync their wishlist.'],
  metrics: ['Wishlist to cart conversion', 'Sign-in rate from prompt', 'Wishlist size per visitor'],
  sections: [
    section([h(1, 'My wishlist')]),
    variant({
      location: 'wishlist-offer', activity: 'XT-WISHLIST', type: 'xt', audience: 'logged-in-users', experience: 'Price Alerts',
    }, banner({ text: '<p><strong>Price-drop alerts are on.</strong> We will email you when anything on your wishlist goes on sale.</p>', variants: ['alert'] })),
    variant({
      location: 'wishlist-offer', activity: 'XT-WISHLIST', type: 'xt', audience: 'default', experience: 'Sign-in Prompt',
    }, banner({ text: `<p><strong>Sign in to keep your wishlist on every device</strong> and get price-drop alerts.</p>${primary('#aep:sign-in', 'Sign in')}`, variants: ['alert'] })),
    section([block('wishlist', [], [['']])]),
    section([h(2, 'You might also like'), productCarousel(byTag('best-seller'), ['recommendations'])], { style: 'highlight' }),
  ],
};

/* ---------- 13 Cart ---------- */
const cart = {
  id: '13',
  name: 'Cart',
  path: 'cart',
  title: 'Shopping Cart | NovaMart',
  description: 'Review the items in your NovaMart cart.',
  pageType: 'cart',
  siteSection: 'checkout',
  robots: 'noindex, follow',
  purpose: 'Cart review. Demonstrates cart views, quantity changes, removals, coupon usage, a high cart value discount banner and a personalized coupon.',
  extraEvents: ['cartView', 'cartAdd', 'cartRemove', 'couponApply', 'couponRemove'],
  rules: [
    'cart-offer: cart subtotal >= $300 (high-cart-value condition) unlocks the VIP20 banner, otherwise an incentive to reach $300 is shown. Evaluated on page load.',
    'cart-coupon: cart abandoners get SAVE10, new visitors WELCOME15; others see no coupon (no default experience).',
  ],
  metrics: ['Cart to checkout rate', 'Cart removal rate', 'Coupon apply success rate', 'AOV for high cart value audience', 'Cross-sell add rate'],
  sections: [
    section([h(1, 'Your cart')]),
    variant({
      location: 'cart-offer', activity: 'XT-CART-HIGH-VALUE', type: 'xt', audience: 'high-cart-value', experience: 'VIP Discount', campaignId: 'CMP-CART-VIP',
    }, banner({ text: `${h(2, 'You have unlocked 20% off')}${p('Your cart is over $300. Apply your VIP code below before checkout.')}`, coupon: 'VIP20', campaignId: 'CMP-CART-VIP' })),
    variant({
      location: 'cart-offer', activity: 'XT-CART-HIGH-VALUE', type: 'xt', audience: 'default', experience: 'Spend More Incentive',
    }, banner({ text: '<p><strong>Spend $300 or more and unlock 20% off</strong> your entire order.</p>', variants: ['alert'] })),
    variant({
      location: 'cart-coupon', activity: 'XT-CART-COUPON', type: 'xt', audience: 'cart-abandoners', experience: 'Welcome Back Coupon', campaignId: 'CMP-CART-RECOVERY',
    }, banner({ text: '<p><strong>Welcome back!</strong> Here is 10% off to complete your order.</p>', coupon: 'SAVE10', campaignId: 'CMP-CART-RECOVERY', variants: ['dark'] })),
    variant({
      location: 'cart-coupon', activity: 'XT-CART-COUPON', type: 'xt', audience: 'new-visitors', experience: 'First Order Coupon', campaignId: 'CMP-WELCOME',
    }, banner({ text: '<p><strong>First order?</strong> Take 15% off with your welcome code.</p>', coupon: 'WELCOME15', campaignId: 'CMP-WELCOME', variants: ['dark'] })),
    section([block('cart', [], [[`${h(2, 'Your cart is empty')}${p('Looks like you have not added anything yet.')}${primary('shop', 'Start shopping')}`]])]),
    variant({
      location: 'cart-cross-sell', activity: 'RECS-CART-CROSS-SELL', type: 'recs', audience: 'default', experience: 'Cart Cross-sell',
    }, [h(2, 'Complete your order'), productCarousel(pick('EL-1006', 'FA-2004', 'HA-3005', 'EL-1008', 'FA-2005'), ['recommendations'])], 'highlight'),
    section([p('Training tip: try the coupon codes SAVE10, WELCOME15, VIP20 (needs $300+) and FREESHIP, or an invalid code to see couponStatus "invalid".')]),
  ],
};

/* ---------- 14 Checkout ---------- */
const checkout = {
  id: '14',
  name: 'Checkout',
  path: 'checkout',
  title: 'Checkout | NovaMart',
  description: 'Secure checkout.',
  pageType: 'checkout',
  siteSection: 'checkout',
  robots: 'noindex, nofollow',
  purpose: 'Single-page checkout. Demonstrates checkout start, step tracking, shipping and payment selection and checkout completion (purchase).',
  extraEvents: ['checkoutStart', 'checkoutStep', 'shippingSelect', 'paymentSelect', 'checkoutError', 'checkoutComplete'],
  rules: ['checkout-trust: A/B test of security badges (A) vs. social proof (B) above the form.'],
  metrics: ['Checkout start -> completion rate', 'Step drop-off', 'Shipping method mix', 'Payment method mix', 'Validation error rate'],
  sections: [
    section([h(1, 'Checkout')]),
    variant({
      location: 'checkout-trust', activity: 'AB-CHECKOUT-TRUST', type: 'ab', audience: '', experience: 'A',
    }, [p('<strong>🔒 Secure checkout.</strong> 256-bit encryption · Buyer protection · Free 30-day returns')]),
    variant({
      location: 'checkout-trust', activity: 'AB-CHECKOUT-TRUST', type: 'ab', audience: '', experience: 'B',
    }, [p('<strong>★ 4.8/5 from 120,000+ reviews.</strong> Join 2 million happy NovaMart customers.')]),
    section([block('checkout', [], [[p('Already a member? <a href="#aep:sign-in">Sign in</a> to prefill your details and earn points.')]])]),
  ],
};

/* ---------- 15 Order Confirmation ---------- */
const confirmation = {
  id: '15',
  name: 'Order Confirmation',
  path: 'order-confirmation',
  title: 'Order Confirmation | NovaMart',
  description: 'Thank you for your order.',
  pageType: 'order-confirmation',
  siteSection: 'checkout',
  robots: 'noindex, nofollow',
  purpose: 'Post-purchase page. Shows the order summary and a next-best-action (membership upsell for first-time buyers).',
  extraEvents: ['orderConfirmationView'],
  rules: ['confirmation-next: first-time buyers are invited to join Rewards, frequent buyers get a VIP thank-you, everyone else continues shopping.'],
  metrics: ['Post-purchase enrollment rate', 'Repeat visit within 7 days', 'Recommendation CTR after purchase'],
  sections: [
    section([h(1, 'Order confirmed'), block('orders', ['confirmation'], [['']])]),
    variant({
      location: 'confirmation-next', activity: 'XT-CONFIRMATION-NEXT', type: 'xt', audience: 'first-time-buyers', experience: 'Join Rewards',
    }, cta(`${h(2, 'Earn points on this order')}${p('Join NovaMart Rewards now and we will add points for today\'s purchase.')}${primary('#aep:enroll', 'Join Rewards')}`, { variants: ['dark'] })),
    variant({
      location: 'confirmation-next', activity: 'XT-CONFIRMATION-NEXT', type: 'xt', audience: 'frequent-buyers', experience: 'VIP Thank You',
    }, cta(`${h(2, 'Thank you for being a VIP')}${p('Your next order ships free with express delivery.')}${primary('recommendations', 'See your picks')}`)),
    variant({
      location: 'confirmation-next', activity: 'XT-CONFIRMATION-NEXT', type: 'xt', audience: 'default', experience: 'Continue Shopping',
    }, [h(2, 'You might also like'), productCarousel(byTag('new'), ['recommendations'])]),
  ],
};

export default [
  home, shop,
  categoryPage('electronics', '03', 'Electronics'),
  categoryPage('fashion', '04', 'Fashion'),
  categoryPage('home-appliances', '05', 'Home Appliances'),
  listing,
  productPage(bySku('EL-1001')),
  bestSellers, newArrivals, deals, seasonal, wishlist, cart, checkout, confirmation,
];
