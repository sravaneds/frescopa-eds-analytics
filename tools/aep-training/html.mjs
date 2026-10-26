/**
 * Markup helpers that produce Edge Delivery Services ".plain.html" structures
 * (sections, blocks, section metadata, page metadata).
 */
import { CATEGORIES } from './catalog.mjs';

export const ROOT = '/content/aep-training';
export const DAM = '/content/dam/aep-training/images';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const url = (path = '') => (path ? `${ROOT}/${path}` : `${ROOT}/`);
export const img = (src, alt = '') => `<picture><img src="${src}" alt="${esc(alt)}"></picture>`;
const isAbsolute = (path) => path.startsWith('#') || /^[a-z]+:/.test(path);
export const link = (path, text) => `<a href="${isAbsolute(path) ? path : url(path)}">${esc(text)}</a>`;
export const primary = (path, text) => `<p><strong>${link(path, text)}</strong></p>`;
export const secondary = (path, text) => `<p><em>${link(path, text)}</em></p>`;
export const p = (text) => `<p>${text}</p>`;
export const h = (level, text, id) => `<h${level}${id ? ` id="${id}"` : ''}>${esc(text)}</h${level}>`;
export const ul = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

/**
 * Block markup.
 * @param {string} name block name
 * @param {string[]} variants variant classes
 * @param {Array<Array<string>>} rows rows of cells (HTML strings)
 */
export function block(name, variants, rows) {
  const cls = [name, ...variants].join(' ');
  return `<div class="${cls}">${rows.map((row) => `<div>${row.map((cell) => `<div>${cell ?? ''}</div>`).join('')}</div>`).join('')}</div>`;
}

const kv = (name, obj) => block(name, [], Object.entries(obj)
  .filter(([, v]) => v !== undefined && v !== null && v !== '')
  .map(([k, v]) => [esc(k), esc(v)]));

export const sectionMetadata = (meta) => kv('section-metadata', meta);
export const pageMetadata = (meta) => kv('metadata', meta);

/**
 * A section. meta keys: style, target-location, audience, activity, activity-type,
 * experience, campaign-id
 */
export function section(parts, meta) {
  const body = (Array.isArray(parts) ? parts : [parts]).join('');
  return `<div>${body}${meta && Object.keys(meta).length ? sectionMetadata(meta) : ''}</div>`;
}

/**
 * Personalization variant: a section in a Target location.
 */
export function variant(target, parts, style) {
  return section(parts, {
    style,
    'target-location': target.location,
    audience: target.audience,
    activity: target.activity,
    'activity-type': target.type,
    experience: target.experience,
    'campaign-id': target.campaignId,
  });
}

export const productImage = (product, i = 0) => `${DAM}/products/${product.slug}${i ? `-${i + 1}` : ''}.svg`;

export function productRow(product) {
  return [
    img(productImage(product), product.name),
    esc(product.name),
    product.sku,
    product.price.toFixed(2),
    product.compareAt ? product.compareAt.toFixed(2) : '',
    product.category,
    esc(product.brand),
    product.rating.toFixed(1),
    esc(product.badge),
    link(`products/${product.slug}`, product.name),
  ];
}

export const productGrid = (products, variants = []) => block('product-grid', variants, products.map(productRow));
export const productCarousel = (products, variants = []) => block('product-carousel', variants, products.map(productRow));

export const hero = (image, alt, content) => block('hero', [], [[`<p>${img(image, alt)}</p>${content}`]]);

export const cards = (items, variants = []) => block('cards', variants, items.map((c) => [
  c.image ? img(c.image, c.alt || '') : '',
  c.body,
]));

export const columns = (cols, variants = []) => block('columns', variants, [cols]);

export const cta = (content, { image, variants = [] } = {}) => block('cta', variants, [[content], [image ? img(image.src, image.alt) : '']]);

export const banner = ({
  text, image, coupon = '', campaignId = '', variants = [],
}) => block('banner', variants, [[image ? img(image.src, image.alt) : ''], [text], [coupon], [campaignId]]);

export const tabs = (items) => block('tabs', [], items.map(([label, body]) => [esc(label), body]));
export const accordion = (items) => block('accordion', [], items.map(([label, body]) => [esc(label), body]));
export const faq = (items, variants = []) => block('faq', variants, items.map(([q, a]) => [esc(q), a]));
export const carousel = (slides, variants = []) => block('carousel', variants, slides.map((s) => [img(s.image, s.alt || ''), s.body || '']));
export const testimonials = (items, variants = []) => block('testimonials', variants, items.map((t) => [
  img(t.image, ''), `<p>${esc(t.quote)}</p>`, esc(t.name), esc(t.role), String(t.rating),
]));
export const search = (placeholder, scope, popular = []) => block('search', [], [[esc(placeholder)], [scope], [esc(popular.join(', '))]]);

export const categoryName = (id) => CATEGORIES[id]?.name || id;
