import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, isSameOriginImage } from '../../scripts/scripts.js';

/**
 * Call-to-action block.
 * Rows (model order): text (heading, copy, buttons) | image (optional)
 * Variants: dark, accent, split (image beside text)
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cells = [...block.children].map((row) => row.firstElementChild).filter(Boolean);
  const content = document.createElement('div');
  content.className = 'cta-content';
  let media = null;
  cells.forEach((cell) => {
    const picture = cell.querySelector('picture');
    if (picture && !cell.textContent.trim()) {
      media = document.createElement('div');
      media.className = 'cta-image';
      const img = picture.querySelector('img');
      if (isSameOriginImage(img.src)) {
        const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        media.append(optimized);
      } else {
        media.append(picture);
      }
    } else {
      content.append(...cell.childNodes);
    }
  });
  // group buttons in one row
  const buttons = [...content.querySelectorAll('.button-container')];
  if (buttons.length > 1) {
    const group = document.createElement('div');
    group.className = 'cta-buttons';
    buttons[0].before(group);
    group.append(...buttons);
  }
  block.textContent = '';
  if (media) {
    block.classList.add('cta-has-image');
    block.append(media);
  }
  block.append(content);
}
