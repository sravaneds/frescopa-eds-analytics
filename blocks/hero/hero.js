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

  // Adobe Client Data Layer: hero banner engagement (heroBannerInteraction)
  window.adobeDataLayer = window.adobeDataLayer || [];
  const bannerTitle = (block.querySelector('h1, h2, h3')?.textContent || '').trim().replace(/\s+/g, ' ');
  const variation = [...block.classList].filter((c) => !['block', 'hero'].includes(c)).join(' ') || 'default';
  const buttons = [...block.querySelectorAll('a.button')];

  // impression: the hero is 50 % visible, reported once per hero on the page
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      window.adobeDataLayer.push({
        event: 'heroBannerInteraction',
        component: {
          type: 'hero-banner',
          title: bannerTitle,
          variation,
          ctaText: (buttons[0]?.textContent || '').trim(),
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

  // click: primary CTA (bold link), secondary CTA (italic link) or another link in the hero
  block.addEventListener('click', (e) => {
    const cta = e.target.closest('a[href]');
    if (!cta) return;
    // authored style first (aem.js decorateButtons), then button order
    let ctaType = 'link';
    if (cta.classList.contains('secondary')) ctaType = 'secondary';
    else if (cta.classList.contains('primary') || buttons.indexOf(cta) === 0) ctaType = 'primary';
    else if (buttons.indexOf(cta) === 1) ctaType = 'secondary';
    window.adobeDataLayer.push({
      event: 'heroBannerInteraction',
      component: {
        type: 'hero-banner',
        title: bannerTitle,
        variation,
        ctaText: (cta.textContent || cta.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' '),
        ctaType,
        ctaUrl: cta.href,
        action: 'click',
      },
    });
  });
}
