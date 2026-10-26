import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, isSameOriginImage } from '../../scripts/scripts.js';
import { pushEvent } from '../../scripts/aep/datalayer.js';

let carouselCount = 0;

function optimize(picture, eager, width) {
  const img = picture?.querySelector('img');
  if (!img || !isSameOriginImage(img.src)) return;
  const optimized = createOptimizedPicture(img.src, img.alt, eager, [{ width }]);
  moveInstrumentation(img, optimized.querySelector('img'));
  picture.replaceWith(optimized);
}

/**
 * Carousel block. Each row is a slide: image | content (heading, text, CTA).
 * Variant "gallery": image-only product gallery with thumbnails.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  carouselCount += 1;
  const id = `carousel-${carouselCount}`;
  const isGallery = block.classList.contains('gallery');
  const eventName = isGallery ? 'galleryInteraction' : 'carouselNavigate';
  const isFirstSection = block.closest('.section') === document.querySelector('main .section');
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', block.closest('.section')?.querySelector('h2')?.textContent || (isGallery ? 'Product images' : 'Featured'));
  block.dataset.selfTracking = 'true';

  const track = document.createElement('ul');
  track.className = 'carousel-slides';
  track.id = `${id}-slides`;
  const slides = [...block.children].map((row, i) => {
    const slide = document.createElement('li');
    slide.className = 'carousel-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    moveInstrumentation(row, slide);
    [...row.children].forEach((cell) => {
      const onlyPicture = cell.querySelector('picture') && cell.textContent.trim() === '';
      cell.className = onlyPicture ? 'carousel-slide-image' : 'carousel-slide-content';
      if (onlyPicture) optimize(cell.querySelector('picture'), i === 0 && isFirstSection, isGallery ? '900' : '1600');
      if (cell.textContent.trim() || cell.querySelector('picture')) slide.append(cell);
    });
    track.append(slide);
    return slide;
  });
  slides.forEach((slide, i) => slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`));

  block.textContent = '';
  block.append(track);
  if (slides.length < 2) return;

  const controls = document.createElement('div');
  controls.className = 'carousel-controls';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  prev.setAttribute('aria-controls', track.id);
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-next';
  next.setAttribute('aria-label', 'Next slide');
  next.setAttribute('aria-controls', track.id);
  [prev, next].forEach((b) => { b.dataset.trackHandled = 'true'; });

  const indicators = document.createElement('div');
  indicators.className = 'carousel-indicators';
  const dots = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.dataset.trackHandled = 'true';
    dot.setAttribute('aria-label', `Show slide ${i + 1} of ${slides.length}`);
    if (isGallery) {
      dot.className = 'carousel-thumb';
      const img = slide.querySelector('img');
      if (img) {
        const thumb = document.createElement('img');
        thumb.src = img.currentSrc || img.src;
        thumb.alt = '';
        thumb.loading = 'lazy';
        dot.append(thumb);
      }
    } else {
      dot.className = 'carousel-dot';
    }
    indicators.append(dot);
    return dot;
  });
  controls.append(prev, indicators, next);
  block.append(controls);

  let current = 0;
  let pendingAction = '';
  const setActive = (index) => {
    current = index;
    dots.forEach((d, i) => d.setAttribute('aria-current', i === index ? 'true' : 'false'));
  };
  const goTo = (index, action) => {
    const target = (index + slides.length) % slides.length;
    pendingAction = action;
    window.setTimeout(() => { pendingAction = ''; }, 800);
    track.scrollTo({ left: slides[target].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    setActive(target);
    pushEvent(eventName, {
      component: 'carousel', carouselId: id, action, slideIndex: target + 1, slideCount: slides.length,
    });
  };
  prev.addEventListener('click', () => goTo(current - 1, 'previous'));
  next.addEventListener('click', () => goTo(current + 1, 'next'));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i, isGallery ? 'thumbnail' : 'indicator')));
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goTo(current + 1, 'keyboard');
    if (e.key === 'ArrowLeft') goTo(current - 1, 'keyboard');
  });

  let swipeTimer;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const index = slides.indexOf(entry.target);
      if (index === current) return;
      setActive(index);
      if (pendingAction) return;
      window.clearTimeout(swipeTimer);
      swipeTimer = window.setTimeout(() => {
        pushEvent(eventName, {
          component: 'carousel', carouselId: id, action: 'swipe', slideIndex: index + 1, slideCount: slides.length,
        });
      }, 400);
    });
  }, { root: track, threshold: 0.6 });
  slides.forEach((s) => observer.observe(s));
  setActive(0);
}
