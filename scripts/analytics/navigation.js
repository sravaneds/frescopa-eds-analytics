/**
 * Top navigation engagement tracking (event: topNavInteraction).
 *
 * action: click (link) | expand | collapse (submenus) | menu-open | menu-close (hamburger)
 *         | tool-click (cart, search, account and other header buttons)
 * area:   brand | sections | tools | menu
 *
 * One delegated listener per header; works for both header variants
 * (Frescopa storefront: .nav-*, NovaMart training site: .nm-*).
 */
import {
  pushDataLayerEvent, trackClicks, cleanText, getElementText, getLinkUrl,
} from './adobe-data-layer.js';

export const TOP_NAV_EVENT = 'topNavInteraction';

const AREAS = [
  ['menu', '.nav-hamburger, .nm-hamburger'],
  ['brand', '.nav-brand, .nm-brand'],
  ['sections', '.nav-sections, .nm-sections, .nm-menu'],
  ['tools', '.nav-tools, .nm-tools'],
];

function getArea(el) {
  return AREAS.find(([, selector]) => el.closest(selector))?.[0] || 'header';
}

/** Own text of a list item that also contains a submenu ("Shop" in <li>Shop<ul>...</ul></li>). */
function getTextLabel(li) {
  const label = [...li.childNodes]
    .find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  return cleanText(label?.textContent || li.querySelector('.submenu-title')?.textContent);
}

/** Label of the top-level item that contains a submenu link. */
function getParentLabel(el, nav) {
  const items = [];
  let li = el.closest('li');
  while (li && nav.contains(li)) {
    items.push(li);
    li = li.parentElement?.closest('li');
  }
  const top = items.pop();
  if (!top || top === el.closest('li')) return '';
  const toggle = top.querySelector(':scope > button, :scope > a');
  return toggle ? getElementText(toggle) : getTextLabel(top);
}

/** Submenu depth: 1 for top-level items, 2 for links inside a submenu. */
function getLevel(el, nav) {
  let level = 0;
  let li = el.closest('li');
  while (li && nav.contains(li)) {
    level += 1;
    li = li.parentElement?.closest('li');
  }
  return Math.max(level, 1);
}

function isExpanded(el) {
  const target = el.closest('[aria-expanded]');
  return target?.getAttribute('aria-expanded') === 'true' || el.classList.contains('active');
}

/**
 * Starts top navigation tracking.
 * @param {Element} nav header nav element
 * @param {Object} [options]
 * @param {string} [options.navType] reporting value for the header variant
 */
export default function trackTopNav(nav, { navType = 'header' } = {}) {
  if (!nav || nav.dataset.analyticsTracked === 'true') return;
  nav.dataset.analyticsTracked = 'true';
  const tools = [...nav.querySelectorAll('.nav-tools, .nm-tools')];

  trackClicks(nav, 'a[href], button, .nav-drop', (el, e) => {
    // forms in the header (search, sign-in) report searchInteraction / loginInteraction
    if (el.closest('form')) return;
    const isDrop = el.matches('.nav-drop');
    // clicks on the empty space of an open dropdown panel are not interactions
    if (isDrop && e.target.closest('.submenu-wrapper')) return;
    const area = getArea(el);
    const base = {
      type: 'top-nav',
      navType,
      area,
      linkText: isDrop ? getTextLabel(el) : getElementText(el),
      level: getLevel(el, nav),
      parentItem: getParentLabel(el, nav),
    };

    if (el.tagName === 'A') {
      pushDataLayerEvent(TOP_NAV_EVENT, {
        component: { ...base, linkUrl: getLinkUrl(el), action: 'click' },
      }, { domEvent: e });
      return;
    }

    // toggles: the header code updates aria-expanded after this capture listener, so the
    // resulting state is read once the click has been handled
    window.setTimeout(() => {
      let action = 'tool-click';
      if (area === 'menu') action = isExpanded(el) ? 'menu-open' : 'menu-close';
      else if (el.matches('.nav-drop, .nm-section-toggle') || (el.hasAttribute('aria-expanded') && !tools.some((t) => t.contains(el)))) {
        action = isExpanded(el) ? 'expand' : 'collapse';
      }
      pushDataLayerEvent(TOP_NAV_EVENT, {
        component: { ...base, linkUrl: '', action },
      }, { domEvent: e });
    }, 0);
  });
}
