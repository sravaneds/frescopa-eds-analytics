import { moveInstrumentation } from '../../scripts/scripts.js';
import { pushEvent } from '../../scripts/aep/datalayer.js';

/**
 * Accordion block. Each row is one item: label | body.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row, i) => {
    const [labelCell, bodyCell] = row.children;
    const details = document.createElement('details');
    details.className = 'accordion-item';
    moveInstrumentation(row, details);
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...(labelCell?.childNodes || []));
    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    if (bodyCell) body.append(...bodyCell.childNodes);
    details.append(summary, body);
    details.addEventListener('toggle', () => {
      pushEvent('accordionToggle', {
        component: block.classList.contains('faq') ? 'faq' : 'accordion',
        itemTitle: summary.textContent.trim(),
        CTAName: summary.textContent.trim(),
        itemPosition: i + 1,
        action: details.open ? 'expand' : 'collapse',
      });
    });
    row.replaceWith(details);
  });
}
