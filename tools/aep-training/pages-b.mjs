/* Pages 16-30 of the AEP training site */
import {
  section, variant, hero, h, p, primary, secondary, banner, cta, productCarousel, productGrid,
  faq, accordion, columns, cards, block, search, ul, img, url, tabs,
} from './html.mjs';
import { byTag, byCategory, bySku } from './catalog.mjs';
import {
  scene, heroContent, trustColumns, rewardsCta, categoryCards, reviews, helpCta,
} from './common.mjs';

const pick = (...skus) => skus.map(bySku);

/* ---------- 16 My Account ---------- */
const account = {
  id: '16',
  name: 'My Account',
  path: 'account',
  title: 'My Account | NovaMart',
  description: 'Manage your NovaMart orders, wishlist, Rewards and preferences.',
  pageType: 'account',
  siteSection: 'account',
  robots: 'noindex, follow',
  purpose: 'Account dashboard. Demo sign-in/sign-out switches the authState used by Logged-In Users and Anonymous Users audiences.',
  extraEvents: ['loginComplete', 'logout'],
  rules: ['account-hero: logged-in users see their dashboard; anonymous users see the sign-in prompt with member benefits.'],
  metrics: ['Login rate', 'Dashboard link CTR', 'Membership enrollment from account'],
  sections: [
    variant({
      location: 'account-hero', activity: 'XT-ACCOUNT', type: 'xt', audience: 'logged-in-users', experience: 'Dashboard',
    }, [h(1, 'Welcome back, Alex'), p('Gold member · 2,450 points · Member since 2023'), cards([
      { body: `${h(2, 'Orders')}${p('View and reorder past purchases.')}${p(`<a href="${url('account/orders')}">Order history</a>`)}` },
      { body: `${h(2, 'Track an order')}${p('See where your package is.')}${p(`<a href="${url('account/track-order')}">Track orders</a>`)}` },
      { body: `${h(2, 'Wishlist')}${p('Products you have saved.')}${p(`<a href="${url('wishlist')}">View wishlist</a>`)}` },
      { body: `${h(2, 'Rewards')}${p('Points, tier and member perks.')}${p(`<a href="${url('membership')}">My rewards</a>`)}` },
    ]), secondary('#aep:sign-out', 'Sign out')]),
    variant({
      location: 'account-hero', activity: 'XT-ACCOUNT', type: 'xt', audience: 'default', experience: 'Sign-in Prompt',
    }, [h(1, 'My account'), cta(`${h(2, 'Sign in to your account')}${p('Track orders, save your wishlist across devices and earn Rewards points.')}${primary('#aep:sign-in', 'Sign in as demo customer')}${secondary('membership', 'Create an account')}`, { variants: ['dark'] }), p('Training note: the demo sign-in sets authState=authenticated and customerId=CUST-100245 (loyalty tier: gold) in the data layer.')]),
    section([h(2, 'Account help'), accordion([
      ['How do I change my password?', p('Go to Account settings > Security and choose Change password.')],
      ['How do I update my address?', p('Addresses can be edited during checkout or under Account settings > Addresses.')],
      ['How do I delete my account?', `${p('Contact support and we will delete your account and personal data within 30 days.')}${p(`<a href="${url('privacy-policy')}">Read our privacy policy</a>`)}`],
    ])]),
  ],
};

/* ---------- 17 Order History ---------- */
const orders = {
  id: '17',
  name: 'Order History',
  path: 'account/orders',
  title: 'Order History | NovaMart',
  description: 'View your NovaMart orders.',
  pageType: 'order-history',
  siteSection: 'account',
  robots: 'noindex, follow',
  purpose: 'Order history for signed-in customers (sample orders are seeded on sign-in).',
  extraEvents: ['orderHistoryView', 'orderTrackClick'],
  rules: ['orders-reorder: frequent buyers see a "buy it again" carousel, everyone else a Rewards reminder.'],
  metrics: ['Reorder rate', 'Track click rate', 'Login rate from orders page'],
  sections: [
    section([h(1, 'Order history'), block('orders', [], [['']])]),
    variant({
      location: 'orders-reorder', activity: 'XT-ORDERS-REORDER', type: 'xt', audience: 'frequent-buyers', experience: 'Buy It Again',
    }, [h(2, 'Buy it again'), productCarousel(pick('FA-2003', 'FA-2006', 'EL-1001', 'HA-3004'), ['recommendations'])]),
    variant({
      location: 'orders-reorder', activity: 'XT-ORDERS-REORDER', type: 'xt', audience: 'default', experience: 'Rewards Reminder',
    }, rewardsCta()),
  ],
};

/* ---------- 18 Track Orders ---------- */
const track = {
  id: '18',
  name: 'Track Orders',
  path: 'account/track-order',
  title: 'Track Your Order | NovaMart',
  description: 'Track your NovaMart order status and delivery.',
  pageType: 'order-tracking',
  siteSection: 'account',
  purpose: 'Self-service order tracking by order number. Demonstrates form-based events with success/failure attributes.',
  extraEvents: ['orderTrack'],
  rules: ['tracking-help: logged-in users are pointed to their order list; anonymous users are told where to find the order number.'],
  metrics: ['Tracking success rate (orderFound)', 'Support contact rate after tracking'],
  sections: [
    section([h(1, 'Track your order'), p('Enter the order number from your confirmation email (for example NM-517204 after signing in).'), block('orders', ['tracking'], [['']])]),
    variant({
      location: 'tracking-help', activity: 'XT-TRACKING-HELP', type: 'xt', audience: 'logged-in-users', experience: 'Signed-in Help',
    }, banner({ text: `<p><strong>Signed in?</strong> All your orders and tracking links are in your order history.</p>${primary('account/orders', 'View my orders')}`, variants: ['alert'] })),
    variant({
      location: 'tracking-help', activity: 'XT-TRACKING-HELP', type: 'xt', audience: 'default', experience: 'Anonymous Help',
    }, banner({ text: `<p><strong>Can't find your order number?</strong> It starts with NM- and is in your confirmation email.</p>${primary('#aep:sign-in', 'Sign in instead')}`, variants: ['alert'] })),
    section([h(2, 'Delivery questions'), faq([
      ['How long does delivery take?', p('Standard 5-7 business days, Express 2-3, Next day if ordered before 2pm.')],
      ['My tracking has not updated', p('Tracking can take up to 24 hours to update after dispatch.')],
      ['Can I change my delivery address?', p('Yes, until the order status is Shipped. Contact support for help.')],
    ])]),
  ],
};

/* ---------- 19 Customer Support ---------- */
const SUPPORT_TOPICS = [
  ['Orders & delivery', 'Track packages, delivery times and changes to your order.', 'account/track-order'],
  ['Returns & refunds', 'Start a return, check refund status and our 30-day policy.', 'faq'],
  ['Payments & coupons', 'Payment methods, coupon codes and gift cards.', 'faq'],
  ['Rewards membership', 'Points, tiers and member perks.', 'membership'],
  ['Product help', 'Setup guides, warranties and troubleshooting.', 'blog'],
  ['Account & privacy', 'Sign-in, personal data and preferences.', 'privacy-policy'],
];

const support = {
  id: '19',
  name: 'Customer Support',
  path: 'support',
  title: 'Customer Support | NovaMart',
  description: 'Get help with orders, delivery, returns, payments and NovaMart Rewards.',
  pageType: 'support',
  siteSection: 'support',
  image: scene('support'),
  purpose: 'Help centre. Demonstrates on-page content search, FAQ engagement and priority support messaging for high-value customers.',
  rules: ['support-priority: high-value customers see the priority phone line; logged-in users live chat; everyone else self-service links.'],
  metrics: ['Self-service rate (FAQ helpful = yes)', 'Help search zero-result rate', 'Contact rate'],
  sections: [
    section([hero(scene('support'), 'Customer support', heroContent('How can we help?', 'Search our help topics or browse popular questions below.'))]),
    section([search('Search help topics', 'content', ['returns', 'delivery', 'points', 'coupon'])]),
    variant({
      location: 'support-priority', activity: 'XT-SUPPORT-PRIORITY', type: 'xt', audience: 'high-value-customers', experience: 'Priority Line',
    }, banner({ text: `${h(2, 'Priority support for VIP customers')}${p('Skip the queue: call 1-800-555-0199, available 24/7.')}${primary('contact', 'Contact priority support')}` })),
    variant({
      location: 'support-priority', activity: 'XT-SUPPORT-PRIORITY', type: 'xt', audience: 'logged-in-users', experience: 'Member Chat',
    }, banner({ text: `<p><strong>Members get live chat</strong>, average reply in under 2 minutes.</p>${primary('contact', 'Start chat')}`, variants: ['alert'] })),
    variant({
      location: 'support-priority', activity: 'XT-SUPPORT-PRIORITY', type: 'xt', audience: 'default', experience: 'Self Service',
    }, banner({ text: `<p><strong>Most answers are one click away.</strong> Try our FAQ or track your order online.</p>${primary('faq', 'Browse FAQ')}`, variants: ['alert'] })),
    section([h(2, 'Help topics'), cards(SUPPORT_TOPICS.map(([title, text, path]) => ({ body: `${h(3, title)}${p(text)}${p(`<a href="${url(path)}">${title}</a>`)}` })))]),
    section([h(2, 'Popular questions'), faq([
      ['How do I return an item?', p('Start a return from your order history within 30 days. Returns are free.')],
      ['When will I get my refund?', p('Refunds are issued within 2 business days of us receiving the item.')],
      ['Which coupon codes are active?', p('Current codes appear on our Deals page and in member emails.')],
      ['How do Rewards points work?', p('Earn 2 points per $1. 500 points = $5 off.')],
    ])], { style: 'highlight' }),
  ],
};

/* ---------- 20 Contact Us ---------- */
const contact = {
  id: '20',
  name: 'Contact Us',
  path: 'contact',
  title: 'Contact Us | NovaMart',
  description: 'Contact NovaMart customer care by chat, phone or email.',
  pageType: 'contact',
  siteSection: 'support',
  purpose: 'Contact channels with tracked channel CTAs; cart abandoners get cart-specific help.',
  rules: ['contact-cta: cart abandoners are offered help completing their order; others see general support hours.'],
  metrics: ['Contact channel mix (CTAName)', 'Cart recovery from contact page'],
  sections: [
    section([h(1, 'Contact us'), p('We are here 7 days a week, 8am to 10pm ET.')]),
    section([columns([
      `${h(2, 'Live chat')}${p('Fastest way to reach us. Average reply under 2 minutes.')}${primary('#chat', 'Start chat')}`,
      `${h(2, 'Phone')}${p('1-800-555-0100<br>Mon-Sun, 8am-10pm ET')}${secondary('tel:+18005550100', 'Call us')}`,
      `${h(2, 'Email')}${p('care@novamart.example<br>Reply within 24 hours')}${secondary('mailto:care@novamart.example', 'Email us')}`,
    ])], { style: 'highlight' }),
    variant({
      location: 'contact-cta', activity: 'XT-CONTACT', type: 'xt', audience: 'cart-abandoners', experience: 'Cart Help',
    }, cta(`${h(2, 'Questions about your cart?')}${p('Our team can help you choose, apply coupons or arrange delivery.')}${primary('cart', 'Return to cart')}`, { variants: ['accent'] })),
    variant({
      location: 'contact-cta', activity: 'XT-CONTACT', type: 'xt', audience: 'default', experience: 'General Help',
    }, helpCta()),
    section([h(2, 'Before you contact us'), accordion([
      ['Where is my order?', `${p('Track it online in seconds.')}${p(`<a href="${url('account/track-order')}">Track your order</a>`)}`],
      ['How do I return something?', p('Returns are free within 30 days from your order history.')],
      ['Corporate and press enquiries', p('press@novamart.example')],
    ])]),
  ],
};

/* ---------- 21 About Us ---------- */
const about = {
  id: '21',
  name: 'About Us',
  path: 'about',
  title: 'About NovaMart | Our Story',
  description: 'NovaMart brings electronics, fashion and home appliances together with fair prices and great service.',
  pageType: 'content',
  siteSection: 'company',
  image: scene('about'),
  purpose: 'Brand story page with an A/B test on the closing CTA copy.',
  rules: ['about-cta: A/B test, "Explore NovaMart" (A) vs "Start shopping" (B).'],
  metrics: ['CTA CTR A vs B', 'Scroll depth', 'Shop entry from About'],
  sections: [
    section([hero(scene('about'), 'About NovaMart', heroContent('Better things, fairly priced', 'Founded in 2016, NovaMart serves 2 million customers across North America and Europe.'))]),
    section([columns([
      `${h(2, 'Our story')}${p('We started as a two-person electronics shop in San Francisco. Today we curate thousands of products across tech, fashion and home, with the same promise: honest prices and service that actually helps.')}`,
      p(img(scene('tile-store'), 'NovaMart store')),
    ])]),
    section([h(2, 'What we stand for'), cards([
      { body: `${h(3, 'Curated, not cluttered')}${p('Every product is tested by our team before it is listed.')}` },
      { body: `${h(3, 'Fair prices')}${p('Price match on major retailers and transparent sales.')}` },
      { body: `${h(3, 'Made to last')}${p('2-year warranties and repair-friendly brands.')}` },
      { body: `${h(3, 'Lower impact')}${p('Carbon-neutral delivery and recycled packaging.')}` },
    ])], { style: 'highlight' }),
    section([h(2, 'What customers say'), reviews()]),
    variant({
      location: 'about-cta', activity: 'AB-ABOUT-CTA', type: 'ab', audience: '', experience: 'A',
    }, cta(`${h(2, 'See what we have picked for you')}${primary('shop', 'Explore NovaMart')}`)),
    variant({
      location: 'about-cta', activity: 'AB-ABOUT-CTA', type: 'ab', audience: '', experience: 'B',
    }, cta(`${h(2, 'Ready to find something great?')}${primary('shop', 'Start shopping')}`)),
  ],
};

/* ---------- Blog articles ---------- */
export const ARTICLES = [
  {
    slug: 'how-to-choose-noise-cancelling-headphones',
    title: 'How to Choose Noise Cancelling Headphones in 2026',
    description: 'Over-ear or earbuds? ANC strength, battery life and codecs explained, plus our top picks.',
    category: 'electronics',
    author: 'Jordan Lee',
    date: '2026-10-12',
    sceneKey: 'blog-headphones',
    products: ['EL-1001', 'EL-1008', 'EL-1006'],
    body: [
      ['Over-ear or in-ear?', 'Over-ear headphones seal around your ears and fit larger batteries and drivers, so they usually deliver stronger noise cancelling and longer playtime. Earbuds win for gym sessions, commuting and anyone who finds headbands uncomfortable.'],
      ['How strong should noise cancelling be?', 'Look for adaptive ANC that adjusts to your surroundings. Planes and trains produce low-frequency rumble that ANC handles well; voices are harder, so a good passive seal still matters.'],
      ['Battery life and charging', 'Thirty hours is the new baseline for over-ear models. Fast charging (10 minutes for 5 hours) is more useful than a bigger number on the box.'],
      ['Our verdict', 'For most people the Nova Pro Wireless Headphones hit the sweet spot of comfort, ANC and battery. If you want something pocketable, the AirLite earbuds are the better choice.'],
    ],
  },
  {
    slug: 'capsule-wardrobe-essentials',
    title: 'Capsule Wardrobe: 8 Essentials for Fall',
    description: 'Build a versatile fall wardrobe with eight pieces that work together.',
    category: 'fashion',
    author: 'Maya Chen',
    date: '2026-09-28',
    sceneKey: 'blog-wardrobe',
    products: ['FA-2001', 'FA-2005', 'FA-2007'],
    body: [
      ['Start with outerwear', 'A neutral puffer or wool coat is the piece people see most. Choose a colour that works with everything else you own.'],
      ['Layer smart', 'An organic cotton hoodie and two knit layers cover most temperatures between 5°C and 18°C.'],
      ['Invest in footwear', 'Leather boots that can be resoled will outlast five pairs of fast-fashion shoes.'],
      ['Keep it cohesive', 'Stick to three base colours and one accent colour for a wardrobe that mixes and matches effortlessly.'],
    ],
  },
  {
    slug: 'smart-kitchen-appliances-guide',
    title: 'The Smart Kitchen: Which Appliances Are Worth It?',
    description: 'Air fryers, espresso machines and smart kettles: what to buy first and what to skip.',
    category: 'home-appliances',
    author: 'Sam Patel',
    date: '2026-08-30',
    sceneKey: 'blog-kitchen',
    products: ['HA-3004', 'HA-3003', 'HA-3005'],
    body: [
      ['Air fryer first', 'If you buy one appliance this year make it an air fryer. It replaces the oven for most weeknight meals and uses far less energy.'],
      ['Espresso at home', 'A machine with an integrated grinder pays for itself in under a year if you buy one coffee a day.'],
      ['Precision kettles', 'Temperature control matters for green tea and pour-over coffee. Keep-warm mode is a quiet luxury.'],
      ['What to skip', 'Single-purpose gadgets that duplicate what a good blender already does rarely earn their counter space.'],
    ],
  },
];

/* ---------- 22 Blog Landing ---------- */
const blog = {
  id: '22',
  name: 'Blog Landing',
  path: 'blog',
  title: 'The NovaMart Edit | Guides, Reviews & Style',
  description: 'Buying guides, product reviews and style advice from the NovaMart team.',
  pageType: 'blog',
  siteSection: 'blog',
  image: scene('blog'),
  purpose: 'Content hub that drives article views; blog readers (2+ articles) are invited to the newsletter.',
  rules: ['blog-newsletter: blog readers see a newsletter sign-up CTA; others see the most popular guide.'],
  metrics: ['Article click-through rate', 'Newsletter CTA CTR for blog readers', 'Content-assisted conversions'],
  sections: [
    section([hero(scene('blog'), 'The NovaMart Edit', heroContent('The NovaMart Edit', 'Buying guides, honest reviews and style advice from our experts.'))]),
    section([h(2, 'Latest articles'), cards(ARTICLES.map((a) => ({
      image: scene(a.sceneKey), alt: a.title, body: `<p>${a.category.replace('-', ' ').toUpperCase()} · ${a.date}</p>${h(3, a.title)}${p(a.description)}${p(`<a href="${url(`blog/${a.slug}`)}">Read article</a>`)}`,
    })))]),
    variant({
      location: 'blog-newsletter', activity: 'XT-BLOG-NEWSLETTER', type: 'xt', audience: 'blog-readers', experience: 'Newsletter Invite',
    }, cta(`${h(2, 'Enjoying the Edit?')}${p('You have read a few of our guides. Get new ones every Friday, plus member-only deals.')}${primary('membership', 'Subscribe to the newsletter')}`, { variants: ['dark'] })),
    variant({
      location: 'blog-newsletter', activity: 'XT-BLOG-NEWSLETTER', type: 'xt', audience: 'default', experience: 'Popular Guide',
    }, cta(`${h(2, 'Most read this month')}${p(ARTICLES[0].description)}${primary(`blog/${ARTICLES[0].slug}`, 'Read the headphone guide')}`)),
    section([h(2, 'Browse by topic'), tabs([
      ['Electronics', `${p('Guides to headphones, laptops, TVs and cameras.')}${p(`<a href="${url(`blog/${ARTICLES[0].slug}`)}">${ARTICLES[0].title}</a>`)}`],
      ['Fashion', `${p('Style advice and seasonal edits.')}${p(`<a href="${url(`blog/${ARTICLES[1].slug}`)}">${ARTICLES[1].title}</a>`)}`],
      ['Home', `${p('Kitchen, cleaning and air care.')}${p(`<a href="${url(`blog/${ARTICLES[2].slug}`)}">${ARTICLES[2].title}</a>`)}`],
    ])], { style: 'highlight' }),
  ],
};

/* ---------- 23 Blog Details (template, one page per article) ---------- */
export function articlePage(article, { id = '23', name = 'Blog Details' } = {}) {
  const products = pick(...article.products);
  return {
    id,
    name,
    path: `blog/${article.slug}`,
    title: `${article.title} | The NovaMart Edit`,
    description: article.description,
    pageType: 'article',
    siteSection: 'blog',
    category: article.category,
    image: scene(article.sceneKey),
    meta: { author: article.author, 'published-date': article.date, 'content-type': 'article' },
    purpose: 'Article detail. Demonstrates article views, reading time milestones, CTA interactions and an A/B test on the article CTA; reading 2+ articles qualifies the Blog Readers audience.',
    extraEvents: ['articleView', 'readingTime'],
    rules: ['blog-cta: A/B test, product CTA (A) vs comparison CTA (B).'],
    metrics: ['Average reading time and % read', 'Article CTA CTR (A vs B)', 'Article -> product view rate'],
    sections: [
      section([
        p(`<a href="${url('blog')}">The NovaMart Edit</a> / ${article.category.replace('-', ' ')}`),
        `<h1>${article.title}</h1>`,
        p(`By ${article.author} · ${article.date}`),
        p(img(scene(article.sceneKey), article.title)),
        p(`<strong>${article.description}</strong>`),
        ...article.body.map(([title, text]) => `${h(2, title)}${p(text)}`),
      ], { style: 'article' }),
      variant({
        location: 'blog-cta', activity: 'AB-BLOG-CTA', type: 'ab', audience: '', experience: 'A',
      }, cta(`${h(2, `Shop ${products[0].name}`)}${p(products[0].description)}${primary(`products/${products[0].slug}`, 'Shop now')}`, { image: { src: `/content/dam/aep-training/images/products/${products[0].slug}.svg`, alt: products[0].name } })),
      variant({
        location: 'blog-cta', activity: 'AB-BLOG-CTA', type: 'ab', audience: '', experience: 'B',
      }, cta(`${h(2, 'Compare our top 3 picks')}${p(products.map((x) => x.name).join(' · '))}${primary(article.category, 'Compare products')}`, { variants: ['accent'] })),
      section([h(2, 'Products in this article'), productCarousel(products)], { style: 'highlight' }),
      section([h(2, 'Keep reading'), cards(ARTICLES.filter((a) => a.slug !== article.slug).map((a) => ({
        image: scene(a.sceneKey), alt: a.title, body: `${h(3, a.title)}${p(`<a href="${url(`blog/${a.slug}`)}">Read article</a>`)}`,
      })))]),
    ],
  };
}

/* ---------- 24 Store Locator ---------- */
const STORES = [
  ['San Francisco', '600 Townsend St, San Francisco, CA 94103', 'Mon-Sun 9am-9pm', 'US West'],
  ['Los Angeles', '8500 Melrose Ave, Los Angeles, CA 90069', 'Mon-Sun 10am-9pm', 'US West'],
  ['New York', '350 5th Ave, New York, NY 10118', 'Mon-Sun 9am-10pm', 'US East'],
  ['Boston', '800 Boylston St, Boston, MA 02199', 'Mon-Sat 10am-9pm', 'US East'],
  ['London', '200 Oxford St, London W1D 1NU', 'Mon-Sat 9am-9pm', 'Europe'],
  ['Berlin', 'Tauentzienstraße 21, 10789 Berlin', 'Mon-Sat 10am-8pm', 'Europe'],
];

const stores = {
  id: '24',
  name: 'Store Locator',
  path: 'stores',
  title: 'Find a Store | NovaMart',
  description: 'Find a NovaMart store near you in San Francisco, Los Angeles, New York, Boston, London and Berlin.',
  pageType: 'store-locator',
  siteSection: 'stores',
  image: scene('stores'),
  purpose: 'Store finder. Demonstrates store search (searchType=store), directions clicks and location-based promotions.',
  rules: ['stores-promo: visitors are shown the event at their nearest region (US West, US East, Europe) or a generic in-store pickup message.'],
  metrics: ['Store search usage', 'Directions click rate', 'Click and collect adoption'],
  sections: [
    section([h(1, 'Find a store'), p('Search by city, region or ZIP code.'), search('City, region or ZIP code', 'stores', ['San Francisco', 'New York', 'Europe'])]),
    ...[['geo-us-west', 'US West Event', 'West Coast tech week', 'Free hands-on demos in San Francisco and LA every Saturday this month.'],
      ['geo-us-east', 'US East Event', 'East Coast style nights', 'Late-night shopping with stylists in New York and Boston on Thursdays.'],
      ['geo-europe', 'Europe Event', 'Now open in Berlin', 'Visit our newest store and get 10% off your first in-store purchase.'],
      ['default', 'Default Promo', 'Click & collect in 2 hours', 'Order online and pick up at any store, free.']].map(([audience, experience, title, text]) => variant({
      location: 'stores-promo', activity: 'XT-STORES', type: 'xt', audience, experience, campaignId: 'CMP-STORES',
    }, banner({ text: `${h(2, title)}${p(text)}`, campaignId: 'CMP-STORES', variants: audience === 'default' ? ['alert'] : [] }))),
    section([h(2, 'Our stores'), cards(STORES.map(([city, address, hours, region]) => ({
      image: scene('tile-store'), alt: `NovaMart ${city}`, body: `${h(3, `NovaMart ${city}`)}${p(address)}${p(`${hours} · ${region}`)}${p(`<a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(address)}">Get directions</a>`)}`,
    })))]),
    section([trustColumns()], { style: 'highlight' }),
  ],
};

/* ---------- 25 Membership Program ---------- */
const membership = {
  id: '25',
  name: 'Membership Program',
  path: 'membership',
  title: 'NovaMart Rewards | Membership Program',
  description: 'Join NovaMart Rewards for free: earn points, unlock member prices and get free express shipping.',
  pageType: 'membership',
  siteSection: 'membership',
  image: scene('membership'),
  purpose: 'Loyalty programme page. Demonstrates premium user messaging for members and an enrollment banner for new users; #aep:enroll records membershipEnroll.',
  extraEvents: ['membershipEnroll'],
  rules: [
    'membership-hero: premium members (gold/platinum) see their benefits hero; everyone else the join hero.',
    'membership-enroll: new visitors see the 500 bonus points enrollment banner; returning non-members a "join today" banner; members see nothing.',
  ],
  metrics: ['Enrollment rate (membershipEnroll / pageView)', 'Enrollment banner CTR', 'Member engagement with premium hero'],
  sections: [
    variant({
      location: 'membership-hero', activity: 'XT-MEMBERSHIP-HERO', type: 'xt', audience: 'premium-members', experience: 'Premium Messaging',
    }, hero(scene('membership-premium'), 'Gold member benefits', heroContent('Welcome to Gold, enjoy your perks', 'Free express shipping, 3x points on electronics and early access to every sale.', [['recommendations', 'Shop member picks'], ['deals', 'Early access deals', 'secondary']]))),
    variant({
      location: 'membership-hero', activity: 'XT-MEMBERSHIP-HERO', type: 'xt', audience: 'default', experience: 'Join Hero',
    }, hero(scene('membership'), 'NovaMart Rewards', heroContent('NovaMart Rewards', 'Free to join. Earn 2 points per $1, unlock member prices and free express shipping.', [['#aep:enroll', 'Join for free']]))),
    variant({
      location: 'membership-enroll', activity: 'XT-MEMBERSHIP-ENROLL', type: 'xt', audience: 'new-visitors', experience: 'New User Enrollment', campaignId: 'CMP-ENROLL-NEW',
    }, banner({ text: `${h(2, 'New here? Get 500 bonus points')}${p('Join today and we will add 500 points ($5) to your account instantly.')}${primary('#aep:enroll', 'Join and get 500 points')}`, campaignId: 'CMP-ENROLL-NEW' })),
    variant({
      location: 'membership-enroll', activity: 'XT-MEMBERSHIP-ENROLL', type: 'xt', audience: 'non-members', experience: 'Returning Non-member',
    }, banner({ text: `${h(2, 'You could have earned points on your last visit')}${p('Join now so your next order counts.')}${primary('#aep:enroll', 'Join Rewards')}`, campaignId: 'CMP-ENROLL-RET', variants: ['dark'] })),
    section([h(2, 'Membership tiers'), columns([
      `${h(3, 'Silver')}${p('Free to join')}${ul(['2 points per $1', 'Member prices', 'Birthday reward'])}`,
      `${h(3, 'Gold')}${p('$500 spend per year')}${ul(['3 points per $1', 'Free express shipping', 'Early access to sales'])}`,
      `${h(3, 'Platinum')}${p('$1,500 spend per year')}${ul(['4 points per $1', 'Priority support 24/7', 'Free installation'])}`,
    ])], { style: 'highlight' }),
    section([h(2, 'Rewards FAQ'), faq([
      ['Is membership free?', p('Yes. Silver membership is free forever.')],
      ['How do I redeem points?', p('500 points = $5 off. Apply points at checkout.')],
      ['Do points expire?', p('Points expire after 12 months without account activity.')],
    ])]),
  ],
};

/* ---------- 26 FAQ ---------- */
const faqPage = {
  id: '26',
  name: 'FAQ',
  path: 'faq',
  title: 'Frequently Asked Questions | NovaMart',
  description: 'Answers about orders, delivery, returns, payments, coupons and NovaMart Rewards.',
  pageType: 'faq',
  siteSection: 'support',
  purpose: 'Searchable FAQ with FAQPage structured data, question toggles and helpfulness feedback.',
  extraEvents: ['faqToggle', 'faqFeedback', 'searchSubmit'],
  rules: ['faq-help: cart abandoners get a "need help finishing your order?" CTA; others the general help CTA.'],
  metrics: ['Most opened questions', 'Helpful rate', 'FAQ search zero-result rate'],
  sections: [
    section([h(1, 'Frequently asked questions'), faq([
      ['How long does shipping take?', p('Standard 5-7 business days, Express 2-3 days, Next day if ordered before 2pm.')],
      ['Is shipping free?', p('Standard shipping is free on orders over $75. Members get free express shipping at Gold tier.')],
      ['What is your return policy?', p('Free returns within 30 days of delivery for unused items in original packaging.')],
      ['When will I receive my refund?', p('Within 2 business days of us receiving your return.')],
      ['Which payment methods do you accept?', p('Credit and debit cards, PayPal, Apple Pay and NovaMart gift cards.')],
      ['How do coupon codes work?', p('Enter the code in your cart. One code per order. Codes cannot be applied after an order is placed.')],
      ['Do you price match?', p('Yes, we match prices from major retailers on identical in-stock items.')],
      ['How do I earn Rewards points?', p('Join NovaMart Rewards for free and earn 2-4 points per $1 depending on your tier.')],
      ['Can I change or cancel my order?', p('Yes, until it ships. Contact support from your order history.')],
      ['Do you ship internationally?', p('We ship to the US, Canada, the UK and the EU. Duties are included for EU orders.')],
    ], ['searchable'])]),
    variant({
      location: 'faq-help', activity: 'XT-FAQ-HELP', type: 'xt', audience: 'cart-abandoners', experience: 'Cart Help',
    }, cta(`${h(2, 'Need help finishing your order?')}${p('Your cart is saved. Chat with us or return to checkout.')}${primary('cart', 'Return to cart')}${secondary('contact', 'Chat with us')}`, { variants: ['accent'] })),
    variant({
      location: 'faq-help', activity: 'XT-FAQ-HELP', type: 'xt', audience: 'default', experience: 'General Help',
    }, helpCta()),
  ],
};

/* ---------- 27/28 Legal ---------- */
const legalPrompt = (location) => [
  variant({
    location, activity: 'XT-LEGAL', type: 'xt', audience: 'logged-in-users', experience: 'Preference Centre',
  }, banner({ text: `<p><strong>Manage your data and marketing preferences</strong> at any time in your account.</p>${primary('account', 'Open my account')}`, variants: ['alert'] })),
  variant({
    location, activity: 'XT-LEGAL', type: 'xt', audience: 'default', experience: 'Contact Privacy Team',
  }, banner({ text: `<p><strong>Questions about this policy?</strong> Contact privacy@novamart.example.</p>${primary('contact', 'Contact us')}`, variants: ['alert'] })),
];

const privacy = {
  id: '27',
  name: 'Privacy Policy',
  path: 'privacy-policy',
  title: 'Privacy Policy | NovaMart',
  description: 'How NovaMart collects, uses and protects your personal data, including analytics and personalization.',
  pageType: 'legal',
  siteSection: 'legal',
  purpose: 'Legal content. Also documents (for trainees) which analytics and personalization data the training site collects.',
  rules: ['privacy-preferences: logged-in users are pointed to the preference centre; others to the privacy team.'],
  metrics: ['Preference centre visits', 'Scroll depth (policy read-through)'],
  sections: [
    section([
      h(1, 'Privacy policy'),
      p('Last updated: October 1, 2026'),
      h(2, '1. Data we collect'),
      p('We collect information you provide (account details, orders, support requests) and information collected automatically when you use our site, such as pages viewed, products clicked, device and approximate location.'),
      h(2, '2. Analytics and personalization'),
      p('We use Adobe Analytics and Adobe Experience Platform to understand how our site is used, and Adobe Target to personalize content such as banners and product recommendations. A pseudonymous visitor ID, visit count, product views and cart contents are used to place you in audience segments.'),
      ul(['Data layer: page, user, product, cart, campaign and personalization objects', 'Audience segments: e.g. new or returning visitor, product category interests', 'Experiments: you may see different versions of a page as part of A/B tests']),
      h(2, '3. Your choices'),
      p('You can opt out of personalization and analytics cookies at any time through our cookie settings, and request access or deletion of your data by contacting us.'),
      h(2, '4. Retention'),
      p('We keep order data for 7 years for legal reasons and analytics data for 25 months.'),
    ], { style: 'narrow' }),
    ...legalPrompt('privacy-preferences'),
  ],
};

const terms = {
  id: '28',
  name: 'Terms and Conditions',
  path: 'terms',
  title: 'Terms and Conditions | NovaMart',
  description: 'Terms and conditions for shopping at NovaMart.',
  pageType: 'legal',
  siteSection: 'legal',
  purpose: 'Legal content page; mirrors the privacy page personalization to show XT reuse across pages.',
  rules: ['terms-preferences: same XT-LEGAL activity as the privacy page, separate location.'],
  metrics: ['Scroll depth', 'Exit rate'],
  sections: [
    section([
      h(1, 'Terms and conditions'),
      p('Last updated: October 1, 2026'),
      h(2, '1. Orders'),
      p('An order is accepted when we send a shipping confirmation. Prices and availability may change without notice.'),
      h(2, '2. Pricing and coupons'),
      p('One coupon per order. Coupons have no cash value and cannot be applied to gift cards.'),
      h(2, '3. Returns'),
      p('Items may be returned within 30 days in original condition. See our FAQ for details.'),
      h(2, '4. NovaMart Rewards'),
      p('Points have no cash value and expire after 12 months of inactivity. We may change the programme with 30 days notice.'),
      h(2, '5. Liability'),
      p('To the extent permitted by law, our liability is limited to the value of your order.'),
    ], { style: 'narrow' }),
    ...legalPrompt('terms-preferences'),
  ],
};

/* ---------- 29 Personalized Recommendations ---------- */
const recommendations = {
  id: '29',
  name: 'Personalized Recommendations',
  path: 'recommendations',
  title: 'Recommended For You | NovaMart',
  description: 'Products picked for you based on what you browse and buy.',
  pageType: 'recommendations',
  siteSection: 'shop',
  image: scene('recommendations'),
  purpose: 'Recommendations showcase: user-affinity recommendations, category affinity XT and recently viewed items in one page.',
  rules: [
    'recs-top-picks: Target Recommendations with "user favourite category" criteria (simulator: best sellers).',
    'recs-affinity: electronics or fashion shoppers see a grid of their top category; others a home appliances grid.',
    'recs-recently-viewed: profile based, hidden until the visitor has viewed a product.',
  ],
  metrics: ['Recommendation CTR', 'Recommendation-influenced revenue', 'Affinity grid add to cart rate'],
  sections: [
    section([hero(scene('recommendations'), 'Picked for you', heroContent('Recommended for you', 'Based on what you browse, save and buy. The more you shop, the better it gets.'))]),
    variant({
      location: 'recs-top-picks', activity: 'RECS-USER-AFFINITY', type: 'recs', audience: 'default', experience: 'Top Picks',
    }, [h(2, 'Top picks for you'), productCarousel(byTag('best-seller'), ['recommendations'])]),
    variant({
      location: 'recs-recently-viewed', activity: 'RECS-RECENTLY-VIEWED', type: 'recs', audience: 'default', experience: 'Recently Viewed',
    }, [h(2, 'Recently viewed'), productCarousel([], ['recently-viewed'])], 'highlight'),
    variant({
      location: 'recs-affinity', activity: 'XT-RECS-AFFINITY', type: 'xt', audience: 'electronics-shoppers', experience: 'Electronics Affinity',
    }, [h(2, 'Because you like electronics'), productGrid(byCategory('electronics'))]),
    variant({
      location: 'recs-affinity', activity: 'XT-RECS-AFFINITY', type: 'xt', audience: 'fashion-shoppers', experience: 'Fashion Affinity',
    }, [h(2, 'Because you like fashion'), productGrid(byCategory('fashion'))]),
    variant({
      location: 'recs-affinity', activity: 'XT-RECS-AFFINITY', type: 'xt', audience: 'default', experience: 'Home Affinity',
    }, [h(2, 'Popular in home appliances'), productGrid(byCategory('home-appliances'))]),
    section([p('Training tip: view three electronics products, then reload this page to qualify for the Electronics Shoppers audience.')]),
  ],
};

/* ---------- 30 404 ---------- */
const notFound = {
  id: '30',
  name: '404 Page',
  path: '404',
  title: 'Page Not Found | NovaMart',
  description: 'The page you are looking for could not be found.',
  pageType: 'error',
  siteSection: 'error',
  robots: 'noindex, nofollow',
  purpose: 'Error recovery page. Tracks errorPageView with the requested URL and recovers visitors with search and affinity-based recommendations.',
  extraEvents: ['errorPageView'],
  rules: ['error-recovery: electronics or fashion shoppers see products from their category; others see best sellers.'],
  metrics: ['404 volume by referrer', 'Recovery rate (search or product click after 404)'],
  sections: [
    section([h(1, 'Sorry, we can\'t find that page'), p('The link may be broken or the page may have moved. Try searching or start from one of our departments.'), search('Search products', 'products', ['headphones', 'boots', 'air fryer']), primary('', 'Go to the home page')]),
    section([categoryCards()]),
    ...[['electronics-shoppers', 'Electronics Recovery', 'Popular in electronics', byCategory('electronics')],
      ['fashion-shoppers', 'Fashion Recovery', 'Popular in fashion', byCategory('fashion')],
      ['default', 'Best Sellers Recovery', 'Our best sellers', byTag('best-seller')]].map(([audience, experience, title, products]) => variant({
      location: 'error-recovery', activity: 'XT-404-RECOVERY', type: 'xt', audience, experience,
    }, [h(2, title), productCarousel(products, ['recommendations'])], 'highlight')),
  ],
};

/* ---------- Search Results (utility page, not one of the 30 core pages) ---------- */
export const searchPage = {
  id: 'U1',
  name: 'Search Results',
  path: 'search',
  title: 'Search | NovaMart',
  description: 'Search NovaMart products, guides and help articles.',
  pageType: 'search',
  siteSection: 'search',
  robots: 'noindex, follow',
  utility: true,
  purpose: 'Site-wide search over the query index (/query-index.json). Target of the header search (?q=).',
  extraEvents: ['searchSubmit', 'searchNoResults', 'searchResultClick', 'searchError'],
  rules: [],
  metrics: ['Search exit rate', 'Null search rate', 'Search result click-through rate by position'],
  sections: [
    section([h(1, 'Search'), search('Search products, guides and help', 'site', ['headphones', 'jacket', 'espresso', 'returns', 'rewards'])]),
    section([h(2, 'Or browse by department'), categoryCards()], { style: 'highlight' }),
  ],
};

export default [
  account, orders, track, support, contact, about, blog,
  articlePage(ARTICLES[0]),
  stores, membership, faqPage, privacy, terms, recommendations, notFound,
];

