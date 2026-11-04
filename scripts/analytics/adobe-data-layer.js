/**
 * Reusable Adobe Client Data Layer (ACDL) utility for engagement analytics.
 *
 * Every push follows the ACDL event format:
 *   window.adobeDataLayer.push({
 *     event: 'heroBannerInteraction',
 *     component: { type: 'hero-banner', action: 'click', ... },
 *     eventInfo: { componentId: 'hero-1', timestamp: '...' },
 *   });
 *
 * - `event` is the name Adobe Tags rules listen for
 *   (ACDL extension, "Data Pushed" -> specific event).
 * - The data object (e.g. `component`) is merged into the computed ACDL state, so it is also
 *   readable with "Data Layer Computed State" data elements (e.g. `component.title`).
 * - `eventInfo` holds event metadata. ACDL does not persist it in the computed state.
 *
 * Event reference: docs/analytics/adobe-client-data-layer-events.md
 */

/** Pushes with the same signature inside this window are treated as duplicates (double clicks). */
const DEDUPE_WINDOW_MS = 500;
/** Text values are trimmed to keep payloads small and avoid sending whole paragraphs. */
const MAX_TEXT_LENGTH = 100;
const DEBUG_KEY = 'acdl:debug';

/** Data object keys pushed last time, per root key (component, engagement, ...). */
const lastKeys = new Map();
/** Signature -> timestamp of recent pushes, for duplicate suppression. */
const recentPushes = new Map();
/** DOM event -> event names already pushed for it, so nested listeners push once. */
const handledDomEvents = new WeakMap();
/** Elements whose impression was already pushed (once per component instance). */
const impressed = new WeakSet();
const impressionCallbacks = new WeakMap();
let impressionObserver;

/**
 * Returns the ACDL array. It is safe to push before the ACDL library loads: the library
 * processes queued items in order when it initializes (lazy phase, scripts/scripts.js).
 * @returns {Array} window.adobeDataLayer
 */
export function getDataLayer() {
  window.adobeDataLayer = window.adobeDataLayer || [];
  return window.adobeDataLayer;
}

/**
 * Normalizes authored text for payloads: collapses whitespace and limits the length.
 * @param {*} value text or node text content
 * @param {number} max maximum length
 * @returns {string} cleaned text, '' for empty values
 */
export function cleanText(value, max = MAX_TEXT_LENGTH) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * Converts a label to a stable reporting value: "Home Appliances" -> "home-appliances".
 * @param {string} value label
 * @returns {string} slug
 */
export function toSlug(value) {
  return cleanText(value, 200).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Absolute link URL without the hash. Returns '' for missing or invalid hrefs.
 * @param {Element} el link element
 * @returns {string} url
 */
export function getLinkUrl(el) {
  const href = el?.getAttribute?.('href');
  if (!href) return '';
  try {
    const url = new URL(href, window.location.href);
    url.hash = '';
    return url.href;
  } catch (e) {
    return '';
  }
}

/**
 * Label of a link or button: data-cta-name (set by blocks), aria-label, a heading inside the
 * link (card links that also contain badges), text content or image alt text.
 * @param {Element} el link or button
 * @returns {string} label
 */
export function getElementText(el) {
  if (!el?.getAttribute) return '';
  return cleanText(el.dataset.ctaName || el.getAttribute('aria-label')
    || el.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || el.textContent
    || el.querySelector('img')?.getAttribute('alt') || el.getAttribute('title'));
}

/**
 * Block variant name(s) from the authored block classes, e.g. "Hero (dark, centered)" ->
 * "dark centered". Returns "default" when the block has no variant.
 * @param {Element} block block element
 * @returns {string} variation
 */
export function getBlockVariation(block) {
  if (!block?.classList) return 'default';
  const name = block.dataset.blockName;
  const variants = [...block.classList].filter((c) => c !== 'block' && c !== name);
  return variants.length ? variants.join(' ') : 'default';
}

/**
 * Stable id for a component instance, e.g. "hero-1" for the first hero on the page.
 * Stored on the element so all events of the same instance share the id.
 * @param {Element} block block (or any component root) element
 * @param {string} fallbackName name used when the element is not a block
 * @returns {string} component id
 */
export function getComponentId(block, fallbackName = 'component') {
  if (!block) return '';
  if (block.dataset.analyticsId) return block.dataset.analyticsId;
  const name = block.dataset.blockName || fallbackName;
  const selector = block.dataset.blockName ? `.block[data-block-name="${name}"]` : `[data-analytics-name="${name}"]`;
  if (!block.dataset.blockName) block.dataset.analyticsName = name;
  const position = [...document.querySelectorAll(selector)].indexOf(block) + 1;
  block.dataset.analyticsId = `${name}-${position || 1}`;
  return block.dataset.analyticsId;
}

/**
 * Personalization context authored on the section (section metadata and Target locations),
 * reused so engagement can be split by experience.
 * @param {Element} el element inside a section
 * @returns {string} experience name or ''
 */
export function getExperience(el) {
  const section = el?.closest?.('.section');
  if (!section) return '';
  return cleanText(section.dataset.aepVariant || section.dataset.experience || '');
}

function isDebug() {
  try {
    return !!sessionStorage.getItem(DEBUG_KEY);
  } catch (e) {
    return false;
  }
}

/**
 * Removes undefined values and sets keys that were in the previous push of the same root
 * but are missing now to null. ACDL deep-merges data into its computed state and deletes
 * null keys, so this keeps the computed state equal to the latest payload (no values left
 * over from an earlier, different interaction).
 */
function withStaleKeysCleared(root, data) {
  const current = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  const previous = lastKeys.get(root);
  lastKeys.set(root, new Set(Object.keys(current)));
  if (!previous) return current;
  previous.forEach((key) => {
    if (!(key in current)) current[key] = null;
  });
  return current;
}

function isDuplicate(signature) {
  const now = Date.now();
  recentPushes.forEach((time, key) => {
    if (now - time > DEDUPE_WINDOW_MS) recentPushes.delete(key);
  });
  if (recentPushes.has(signature)) return true;
  recentPushes.set(signature, now);
  return false;
}

/**
 * Pushes an analytics event to the Adobe Client Data Layer.
 * @param {string} event event name, e.g. "heroBannerInteraction"
 * @param {Object} data data objects keyed by ACDL root, e.g. { component: {...} }
 * @param {Object} [options]
 * @param {string} [options.componentId] component instance id, sent in eventInfo
 * @param {Event} [options.domEvent] DOM event that caused the push: one push per event name
 * @param {boolean} [options.dedupe=true] drop identical pushes within 500 ms
 * @returns {Object|null} the pushed entry, or null when it was skipped
 */
export function pushDataLayerEvent(event, data = {}, {
  componentId = '', domEvent = null, dedupe = true,
} = {}) {
  if (!event || typeof event !== 'string') return null;
  try {
    // one push per DOM event and event name, even if several listeners see the same click
    if (domEvent) {
      const names = handledDomEvents.get(domEvent) || new Set();
      if (names.has(event)) return null;
      names.add(event);
      handledDomEvents.set(domEvent, names);
    }
    if (dedupe && isDuplicate(`${event}|${componentId}|${JSON.stringify(data)}`)) return null;

    const entry = { event };
    Object.entries(data).forEach(([root, value]) => {
      entry[root] = value && typeof value === 'object' && !Array.isArray(value)
        ? withStaleKeysCleared(root, value)
        : value;
    });
    entry.eventInfo = {
      ...(componentId && { componentId }),
      timestamp: new Date().toISOString(),
    };
    getDataLayer().push(entry);
    // eslint-disable-next-line no-console
    if (isDebug()) console.debug('[acdl]', event, entry);
    return entry;
  } catch (e) {
    // analytics must never break the page
    // eslint-disable-next-line no-console
    console.warn('Adobe Client Data Layer push failed', event, e);
    return null;
  }
}

/**
 * Runs the callback once the page is shown to the visitor. Pages prerendered by speculation
 * rules are not seen yet, so impressions and timers wait for activation.
 * @param {Function} callback callback
 */
export function whenActivated(callback) {
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', () => callback(), { once: true });
  } else {
    callback();
  }
}

function isVisibleEnough(entry, threshold) {
  if (!entry.isIntersecting) return false;
  // components taller than the viewport can never be 50 % visible, so viewport coverage counts too
  return entry.intersectionRatio >= threshold
    || entry.intersectionRect.height >= window.innerHeight * threshold;
}

function getImpressionObserver() {
  if (impressionObserver) return impressionObserver;
  impressionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const { target } = entry;
      const config = impressionCallbacks.get(target);
      if (!config || !isVisibleEnough(entry, config.threshold)) return;
      impressionObserver.unobserve(target);
      impressionCallbacks.delete(target);
      if (impressed.has(target)) return;
      impressed.add(target);
      target.dataset.analyticsImpression = 'tracked';
      try {
        config.callback(entry);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Impression tracking failed', e);
      }
    });
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  return impressionObserver;
}

/**
 * Calls the callback once, the first time the element is at least `threshold` visible.
 * Each component instance is tracked once per page view; calling this again for the same
 * element is a no-op. Elements hidden by personalization never intersect, so they are
 * never reported.
 * @param {Element} el element to observe
 * @param {Function} callback called with the IntersectionObserverEntry
 * @param {Object} [options]
 * @param {number} [options.threshold=0.5] visible share (0-1)
 */
export function trackImpression(el, callback, { threshold = 0.5 } = {}) {
  if (!el || typeof callback !== 'function' || impressed.has(el) || impressionCallbacks.has(el)) return;
  if (!('IntersectionObserver' in window)) return;
  impressionCallbacks.set(el, { callback, threshold });
  whenActivated(() => {
    if (impressionCallbacks.has(el)) getImpressionObserver().observe(el);
  });
}

/**
 * Delegated click tracking: calls the handler for clicks on elements matching the selector
 * inside root. Listens in the capture phase so tracking still runs when block code stops
 * propagation, and never prevents the default action.
 * @param {Element|Document} root container
 * @param {string} selector CSS selector of the clickable elements
 * @param {Function} handler (element, event) => void
 */
export function trackClicks(root, selector, handler) {
  if (!root?.addEventListener || typeof handler !== 'function') return;
  root.addEventListener('click', (e) => {
    const el = e.target?.closest?.(selector);
    if (!el || (root !== document && !root.contains(el))) return;
    try {
      handler(el, e);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Click tracking failed', err);
    }
  }, true);
}

/**
 * sessionStorage helpers that never throw (storage can be disabled or full).
 */
export const safeSession = {
  get(key) {
    try {
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      return null;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // ignore
    }
  },
  remove(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  },
};
