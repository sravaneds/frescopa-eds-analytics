/**
 * Hero banner engagement tracking (event: heroBannerInteraction).
 *
 * - impression: once per hero instance, when 50 % of it is visible
 * - click: primary, secondary or other link/button inside the hero
 */
import {
  pushDataLayerEvent, trackImpression, trackClicks, cleanText, getBlockVariation,
  getComponentId, getExperience, getElementText, getLinkUrl,
} from './adobe-data-layer.js';

export const HERO_EVENT = 'heroBannerInteraction';

/**
 * CTA role from the authored button style: bold links are "button primary", italic links
 * "button secondary" (decorateButtons in aem.js). Plain buttons are classified by order.
 */
function getCtaType(el, block) {
  if (el.classList.contains('primary')) return 'primary';
  if (el.classList.contains('secondary')) return 'secondary';
  if (!el.classList.contains('button') && el.tagName !== 'BUTTON') return 'link';
  const buttons = [...block.querySelectorAll('a.button, button')];
  return ['primary', 'secondary'][buttons.indexOf(el)] || 'tertiary';
}

/**
 * Starts tracking a decorated hero block.
 * @param {Element} block hero block element
 */
export default function trackHeroBanner(block) {
  if (!block || block.dataset.analyticsTracked === 'true') return;
  block.dataset.analyticsTracked = 'true';
  const componentId = getComponentId(block, 'hero');

  // read lazily so personalization and later decoration are reflected in the payload
  const base = () => ({
    type: 'hero-banner',
    title: cleanText(block.querySelector('h1, h2, h3, h4')?.textContent),
    variation: getBlockVariation(block),
    experience: getExperience(block),
  });

  trackImpression(block, () => {
    const primary = block.querySelector('a.button.primary, a.button, button');
    pushDataLayerEvent(HERO_EVENT, {
      component: { ...base(), ctaText: getElementText(primary), action: 'impression' },
    }, { componentId });
  });

  trackClicks(block, 'a[href], button', (el, e) => {
    pushDataLayerEvent(HERO_EVENT, {
      component: {
        ...base(),
        ctaText: getElementText(el),
        ctaType: getCtaType(el, block),
        ctaUrl: getLinkUrl(el),
        action: 'click',
      },
    }, { componentId, domEvent: e });
  });
}
