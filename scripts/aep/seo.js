/**
 * Structured data (JSON-LD) for the AEP training site.
 */
import { getMetadata } from '../aem.js';
import { SITE_ROOT, getPageSegments } from './datalayer.js';

const ORG_NAME = 'NovaMart';

export function addJsonLd(id, data) {
  let script = document.head.querySelector(`script[data-jsonld="${id}"]`);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.jsonld = id;
    document.head.append(script);
  }
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data });
}

function titleCase(segment) {
  return segment.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function decorateSeo() {
  const { origin } = window.location;
  const segments = getPageSegments();
  const pageType = getMetadata('page-type');

  if (!segments.length) {
    addJsonLd('organization', {
      '@type': 'Organization',
      name: ORG_NAME,
      url: `${origin}${SITE_ROOT}/`,
      logo: `${origin}/content/dam/aep-training/images/brand/novamart-logo.svg`,
    });
    addJsonLd('website', {
      '@type': 'WebSite',
      name: ORG_NAME,
      url: `${origin}${SITE_ROOT}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}${SITE_ROOT}/products?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });
  }

  if (segments.length && pageType !== 'error') {
    const items = [{ name: 'Home', path: `${SITE_ROOT}/` }];
    segments.forEach((segment, i) => {
      items.push({ name: titleCase(segment), path: `${SITE_ROOT}/${segments.slice(0, i + 1).join('/')}` });
    });
    items[items.length - 1].name = getMetadata('breadcrumb-title')
      || document.querySelector('main h1')?.textContent.trim() || items[items.length - 1].name;
    addJsonLd('breadcrumbs', {
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem', position: i + 1, name: item.name, item: `${origin}${item.path}`,
      })),
    });
  }

  if (pageType === 'article') {
    addJsonLd('article', {
      '@type': 'BlogPosting',
      headline: document.querySelector('main h1')?.textContent.trim() || document.title,
      description: getMetadata('description'),
      image: getMetadata('og:image'),
      author: { '@type': 'Person', name: getMetadata('author') || ORG_NAME },
      datePublished: getMetadata('published-date'),
      publisher: { '@type': 'Organization', name: ORG_NAME },
    });
  }
}
