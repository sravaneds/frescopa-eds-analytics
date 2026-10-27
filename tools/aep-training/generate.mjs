#!/usr/bin/env node
/**
 * AEP training site generator.
 *
 * Builds the local preview content for /content/aep-training (pages, nav, footer, SVG
 * assets) and the generated documentation (sitemap, page inventory, block mapping,
 * analytics matrix, Target activity matrix) from the page spec, so content and docs
 * never drift apart.
 *
 * Usage: node tools/aep-training/generate.mjs
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pagesA, { productPage } from './pages-a.mjs';
import pagesB, { ARTICLES, articlePage } from './pages-b.mjs';
import { PRODUCTS, CATEGORIES } from './catalog.mjs';
import {
  SCENES, ACTIVITIES, AVATARS,
} from './common.mjs';
import {
  productSvg, sceneSvg, avatarSvg, logoSvg,
} from './images.mjs';
import {
  ROOT, pageMetadata, section, block, url, esc,
} from './html.mjs';
import { EVENTS, BLOCK_EVENTS, GLOBAL_EVENTS } from './events.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CONTENT = join(REPO, 'content');
const DOCS = join(REPO, 'docs/aep-training');
const SITE_DIR = join(CONTENT, ROOT.replace('/content/', ''));
const DAM_DIR = join(CONTENT, 'dam/aep-training/images');

const write = (file, data) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
};

/* ---------- pages ---------- */

const corePages = [...pagesA, ...pagesB];
const instances = [
  ...PRODUCTS.filter((product) => product.sku !== 'EL-1001').map((product) => ({ ...productPage(product), instanceOf: '07' })),
  ...ARTICLES.slice(1).map((article) => ({ ...articlePage(article), instanceOf: '23' })),
];
const allPages = [...corePages, ...instances];

function metadataFor(page) {
  return {
    title: page.title,
    description: page.description,
    template: 'aep-training',
    'page-type': page.pageType,
    'site-section': page.siteSection,
    category: page.category,
    'campaign-id': page.campaignId,
    image: page.image,
    robots: page.robots,
    nav: `${ROOT}/nav`,
    footer: `${ROOT}/footer`,
    ...(page.meta || {}),
  };
}

function renderPage(page) {
  return `${[...page.sections, section(pageMetadata(metadataFor(page)))].join('\n')}\n`;
}

/* ---------- analysis of generated markup (for docs + validation) ---------- */

function parseKv(html, blockName) {
  return html.split(`<div class="${blockName}">`).slice(1).map((chunk) => {
    const obj = {};
    const pair = /<div><div>([^<]*)<\/div><div>([^<]*)<\/div><\/div>/y;
    let kv = pair.exec(chunk);
    while (kv) {
      obj[kv[1]] = kv[2].replace(/&amp;/g, '&');
      kv = pair.exec(chunk);
    }
    return obj;
  });
}

function blocksIn(html) {
  const found = [];
  const re = /<div class="([a-z][a-z0-9-]*)((?: [a-z0-9-]+)*)">/g;
  let m = re.exec(html);
  while (m) {
    const name = m[1];
    if (!['section-metadata', 'metadata'].includes(name)) {
      found.push({ name, variants: m[2].trim().split(' ').filter(Boolean) });
    }
    m = re.exec(html);
  }
  return found;
}

function analyse(page) {
  const sectionMeta = page.sections.flatMap((s) => parseKv(s, 'section-metadata'));
  const targets = sectionMeta.filter((m) => m['target-location']);
  const blocks = page.sections.flatMap(blocksIn);
  const blockNames = [...new Set(blocks.map((b) => b.name))];
  const events = new Set(GLOBAL_EVENTS);
  blocks.forEach(({ name, variants }) => {
    (BLOCK_EVENTS[name] || []).forEach((e) => events.add(e));
    variants.forEach((v) => (BLOCK_EVENTS[`${name}.${v}`] || []).forEach((e) => events.add(e)));
    if (name === 'banner' && variants.includes('dismissible')) events.add('bannerDismiss');
  });
  (page.extraEvents || []).forEach((e) => events.add(e));
  if (['category', 'product-listing'].includes(page.pageType)) events.add('categoryView');
  if (page.pageType === 'article') ['articleView', 'readingTime'].forEach((e) => events.add(e));
  if (page.pageType === 'error') events.add('errorPageView');
  if (targets.length) events.add('propositionDisplay');
  const sectionEvents = page.sections.join('').includes('#aep:') ? ['loginComplete', 'logout', 'membershipEnroll'].filter((e) => {
    const html = page.sections.join('');
    return (e === 'loginComplete' && html.includes('#aep:sign-in')) || (e === 'logout' && html.includes('#aep:sign-out')) || (e === 'membershipEnroll' && html.includes('#aep:enroll'));
  }) : [];
  sectionEvents.forEach((e) => events.add(e));

  const locations = {};
  targets.forEach((t) => {
    const loc = t['target-location'];
    locations[loc] = locations[loc] || {
      location: loc, activity: t.activity, type: t['activity-type'], experiences: [],
    };
    locations[loc].experiences.push({ experience: t.experience || '', audience: t.audience || '(random split)' });
  });
  const audiences = [...new Set(targets.flatMap((t) => (t.audience || '').split(',')).map((a) => a.trim()).filter((a) => a && a !== 'default'))];
  return {
    blocks, blockNames, events: [...events], locations: Object.values(locations), audiences,
  };
}

/* ---------- authoring fields from the Universal Editor models ---------- */

const models = JSON.parse(readFileSync(join(REPO, 'component-models.json'), 'utf8'));
const modelFields = Object.fromEntries(models.map((m) => [m.id, (m.fields || []).map((f) => f.label || f.name)]));
const BLOCK_MODELS = {
  hero: ['hero'],
  cards: ['card'],
  columns: ['columns'],
  tabs: ['tab'],
  carousel: ['carousel', 'carousel-slide'],
  accordion: ['accordion-item'],
  faq: ['faq', 'faq-item'],
  cta: ['cta'],
  banner: ['banner'],
  'product-grid': ['product-grid', 'product-item'],
  'product-carousel': ['product-carousel', 'product-item'],
  testimonials: ['testimonials', 'testimonial'],
  search: ['search'],
  'product-info': ['product-info'],
  cart: ['cart'],
  checkout: ['checkout'],
  wishlist: ['wishlist'],
  orders: ['orders'],
};
const BLOCK_TITLES = {
  hero: 'Hero', cards: 'Cards', columns: 'Columns', tabs: 'Tabs', carousel: 'Carousel', accordion: 'Accordion', faq: 'FAQ', cta: 'CTA', banner: 'Banner', 'product-grid': 'Product Grid', 'product-carousel': 'Product Carousel', testimonials: 'Testimonials', search: 'Search', 'product-info': 'Product Info (PDP)', cart: 'Cart', checkout: 'Checkout', wishlist: 'Wishlist', orders: 'Orders', teaser: 'Teaser',
};
const fieldsFor = (blockName) => (BLOCK_MODELS[blockName] || []).flatMap((id) => modelFields[id] || []);

/* ---------- validation ---------- */

const problems = [];
const analysed = new Map(allPages.map((page) => [page, analyse(page)]));
corePages.forEach((page) => {
  const a = analysed.get(page);
  if (!a.locations.length) problems.push(`${page.id} ${page.name}: no Adobe Target location`);
  a.locations.forEach((l) => { if (!ACTIVITIES[l.activity]) problems.push(`${page.id}: unknown activity ${l.activity}`); });
  a.events.forEach((e) => { if (!EVENTS[e]) problems.push(`${page.id}: event ${e} missing from dictionary`); });
});
if (corePages.length !== 30) problems.push(`expected 30 core pages, found ${corePages.length}`);

/* ---------- content ---------- */

allPages.forEach((page) => {
  write(join(SITE_DIR, `${page.path || 'index'}.plain.html`), renderPage(page));
});

const navHtml = [
  section(`<p><a href="${url()}">NovaMart</a></p>`),
  section(`<ul>
<li>Shop<ul><li><a href="${url('shop')}">All departments</a></li><li><a href="${url('electronics')}">Electronics</a></li><li><a href="${url('fashion')}">Fashion</a></li><li><a href="${url('home-appliances')}">Home Appliances</a></li><li><a href="${url('products')}">All products</a></li></ul></li>
<li>Collections<ul><li><a href="${url('best-sellers')}">Best Sellers</a></li><li><a href="${url('new-arrivals')}">New Arrivals</a></li><li><a href="${url('seasonal-offers')}">Seasonal Offers</a></li><li><a href="${url('recommendations')}">Picked for You</a></li></ul></li>
<li><a href="${url('deals')}">Deals</a></li>
<li><a href="${url('membership')}">Rewards</a></li>
<li><a href="${url('blog')}">Blog</a></li>
<li>Help<ul><li><a href="${url('support')}">Customer Support</a></li><li><a href="${url('faq')}">FAQ</a></li><li><a href="${url('account/track-order')}">Track Order</a></li><li><a href="${url('stores')}">Store Locator</a></li><li><a href="${url('contact')}">Contact Us</a></li></ul></li>
</ul>`),
  section(`<ul><li><a href="${url('account')}">Account</a></li><li><a href="${url('wishlist')}">Wishlist</a></li><li><a href="${url('cart')}">Cart</a></li></ul>`),
].join('\n');
write(join(SITE_DIR, 'nav.plain.html'), `${navHtml}\n`);

const footerCol = (title, links) => `<h2>${title}</h2><ul>${links.map(([path, text]) => `<li><a href="${url(path)}">${esc(text)}</a></li>`).join('')}</ul>`;
const footerHtml = [
  section(block('columns', [], [[
    footerCol('Shop', [['electronics', 'Electronics'], ['fashion', 'Fashion'], ['home-appliances', 'Home Appliances'], ['deals', 'Deals'], ['new-arrivals', 'New Arrivals']]),
    footerCol('Help', [['support', 'Customer Support'], ['faq', 'FAQ'], ['account/track-order', 'Track Order'], ['contact', 'Contact Us'], ['stores', 'Store Locator']]),
    footerCol('Company', [['about', 'About Us'], ['blog', 'Blog'], ['membership', 'NovaMart Rewards'], ['recommendations', 'Picked for You']]),
    footerCol('Legal', [['privacy-policy', 'Privacy Policy'], ['terms', 'Terms and Conditions']]),
  ]])),
  section('<p>© 2026 NovaMart (fictional training store). Built on AEM Edge Delivery Services for Adobe Analytics, Adobe Target and AEP Web SDK training.</p><p><a href="#aep:reset-profile">Reset demo profile</a></p>'),
].join('\n');
write(join(SITE_DIR, 'footer.plain.html'), `${footerHtml}\n`);

// page list used by build-package.mjs (AEM content package)
write(join(REPO, 'tools/aep-training/manifest.json'), `${JSON.stringify({
  pages: allPages.map((page) => ({ path: page.path, title: page.title.split(' | ')[0] })),
  fragments: [{ path: 'nav', title: 'Navigation' }, { path: 'footer', title: 'Footer' }],
}, null, 2)}\n`);

/* ---------- assets ---------- */

PRODUCTS.forEach((product) => {
  [0, 1, 2].forEach((i) => {
    write(join(DAM_DIR, 'products', `${product.slug}${i ? `-${i + 1}` : ''}.svg`), productSvg(product, CATEGORIES[product.category].colors, i));
  });
});
Object.entries(SCENES).forEach(([key, scene]) => {
  write(join(DAM_DIR, 'scenes', `${key}.svg`), sceneSvg({ ...scene, pattern: key.startsWith('tile') ? 'diagonal' : 'circles' }));
});
AVATARS.forEach(([initials, color]) => write(join(DAM_DIR, 'avatars', `${initials.toLowerCase()}.svg`), avatarSvg(initials, color)));
write(join(DAM_DIR, 'brand', 'novamart-logo.svg'), logoSvg());

/* ---------- generated docs ---------- */

const GEN = '<!-- Generated by tools/aep-training/generate.mjs. Do not edit by hand; edit the page spec and re-run. -->\n\n';
const pageUrl = (page) => `${ROOT}/${page.path}`.replace(/\/$/, '/');
const list = (items) => items.map((i) => `\`${i}\``).join(', ');
const table = (head, rows) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map((c) => String(c ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`)].join('\n');

// 01 sitemap
const tree = {};
allPages.forEach((page) => {
  const parts = (page.path || '').split('/').filter(Boolean);
  let node = tree;
  parts.forEach((part) => {
    node[part] = node[part] || {};
    node = node[part];
  });
  node.__page = page;
});
const treeLines = [`/content/aep-training/  (01 Home)`];
const walk = (node, depth) => Object.keys(node).filter((k) => k !== '__page').sort().forEach((key) => {
  const child = node[key];
  const page = child.__page;
  const label = page ? `${page.instanceOf ? `instance of ${page.instanceOf}` : `${page.id} ${page.name}`}` : 'folder';
  treeLines.push(`${'  '.repeat(depth)}├── ${key}  (${label})`);
  walk(child, depth + 1);
});
walk(tree, 1);
write(join(DOCS, '01-sitemap.md'), `${GEN}# 1. Sitemap

NovaMart training site, AEM site path \`/content/aep-training\` (published at the domain root: \`/content/aep-training/about\` -> \`/about\`).
${corePages.length} core pages plus ${instances.length} template instances (${PRODUCTS.length - 1} additional product detail pages, ${ARTICLES.length - 1} additional articles).

\`\`\`
${treeLines.join('\n')}
├── nav     (header fragment)
└── footer  (footer fragment)
\`\`\`

## Core pages

${table(['#', 'Page', 'URL (local preview / AEM path)', 'Page type', 'Site section', 'Indexing'], corePages.map((p) => [p.id, p.name, `\`${pageUrl(p)}\``, p.pageType, p.siteSection, p.robots || 'index, follow']))}

## Template instances

${table(['Template', 'Page', 'URL'], instances.map((p) => [`${p.instanceOf} ${p.name}`, p.title.split(' | ')[0], `\`${pageUrl(p)}\``]))}

## SEO sitemap

Published pages are indexed by the existing \`sitemap\` index in \`helix-query.yaml\` and exposed through \`helix-sitemap.yaml\` (\`/sitemap-content.xml\`). Pages with \`robots: noindex\` (cart, checkout, confirmation, account, wishlist, 404) should be excluded from the XML sitemap by filtering on the \`robots\` property.
`);

// 02 page inventory
const inventory = corePages.map((page) => {
  const a = analysed.get(page);
  return {
    id: page.id,
    name: page.name,
    path: pageUrl(page),
    pageType: page.pageType,
    purpose: page.purpose,
    components: a.blockNames.map((b) => BLOCK_TITLES[b] || b),
    authoringFields: {
      page: Object.keys(metadataFor(page)).filter((k) => metadataFor(page)[k]),
      blocks: Object.fromEntries(a.blockNames.map((b) => [BLOCK_TITLES[b] || b, fieldsFor(b)])),
      sections: a.locations.length ? ['Target Location', 'Audience', 'Activity', 'Activity Type', 'Experience', 'Campaign ID', 'Style'] : ['Style'],
    },
    analyticsEvents: a.events,
    targetActivities: a.locations.map((l) => ({
      activityId: l.activity, type: ACTIVITIES[l.activity]?.type, location: l.location, experiences: l.experiences,
    })),
    audienceSegments: a.audiences,
    personalizationRules: page.rules || [],
    successMetrics: page.metrics || [],
  };
});
write(join(DOCS, 'page-inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`);
write(join(DOCS, '02-page-inventory.md'), `${GEN}# 2. Page Inventory

Each of the 30 pages with its purpose, components, authoring fields, analytics events, Adobe Target activities, audience segments, personalization rules and success metrics. Machine-readable version: [page-inventory.json](page-inventory.json).

${inventory.map((p) => `## ${p.id} ${p.name}

**URL:** \`${p.path}\` · **pageType:** \`${p.pageType}\`

| Attribute | Definition |
| --- | --- |
| Page purpose | ${p.purpose} |
| Components used | ${p.components.join(', ')} |
| Authoring fields | **Page properties:** ${list(p.authoringFields.page)}<br>**Section properties:** ${p.authoringFields.sections.join(', ')}<br>${Object.entries(p.authoringFields.blocks).map(([b, f]) => `**${b}:** ${f.join(', ')}`).join('<br>')} |
| Analytics events | ${list(p.analyticsEvents)} |
| Adobe Target activities | ${p.targetActivities.map((t) => `**${t.activityId}** (${t.type}) @ \`${t.location}\`: ${t.experiences.map((e) => `${e.experience} → ${e.audience}`).join('; ')}`).join('<br>')} |
| Audience segments | ${p.audienceSegments.length ? list(p.audienceSegments) : 'All visitors (random split)'} |
| Personalization rules | ${p.personalizationRules.join('<br>')} |
| Success metrics | ${p.successMetrics.join('; ')} |
`).join('\n')}`);

// 03 block mapping
const blockUse = {};
corePages.forEach((page) => analysed.get(page).blocks.forEach(({ name, variants }) => {
  blockUse[name] = blockUse[name] || { pages: new Set(), variants: new Set() };
  blockUse[name].pages.add(page.id);
  variants.forEach((v) => blockUse[name].variants.add(v));
}));
const blockOrder = ['hero', 'tabs', 'cards', 'carousel', 'accordion', 'columns', 'cta', 'faq', 'banner', 'product-grid', 'product-carousel', 'teaser', 'testimonials', 'search', 'product-info', 'cart', 'checkout', 'wishlist', 'orders'];
const matrixBlocks = blockOrder.filter((b) => blockUse[b]);
write(join(DOCS, '03-block-mapping.md'), `${GEN}# 3. Block Mapping

## Block catalogue

${table(['Block', 'Folder', 'Variants used', 'Authoring fields (Universal Editor)', 'Analytics events', 'Used on pages'], blockOrder.map((b) => [
    BLOCK_TITLES[b], `\`blocks/${b}\``, blockUse[b] ? [...blockUse[b].variants].join(', ') || 'default' : 'available, not used',
    fieldsFor(b).join(', ') || 'see block model', [...new Set([...(BLOCK_EVENTS[b] || []), ...Object.keys(BLOCK_EVENTS).filter((k) => k.startsWith(`${b}.`)).flatMap((k) => BLOCK_EVENTS[k])])].join(', '),
    blockUse[b] ? [...blockUse[b].pages].join(', ') : '-',
  ]))}

Teaser (existing block) is available for authors but the training pages use CTA and Banner, which carry campaign tracking.

## Page x block matrix

${table(['#', 'Page', ...matrixBlocks.map((b) => BLOCK_TITLES[b])], corePages.map((page) => {
    const names = analysed.get(page).blockNames;
    return [page.id, page.name, ...matrixBlocks.map((b) => (names.includes(b) ? '●' : ''))];
  }))}
`);

// 04 analytics matrix
const allEvents = Object.keys(EVENTS);
write(join(DOCS, '04-analytics-tracking-matrix.md'), `${GEN}# 4. Analytics Tracking Matrix

All events are pushed to \`window.adobeDataLayer\` as \`{ event, eventInfo, ...stateUpdates }\`. Create one Adobe Tags rule per event (ACDL extension, "Data Pushed", specific event) and send it with Web SDK (\`sendEvent\` with XDM) or AppMeasurement (\`s.tl\`). Suggested Adobe Analytics variables are listed below; adjust numbers to your report suite.

## Required variables

${table(['Variable', 'Data layer path', 'Adobe Analytics', 'XDM'], [
    ['pageName', 'page.pageName', 's.pageName / eVar1', 'web.webPageDetails.name'],
    ['pageType', 'page.pageType', 'prop1 / eVar2', '_novamart.page.pageType'],
    ['category', 'page.category, product.category', 'prop3 / eVar3', '_novamart.page.category'],
    ['productId', 'product.productId, eventInfo.productId', 's.products (SKU)', 'productListItems[].SKU'],
    ['productName', 'product.productName, eventInfo.productName', 'eVar11 (merchandising)', 'productListItems[].name'],
    ['campaignId', 'campaign.campaignId, eventInfo.campaignId', 's.campaign (external), eVar5 (internal)', 'marketing.trackingCode'],
    ['audienceType', 'user.audienceType', 'eVar20', '_novamart.user.audienceType'],
    ['personalizationVariant', 'personalization.personalizationVariant, eventInfo.personalizationVariant', 'eVar21 (list var)', '_experience.decisioning.propositions'],
    ['CTAName', 'eventInfo.CTAName', 'eVar30 / prop30', 'web.webInteraction.name'],
    ['SearchTerm', 'eventInfo.SearchTerm', 'eVar40 / prop40', 'siteSearch.query'],
  ])}

## Scenario coverage

${table(['Scenario', 'Requirement', 'Event(s)', 'Where'], [
    ['Home', 'Hero clicks', 'heroClick', '01'], ['Home', 'CTA clicks', 'ctaClick', '01'], ['Home', 'Product carousel clicks', 'productCarouselClick, carouselNavigate', '01'], ['Home', 'Banner clicks', 'bannerClick, bannerImpression', '01'], ['Home', 'Scroll depth', 'scrollDepth', 'all pages'],
    ['Category', 'Category views', 'categoryView', '03, 04, 05, 06'], ['Category', 'Filter usage', 'filterApply, sortApply, filterClear', '03-06, 08-11'], ['Category', 'Search usage', 'searchSubmit, searchNoResults, searchResultsView', 'header, 02, 03-06, 19, 24, 26, 30'], ['Category', 'Product clicks', 'productClick', '03-06, 08-11'],
    ['PDP', 'Product view', 'productView', '07'], ['PDP', 'Image gallery usage', 'galleryInteraction', '07'], ['PDP', 'Tab clicks', 'tabClick', '07'], ['PDP', 'Add to cart', 'cartAdd', '07 (+ every product card)'], ['PDP', 'Wishlist add', 'wishlistAdd', '07 (+ every product card)'], ['PDP', 'Reviews clicks', 'reviewsClick', '07'],
    ['Cart', 'Cart additions', 'cartAdd, cartOpen', '13 (+ anywhere)'], ['Cart', 'Cart removals', 'cartRemove', '13'], ['Cart', 'Coupon usage', 'couponApply, couponRemove, couponCopy', '13 (+ banners)'],
    ['Checkout', 'Checkout start', 'checkoutStart', '14'], ['Checkout', 'Shipping selection', 'shippingSelect', '14'], ['Checkout', 'Payment selection', 'paymentSelect', '14'], ['Checkout', 'Checkout completion', 'checkoutComplete', '14'],
    ['Blog', 'Article views', 'articleView', '23'], ['Blog', 'Reading time', 'readingTime', '23'], ['Blog', 'CTA interaction', 'ctaClick', '22, 23'],
  ])}

## Page x event matrix

${table(['#', 'Page', 'pageType', 'Events'], corePages.map((page) => [page.id, page.name, page.pageType, analysed.get(page).events.map((e) => `\`${e}\``).join(' ')]))}

## Event dictionary

${table(['Event', 'Trigger', 'Source', 'eventInfo attributes', 'Adobe Analytics', 'XDM'], allEvents.map((e) => [`\`${e}\``, EVENTS[e].trigger, EVENTS[e].source, EVENTS[e].attributes.join(', '), EVENTS[e].aa, EVENTS[e].xdm]))}
`);

// 05 target activity matrix
const activityRows = [];
corePages.forEach((page) => analysed.get(page).locations.forEach((l) => activityRows.push([
  l.activity, ACTIVITIES[l.activity]?.type, ACTIVITIES[l.activity]?.name, `${page.id} ${page.name}`, `\`${l.location}\``,
  l.experiences.map((e) => `${e.experience} (${e.audience})`).join('; '), ACTIVITIES[l.activity]?.goal, ACTIVITIES[l.activity]?.kpi,
])));
const byType = (type) => activityRows.filter((r) => r[1] === type);
write(join(DOCS, '05-target-activity-matrix.md'), `${GEN}# 5. Adobe Target Activity Matrix

Every core page has at least one Target location (section metadata **Target Location**). Locally the simulator selects the experience; in Adobe Target create the activity with the same name and use the location as the **decision scope** (Web SDK) or **mbox** (at.js).

| Type | Activities | Locations |
| --- | --- | --- |
${['XT', 'A/B', 'MVT', 'Recommendations'].map((t) => `| ${t} | ${new Set(byType(t).map((r) => r[0])).size} | ${byType(t).length} |`).join('\n')}

${['XT', 'A/B', 'MVT', 'Recommendations'].map((t) => `## ${t === 'XT' ? 'Experience Targeting (XT)' : t === 'A/B' ? 'A/B Tests' : t === 'MVT' ? 'Multivariate Tests' : 'Recommendations'}

${table(['Activity ID', 'Type', 'Name', 'Page', 'Location', 'Experiences (audience)', 'Goal', 'Primary KPI'], byType(t))}`).join('\n\n')}
`);

/* ---------- report ---------- */

console.info(`Generated ${allPages.length} pages (${corePages.length} core + ${instances.length} instances), nav, footer, assets and docs.`);
if (problems.length) {
  console.error(`Validation problems:\n- ${problems.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.info('Validation passed: 30 core pages, every page has a Target location, all events documented.');
}
