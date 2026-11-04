/**
 * Department engagement tracking.
 *
 * departmentInteraction        action: impression | card-click | cta-click
 * departmentCardClick          every tracked click on a department card (KPI counter)
 * departmentFilterInteraction  filter use on department pages and department (category) filters
 *
 * Department-related blocks:
 * - Cards blocks that list departments: block variant "departments" / "department", section
 *   metadata "Analytics Component: department", or a section heading that mentions departments
 *   (e.g. "Departments" on the Shop page). Each card is one department.
 * - Product grids on department pages (page metadata page-type = category, or "department").
 *   Each product card belongs to the page's department.
 */
import { getMetadata } from '../aem.js';
import {
  pushDataLayerEvent, trackImpression, trackClicks, cleanText, toSlug, getComponentId,
  getElementText, getLinkUrl, getBlockVariation,
} from './adobe-data-layer.js';

export const DEPARTMENT_EVENT = 'departmentInteraction';
export const DEPARTMENT_CARD_EVENT = 'departmentCardClick';
export const DEPARTMENT_FILTER_EVENT = 'departmentFilterInteraction';

const DEPARTMENT_VARIANTS = ['departments', 'department'];

/**
 * Department of the current page, from page metadata ("department", or "category" on
 * category pages). Returned as a slug ("home-appliances") so it matches card values.
 * @returns {string} department slug or ''
 */
export function getPageDepartment() {
  const department = getMetadata('department');
  if (department) return toSlug(department);
  return getMetadata('page-type') === 'category' ? toSlug(getMetadata('category')) : '';
}

/**
 * Last heading of the section that comes before the block (the authored section title).
 */
function getSectionHeading(block) {
  const section = block.closest('.section');
  if (!section) return '';
  const headings = [...section.querySelectorAll('h1, h2, h3')].filter((h) => !block.contains(h)
    // eslint-disable-next-line no-bitwise
    && (h.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING));
  return cleanText(headings.pop()?.textContent);
}

/**
 * Whether a cards block lists departments.
 * @param {Element} block cards block
 * @returns {boolean}
 */
export function isDepartmentCards(block) {
  if (!block) return false;
  if (DEPARTMENT_VARIANTS.some((v) => block.classList.contains(v))) return true;
  const section = block.closest('.section');
  if (toSlug(section?.dataset.analyticsComponent) === 'department') return true;
  return /department/i.test(getSectionHeading(block));
}

/**
 * Card title: heading in the card, then the first link or image alt text.
 */
function getCardTitle(card) {
  const heading = card.querySelector('h1, h2, h3, h4, h5, h6, strong');
  return cleanText(heading?.textContent) || getElementText(card.querySelector('a[href]'))
    || cleanText(card.querySelector('img')?.getAttribute('alt'));
}

/** Department of a department card: card title, else the last path segment of its link. */
function getCardDepartment(card) {
  const title = card.querySelector('h1, h2, h3, h4, h5, h6, strong')?.textContent;
  if (title) return toSlug(title);
  const url = getLinkUrl(card.querySelector('a[href]'));
  return url ? toSlug(new URL(url).pathname.split('/').filter(Boolean).pop()) : '';
}

/** Buttons and button-styled links are CTAs; other links (image, title, product) are the card. */
function isCta(el) {
  return el.tagName === 'BUTTON' || el.classList.contains('button');
}

/**
 * Starts department tracking on a decorated block.
 * @param {Element} block cards or product-grid block
 * @param {Object} options
 * @param {string} options.cardSelector selector of one card inside the block
 * @param {string} [options.departmentName] fixed department (department pages); when empty
 *   the department is read from each card
 */
export function trackDepartmentBlock(block, { cardSelector, departmentName = '' } = {}) {
  if (!block || !cardSelector || block.dataset.analyticsDepartment === 'true') return;
  block.dataset.analyticsDepartment = 'true';
  const componentId = getComponentId(block, 'department');
  const sectionTitle = getSectionHeading(block);
  const variation = getBlockVariation(block);

  // section impression: once per block instance, lists the departments that were shown
  trackImpression(block, () => {
    const cards = [...block.querySelectorAll(cardSelector)].filter((c) => !c.hidden);
    pushDataLayerEvent(DEPARTMENT_EVENT, {
      component: {
        type: 'department',
        departmentName: departmentName || cards.map(getCardDepartment).filter(Boolean).join(','),
        cardTitle: '',
        sectionTitle,
        variation,
        cardCount: cards.length,
        action: 'impression',
      },
    }, { componentId });
  });

  trackClicks(block, 'a[href], button', (el, e) => {
    const card = el.closest(cardSelector);
    if (!card || !block.contains(card)) return;
    const cards = [...block.querySelectorAll(cardSelector)];
    const cta = isCta(el);
    const detail = {
      type: 'department',
      departmentName: departmentName || getCardDepartment(card),
      cardTitle: getCardTitle(card),
      cardPosition: cards.indexOf(card) + 1,
      ctaText: getElementText(el),
      ctaUrl: getLinkUrl(el),
      sectionTitle,
    };
    pushDataLayerEvent(DEPARTMENT_EVENT, {
      component: { ...detail, action: cta ? 'cta-click' : 'card-click' },
    }, { componentId, domEvent: e });
    // dedicated KPI counter, one per click on a department card
    pushDataLayerEvent(DEPARTMENT_CARD_EVENT, {
      component: {
        ...detail, type: 'department-card', clickType: cta ? 'cta' : 'card', action: 'click',
      },
    }, { componentId, domEvent: e });
  });
}

/**
 * Tracks department filter use. Fires for every filter on a department page, and for the
 * category (department) filter on any page.
 * @param {Object} filter
 * @param {string} filter.filterType category | brand | price | sort | sale | all (clear)
 * @param {string} filter.filterValue selected value ('all' when cleared)
 * @param {string} [filter.filterLabel] visible option label
 * @param {number} [filter.resultCount] products shown after filtering
 * @param {string} [filter.action] apply | clear
 * @param {string} [filter.listName] product list name
 * @returns {Object|null} pushed entry
 */
export function trackDepartmentFilter({
  filterType, filterValue, filterLabel = '', resultCount, action = 'apply', listName = '',
} = {}) {
  const pageDepartment = getPageDepartment();
  if (!pageDepartment && filterType !== 'category') return null;
  const departmentName = filterType === 'category'
    ? toSlug(filterValue) || 'all'
    : pageDepartment;
  return pushDataLayerEvent(DEPARTMENT_FILTER_EVENT, {
    component: {
      type: 'department-filter',
      departmentName,
      filterType: cleanText(filterType),
      filterValue: cleanText(filterValue) || 'all',
      filterLabel: cleanText(filterLabel),
      resultCount: Number.isFinite(resultCount) ? resultCount : -1,
      listName: cleanText(listName),
      action,
    },
  });
}
