/**
 * Site search over the query index (helix-query.yaml "query-index", /query-index.json).
 *
 * The index only contains *published* pages. In the local preview the generator writes
 * an equivalent file to /content/aep-training/query-index.json.
 */
import { SITE_ROOT } from './datalayer.js';

const PAGE_SIZE = 500;
const EXCLUDED_TYPES = ['error'];
let indexPromise;

async function fetchAll(url) {
  const rows = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(`${url}?limit=${PAGE_SIZE}&offset=${offset}`);
    if (!resp.ok) throw new Error(`${url} returned ${resp.status}`);
    // eslint-disable-next-line no-await-in-loop
    const json = await resp.json();
    rows.push(...(json.data || []));
    total = json.total ?? rows.length;
    offset += json.limit || PAGE_SIZE;
    if (!json.data?.length) break;
  }
  return rows;
}

/**
 * Loads the query index once per page view.
 * @returns {Promise<Object[]>} index rows (path, title, description, pageType, ...)
 */
export function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetchAll(`${SITE_ROOT}/query-index.json`)
      .then((rows) => rows.filter((row) => row.path
        && !EXCLUDED_TYPES.includes(row.pageType)
        && !/noindex/i.test(row.robots || '')))
      .catch((e) => {
        indexPromise = null;
        throw e;
      });
  }
  return indexPromise;
}

// "Nova Pro Wireless Headphones | Nova Audio | NovaMart" -> "Nova Pro Wireless Headphones"
const clean = (value) => {
  const parts = String(value || '').split(' | ').map((p) => p.trim()).filter(Boolean);
  if (parts[0] === 'NovaMart' && parts.length > 1) return `NovaMart: ${parts.slice(1).join(' | ')}`;
  return parts[0] || '';
};
const normalize = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Scores rows for a search term: all words must match; title/product name matches rank highest.
 * @param {Object[]} rows index rows
 * @param {string} term search term
 * @param {number} limit max results
 */
export function searchIndex(rows, term, limit = 50) {
  const words = normalize(term).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return rows.map((row) => {
    const title = normalize(`${clean(row.title)} ${row.heading || ''} ${row.productName || ''}`);
    const meta = normalize(`${row.category || ''} ${row.productBrand || ''} ${row.pageType || ''} ${row.siteSection || ''}`);
    const body = normalize(`${row.description || ''} ${row.author || ''}`);
    let score = 0;
    const matchesAll = words.every((word) => {
      const inTitle = title.includes(word);
      const inMeta = meta.includes(word);
      const inBody = body.includes(word);
      score += (inTitle ? 5 : 0) + (inMeta ? 2 : 0) + (inBody ? 1 : 0);
      return inTitle || inMeta || inBody;
    });
    if (row.pageType === 'product') score += 1;
    return matchesAll ? { ...row, title: clean(row.title) || row.heading, score } : null;
  })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
