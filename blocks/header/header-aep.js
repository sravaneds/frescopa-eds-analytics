import { loadCSS } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { pushEvent, SITE_ROOT } from '../../scripts/aep/datalayer.js';
import { getProfile } from '../../scripts/aep/profile.js';
import { getCart, getWishlist } from '../../scripts/aep/store.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

function closeSubmenus(nav, except) {
  nav.querySelectorAll('.nm-sections button[aria-expanded="true"]').forEach((b) => {
    if (b !== except) b.setAttribute('aria-expanded', 'false');
  });
}

function buildSections(source) {
  const ul = document.createElement('ul');
  ul.className = 'nm-sections';
  [...(source?.querySelector('ul')?.children || [])]
    .forEach((li, i) => {
      const item = document.createElement('li');
      const submenu = li.querySelector('ul');
      if (submenu) {
        const label = [...li.childNodes].filter((n) => n !== submenu).map((n) => n.textContent).join('').trim();
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'nm-section-toggle';
        button.textContent = label;
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', `nm-submenu-${i}`);
        button.dataset.trackHandled = 'true';
        submenu.id = `nm-submenu-${i}`;
        submenu.className = 'nm-submenu';
        item.append(button, submenu);
        item.classList.add('nm-has-submenu');
      } else {
        item.append(...li.childNodes);
      }
      ul.append(item);
    });
  return ul;
}

function updateCounts(tools) {
  const cart = getCart();
  const wishlist = getWishlist();
  const profile = getProfile();
  tools.querySelectorAll('a').forEach((a) => {
    const path = new URL(a.href).pathname;
    let badge = a.querySelector('.nm-badge');
    const set = (count, label) => {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nm-badge';
        a.append(badge);
      }
      badge.textContent = count;
      badge.hidden = !count;
      a.setAttribute('aria-label', `${label}${count ? ` (${count} item${count === 1 ? '' : 's'})` : ''}`);
    };
    if (path.endsWith('/cart')) set(cart.itemCount, 'Cart');
    if (path.endsWith('/wishlist')) set(wishlist.length, 'Wishlist');
    if (path.endsWith('/account')) {
      a.dataset.label = a.dataset.label || a.textContent.trim();
      a.firstChild.textContent = profile.loggedIn ? `Hi, ${profile.firstName}` : a.dataset.label;
    }
  });
}

/**
 * Header for the AEP training site (nav fragment: brand | sections | tools).
 * @param {Element} block The header block element
 * @param {string} navPath path of the nav fragment
 */
export default async function decorate(block, navPath) {
  const [fragment] = await Promise.all([
    loadFragment(navPath),
    loadCSS(`${window.hlx.codeBasePath}/blocks/header/header-aep.css`),
  ]);
  const [brandSrc, sectionsSrc, toolsSrc] = fragment ? [...fragment.children] : [];

  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';

  const wrapper = document.createElement('div');
  wrapper.className = 'nm-header';
  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#main';
  skip.textContent = 'Skip to main content';

  const nav = document.createElement('nav');
  nav.className = 'nm-nav';
  nav.setAttribute('aria-label', 'Main');

  const brand = document.createElement('div');
  brand.className = 'nm-brand';
  const brandLink = brandSrc?.querySelector('a');
  if (brandLink) {
    brandLink.className = '';
    brand.append(brandLink);
  }

  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'nm-hamburger';
  hamburger.setAttribute('aria-controls', 'nm-menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Open menu');
  hamburger.dataset.trackHandled = 'true';
  hamburger.innerHTML = '<span></span>';

  const menu = document.createElement('div');
  menu.className = 'nm-menu';
  menu.id = 'nm-menu';
  menu.append(buildSections(sectionsSrc));

  const search = document.createElement('form');
  search.className = 'nm-search';
  search.setAttribute('role', 'search');
  search.innerHTML = '<label for="nm-search-input" class="visually-hidden">Search products</label><input id="nm-search-input" type="search" name="q" placeholder="Search products" autocomplete="off"><button type="submit" aria-label="Submit search"></button>';
  search.addEventListener('submit', (e) => {
    e.preventDefault();
    const term = search.elements.q.value.trim();
    if (!term) return;
    pushEvent('searchSubmit', {
      SearchTerm: term, searchType: 'header', component: 'header', resultCount: -1,
    });
    window.location.href = `${SITE_ROOT}/products?q=${encodeURIComponent(term)}`;
  });
  menu.append(search);

  const tools = document.createElement('ul');
  tools.className = 'nm-tools';
  toolsSrc?.querySelectorAll('a').forEach((a) => {
    const li = document.createElement('li');
    a.className = '';
    li.append(a);
    tools.append(li);
  });
  updateCounts(tools);
  document.addEventListener('aep:store-updated', () => updateCounts(tools));

  nav.append(hamburger, brand, menu, tools);
  wrapper.append(skip, nav);
  block.textContent = '';
  block.append(wrapper);

  const setMenu = (open) => {
    hamburger.setAttribute('aria-expanded', open);
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('nm-open', open);
    document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
  };
  hamburger.addEventListener('click', () => {
    const open = hamburger.getAttribute('aria-expanded') !== 'true';
    setMenu(open);
    pushEvent('navToggle', { component: 'header', action: open ? 'open' : 'close' });
  });
  nav.querySelectorAll('.nm-section-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      closeSubmenus(nav, button);
      button.setAttribute('aria-expanded', open);
      if (open) pushEvent('navClick', { component: 'header', CTAName: button.textContent, action: 'expand' });
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const expanded = nav.querySelector('.nm-section-toggle[aria-expanded="true"]');
    if (expanded) {
      expanded.setAttribute('aria-expanded', 'false');
      expanded.focus();
    } else if (nav.classList.contains('nm-open')) {
      setMenu(false);
      hamburger.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeSubmenus(nav);
  });
  isDesktop.addEventListener('change', () => setMenu(false));

  // highlight current page
  nav.querySelectorAll('a').forEach((a) => {
    if (new URL(a.href).pathname === window.location.pathname) a.setAttribute('aria-current', 'page');
  });
}
