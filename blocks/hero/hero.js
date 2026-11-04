export default function decorate(block) {
  const buttonContainers = [...block.querySelectorAll('.button-container')];
  if (buttonContainers.length > 1) {
    const wrapper = document.createElement('p');
    wrapper.className = 'button-container';
    buttonContainers[0].replaceWith(wrapper);
    buttonContainers.forEach((p) => {
      wrapper.append(...p.childNodes);
      if (p !== buttonContainers[0]) p.remove();
    });
  }

  // analytics (heroBannerInteraction) is loaded without blocking the hero, which is
  // usually the LCP element
  import('../../scripts/analytics/hero-banner.js')
    .then(({ default: trackHeroBanner }) => trackHeroBanner(block))
    .catch(() => {});
}
