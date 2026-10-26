import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, isSameOriginImage } from '../../scripts/scripts.js';

/**
 * Testimonials block. Each row: image | quote | name | role | rating (1-5)
 * Variant "scroll": horizontally scrolling list on all viewports.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'testimonials-list';
  [...block.children].forEach((row, i) => {
    const [imageCell, quoteCell, nameCell, roleCell, ratingCell] = row.children;
    const li = document.createElement('li');
    li.className = 'testimonials-item';
    moveInstrumentation(row, li);
    const figure = document.createElement('figure');

    const rating = Math.min(5, Math.max(0, parseInt(ratingCell?.textContent, 10) || 0));
    if (rating) {
      const stars = document.createElement('p');
      stars.className = 'testimonials-rating';
      stars.innerHTML = `<span aria-hidden="true">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span><span class="visually-hidden">${rating} out of 5 stars</span>`;
      figure.append(stars);
    }
    const quote = document.createElement('blockquote');
    if (quoteCell) quote.append(...quoteCell.childNodes);
    figure.append(quote);

    const caption = document.createElement('figcaption');
    const img = imageCell?.querySelector('img');
    if (img) {
      const pic = isSameOriginImage(img.src)
        ? createOptimizedPicture(img.src, '', false, [{ width: '120' }])
        : imageCell.querySelector('picture');
      pic.querySelector('img').alt = '';
      caption.append(pic);
    }
    const who = document.createElement('span');
    who.innerHTML = '<strong></strong><span></span>';
    who.querySelector('strong').textContent = (nameCell?.textContent || '').trim();
    who.querySelector('span').textContent = (roleCell?.textContent || '').trim();
    caption.append(who);
    figure.append(caption);
    li.dataset.position = i + 1;
    li.append(figure);
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
  block.dataset.trackImpression = 'testimonialImpression';
  block.dataset.trackTestimonialCount = ul.children.length;
}
