import { createOptimizedPicture } from '../../scripts/aem.js';
import { isSameOriginImage, moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // cross-origin (e.g. delivery-tier) images can't be resized by this site, leave them as-is
    if (!isSameOriginImage(img.src)) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);

  // Adobe Client Data Layer: department engagement (departmentInteraction, departmentCardClick).
  // Only for cards that list departments: variant "Cards (departments)", section metadata
  // "Analytics Component: department", or a section heading that mentions departments
  // (e.g. "Departments" on the Shop page).
  const section = block.closest('.section');
  // section title: the last heading of the section that comes before this block
  const sectionTitle = ([...(section?.querySelectorAll('h1, h2, h3') || [])]
    .filter((h) => !block.contains(h)
      // eslint-disable-next-line no-bitwise
      && (h.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING))
    .pop()?.textContent || '').trim();
  const isDepartmentCards = block.classList.contains('departments')
    || block.classList.contains('department')
    || section?.dataset.analyticsComponent === 'department'
    || /department/i.test(sectionTitle);
  if (!isDepartmentCards) return;

  window.adobeDataLayer = window.adobeDataLayer || [];
  // department name as a slug ("Home Appliances" -> "home-appliances"), so it matches the
  // "category" metadata of the department pages
  const cards = [...ul.children].map((li) => {
    const cardTitle = (li.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || '').trim();
    return {
      li,
      cardTitle,
      departmentName: cardTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };
  });

  // impression: the department section is 50 % visible, reported once per block
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      window.adobeDataLayer.push({
        event: 'departmentInteraction',
        component: {
          type: 'department',
          departmentName: cards.map((c) => c.departmentName).filter(Boolean).join(','),
          cardTitle: '',
          sectionTitle,
          cardCount: cards.length,
          action: 'impression',
        },
      });
    }, { threshold: 0.5 });
    // prerendered pages (speculation rules) are reported once the visitor actually opens them
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', () => observer.observe(block), { once: true });
    } else {
      observer.observe(block);
    }
  }

  // card click / CTA click: a link in a department card. Button-styled links ("Shop
  // electronics") are CTA clicks, other links (image or title links) are card clicks.
  block.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    const card = cards.find((c) => c.li.contains(link));
    if (!link || !card) return;
    const isCta = link.classList.contains('button');
    const ctaText = (link.textContent || link.getAttribute('aria-label') || '').trim();
    window.adobeDataLayer.push({
      event: 'departmentInteraction',
      component: {
        type: 'department',
        departmentName: card.departmentName,
        cardTitle: card.cardTitle,
        cardPosition: cards.indexOf(card) + 1,
        ctaText,
        ctaUrl: link.href,
        sectionTitle,
        action: isCta ? 'cta-click' : 'card-click',
      },
    });
    // department card click KPI: one per click on a department card
    window.adobeDataLayer.push({
      event: 'departmentCardClick',
      component: {
        type: 'department-card',
        departmentName: card.departmentName,
        cardTitle: card.cardTitle,
        cardPosition: cards.indexOf(card) + 1,
        ctaText,
        ctaUrl: link.href,
        clickType: isCta ? 'cta' : 'card',
        action: 'click',
      },
    });
  });
}
