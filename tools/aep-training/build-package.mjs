#!/usr/bin/env node
/**
 * Builds an AEM content package (FileVault) for the NovaMart training site.
 *
 * Converts the generated preview pages (content/aep-training/**.plain.html) into
 * Universal Editor (XWalk) JCR content: cq:Page > jcr:content > root > section > components,
 * using the block models from component-definition.json, and adds the raster images as
 * DAM assets under /content/dam/aep-training/images.
 *
 * Usage: node tools/aep-training/build-package.mjs [--conf /conf/frescopa] [--version 1.0.0]
 * Output: packages/aep-training-content/aep-training-content-<version>.zip
 */
import {
  mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync, statSync, copyFileSync, existsSync,
} from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseFragment, serialize, serializeOuter } from 'parse5';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const CONF = arg('conf', '/conf/frescopa');
const VERSION = arg('version', '1.0.0');
const PKG_NAME = 'aep-training-content';
const SITE = '/content/aep-training';
const DAM = '/content/dam/aep-training/images';
const OUT = join(REPO, 'packages', PKG_NAME);
const BUILD = join(OUT, 'build');
const ASSETS = join(REPO, 'tools/aep-training/assets');

/* ---------- component definitions (Universal Editor) ---------- */

const definitions = {};
JSON.parse(readFileSync(join(REPO, 'component-definition.json'), 'utf8')).groups
  .forEach((group) => group.components.forEach((c) => {
    if (c.plugins?.xwalk?.page) definitions[c.id] = c.plugins.xwalk.page;
  }));
const template = (id) => ({ ...(definitions[id]?.template || {}) });
const resourceType = (id) => definitions[id]?.resourceType;

// block name -> item component id (container blocks)
const ITEMS = {
  cards: 'card',
  tabs: 'tab',
  accordion: 'accordion-item',
  faq: 'faq-item',
  carousel: 'carousel-slide',
  testimonials: 'testimonial',
  'product-grid': 'product-item',
  'product-carousel': 'product-item',
};
// blocks whose "classes" field is a single select instead of a multiselect
const SINGLE_CLASS = ['product-carousel', 'orders'];

/* ---------- HTML helpers ---------- */

const isEl = (n) => n && n.tagName;
const kids = (n) => (n.childNodes || []).filter((c) => isEl(c) || (c.nodeName === '#text' && c.value.trim()));
const elKids = (n) => (n.childNodes || []).filter(isEl);
const attr = (n, name) => n.attrs?.find((a) => a.name === name)?.value || '';
const classes = (n) => attr(n, 'class').split(/\s+/).filter(Boolean);
const text = (n) => {
  if (!n) return '';
  if (n.nodeName === '#text') return n.value;
  return (n.childNodes || []).map(text).join('');
};
const find = (n, tag) => {
  if (!n) return null;
  if (n.tagName === tag) return n;
  for (const c of n.childNodes || []) {
    const r = find(c, tag);
    if (r) return r;
  }
  return null;
};
const findAll = (n, tag, acc = []) => {
  if (n?.tagName === tag) acc.push(n);
  (n?.childNodes || []).forEach((c) => findAll(c, tag, acc));
  return acc;
};
const inner = (n) => (n ? serialize(n).trim() : '');
const cellText = (n) => text(n).trim();

/** /content/dam/.../x.svg -> raster rendition shipped in the package */
const damPath = (src) => {
  if (!src || !src.startsWith(DAM)) return src;
  const rel = src.slice(DAM.length + 1);
  return `${DAM}/${rel.replace(/\.svg$/, rel.startsWith('avatars/') || rel.startsWith('brand/') ? '.png' : '.jpg')}`;
};
const rewriteRich = (html) => html.replace(/(\/content\/dam\/aep-training\/images\/[^"')\s]+)\.svg/g, (m, p) => damPath(`${p}.svg`));
const picture = (cell) => {
  const img = find(cell, 'img');
  return img ? { image: damPath(attr(img, 'src')), imageAlt: attr(img, 'alt') } : {};
};
const onlyPicture = (el) => el.tagName === 'p' && elKids(el).length === 1 && elKids(el)[0].tagName === 'picture' && !cellText(el);
const num = (value) => {
  const n = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isNaN(n) ? undefined : { type: 'Double', value: n };
};

/* ---------- JCR node model ---------- */

const node = (name, props, children = []) => ({ name, props, children });
const component = (id, props, children) => node(id, {
  'sling:resourceType': resourceType(id), ...template(id), ...props,
}, children);

/** default content (headings, images, text) -> title / image / text components */
function defaultContent(elements) {
  const out = [];
  let buffer = [];
  const flush = () => {
    if (buffer.length) out.push(component('text', { text: rewriteRich(buffer.join('')) }));
    buffer = [];
  };
  elements.forEach((el) => {
    if (!isEl(el)) {
      buffer.push(`<p>${el.value.trim()}</p>`);
    } else if (/^h[1-6]$/.test(el.tagName)) {
      flush();
      out.push(component('title', { title: cellText(el), titleType: el.tagName }));
    } else if (onlyPicture(el)) {
      flush();
      out.push(component('image', picture(el)));
    } else {
      buffer.push(serializeOuter(el));
    }
  });
  flush();
  return out;
}

const productItem = (cells) => {
  const [img, name, sku, price, compare, category, brand, rating, badge, linkCell] = cells;
  return {
    ...picture(img),
    productName: cellText(name),
    sku: cellText(sku),
    price: num(cellText(price)),
    compareAtPrice: cellText(compare) ? num(cellText(compare)) : undefined,
    category: cellText(category),
    brand: cellText(brand),
    rating: num(cellText(rating)),
    badge: cellText(badge),
    link: attr(find(linkCell, 'a'), 'href'),
  };
};

const ITEM_FIELDS = {
  card: ([img, body]) => ({ ...picture(img), text: rewriteRich(inner(body)) }),
  tab: ([label, body]) => ({ title: cellText(label), content: rewriteRich(inner(body)) }),
  'accordion-item': ([label, body]) => ({ summary: cellText(label), text: rewriteRich(inner(body)) }),
  'faq-item': ([q, a]) => ({ question: cellText(q), answer: rewriteRich(inner(a)) }),
  'carousel-slide': ([img, body]) => ({ ...picture(img), text: rewriteRich(inner(body)) }),
  testimonial: ([img, quote, name, role, rating]) => ({
    image: picture(img).image, quote: inner(quote), name: cellText(name), role: cellText(role), rating: cellText(rating),
  }),
  'product-item': productItem,
};

const BLOCK_FIELDS = {
  hero: (rows) => {
    const cell = rows[0][0];
    const parts = kids(cell);
    const pic = parts.find((p) => isEl(p) && onlyPicture(p));
    return {
      ...picture(pic),
      text: rewriteRich(parts.filter((p) => p !== pic).map((p) => (isEl(p) ? serializeOuter(p) : p.value)).join('')),
    };
  },
  cta: (rows) => ({ text: rewriteRich(inner(rows[0]?.[0])), ...picture(rows[1]?.[0]) }),
  banner: (rows) => ({
    ...picture(rows[0]?.[0]),
    text: rewriteRich(inner(rows[1]?.[0])),
    couponCode: cellText(rows[2]?.[0]),
    campaignId: cellText(rows[3]?.[0]),
  }),
  search: (rows) => ({ placeholder: cellText(rows[0]?.[0]), scope: cellText(rows[1]?.[0]), popular: cellText(rows[2]?.[0]) }),
  'product-info': (rows) => {
    const c = rows.map((r) => r[0]);
    return {
      images: findAll(c[0], 'img').map((img) => damPath(attr(img, 'src'))),
      productName: cellText(c[1]),
      sku: cellText(c[2]),
      price: num(cellText(c[3])),
      compareAtPrice: cellText(c[4]) ? num(cellText(c[4])) : undefined,
      brand: cellText(c[5]),
      category: cellText(c[6]),
      rating: num(cellText(c[7])),
      reviewCount: { type: 'Long', value: parseInt(cellText(c[8]), 10) || 0 },
      description: rewriteRich(inner(c[9])),
      options: cellText(c[10]),
    };
  },
  cart: (rows) => ({ emptyMessage: rewriteRich(inner(rows[0]?.[0])) }),
  wishlist: (rows) => ({ emptyMessage: rewriteRich(inner(rows[0]?.[0])) }),
  checkout: (rows) => ({ intro: rewriteRich(inner(rows[0]?.[0])) }),
  orders: () => ({}),
};

function convertBlock(el) {
  const [name, ...variants] = classes(el);
  const rows = elKids(el).map((row) => elKids(row));
  if (name === 'columns') {
    return node('columns', {
      'sling:resourceType': resourceType('columns'),
      columns: String(rows[0]?.length || 1),
      rows: String(rows.length),
    }, rows.map((cells, r) => node(`row${r ? `_${r}` : ''}`, {
      'sling:resourceType': `${resourceType('columns')}/row`,
    }, cells.map((cell, c) => node(`column${c ? `_${c}` : ''}`, {
      'sling:resourceType': `${resourceType('columns')}/row/column`,
    }, defaultContent(kids(cell)))))));
  }
  if (!definitions[name]) throw new Error(`No Universal Editor definition for block "${name}"`);
  const props = { 'sling:resourceType': resourceType(name), ...template(name) };
  if (variants.length) props.classes = SINGLE_CLASS.includes(name) ? variants[0] : variants;
  const itemId = ITEMS[name];
  if (itemId) {
    const items = rows.map((cells, i) => node(`item${i ? `_${i}` : ''}`, {
      'sling:resourceType': resourceType(itemId), ...template(itemId), ...ITEM_FIELDS[itemId](cells),
    }));
    return node('block', props, items);
  }
  return node('block', { ...props, ...(BLOCK_FIELDS[name] ? BLOCK_FIELDS[name](rows) : {}) });
}

function kv(el) {
  return Object.fromEntries(elKids(el).map((row) => {
    const [k, v] = elKids(row);
    return [cellText(k), cellText(v)];
  }));
}

function convertPage(html) {
  const sections = elKids(parseFragment(html));
  let metadata = {};
  const sectionNodes = [];
  sections.forEach((sectionEl) => {
    const meta = elKids(sectionEl).find((c) => classes(c)[0] === 'metadata');
    if (meta) {
      metadata = kv(meta);
      return;
    }
    const sectionMeta = elKids(sectionEl).find((c) => classes(c)[0] === 'section-metadata');
    const props = { 'sling:resourceType': resourceType('section'), ...template('section') };
    if (sectionMeta) {
      Object.entries(kv(sectionMeta)).forEach(([k, v]) => {
        props[k] = k === 'style' ? v.split(',').map((s) => s.trim()) : v;
      });
    }
    const children = [];
    let buffer = [];
    const flush = () => {
      children.push(...defaultContent(buffer));
      buffer = [];
    };
    kids(sectionEl).forEach((child) => {
      if (child === sectionMeta) return;
      if (isEl(child) && child.tagName === 'div' && classes(child).length) {
        flush();
        children.push(convertBlock(child));
      } else {
        buffer.push(child);
      }
    });
    flush();
    sectionNodes.push(node('section', props, children));
  });
  return { metadata, sectionNodes };
}

/* ---------- FileVault serialisation ---------- */

const NS = 'xmlns:sling="http://sling.apache.org/jcr/sling/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:dam="http://www.day.com/dam/1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:tiff="http://ns.adobe.com/tiff/1.0/"';

const xmlEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  .replace(/\r?\n/g, '&#xa;')
  .replace(/\t/g, '&#x9;');
const vaultString = (s) => {
  let v = s.replace(/\\/g, '\\\\');
  if (/^[[{]/.test(v)) v = `\\${v}`;
  return v;
};
function propValue(value) {
  if (Array.isArray(value)) return `[${value.map((v) => xmlEsc(vaultString(String(v)).replace(/,/g, '\\,'))).join(',')}]`;
  if (value && typeof value === 'object') return `{${value.type}}${value.value}`;
  return xmlEsc(vaultString(String(value)));
}
function propsXml(props) {
  return Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length))
    .map(([k, v]) => `${k}="${propValue(v)}"`)
    .join(' ');
}
const uniqueNames = (children) => {
  const seen = {};
  return children.map((c) => {
    const base = c.name;
    seen[base] = (seen[base] ?? -1) + 1;
    return { ...c, name: seen[base] ? `${base}_${seen[base]}` : base };
  });
};
function nodeXml(n, indent) {
  const pad = '    '.repeat(indent);
  const head = `${pad}<${n.name} jcr:primaryType="nt:unstructured" ${propsXml(n.props)}`;
  if (!n.children.length) return `${head}/>`;
  return `${head}>\n${uniqueNames(n.children).map((c) => nodeXml(c, indent + 1)).join('\n')}\n${pad}</${n.name}>`;
}

const write = (file, data) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
};

function pageXml({ metadata, sectionNodes }, extraProps = {}) {
  const pageProps = {
    'cq:template': '/libs/core/franklin/templates/page',
    'jcr:primaryType': 'cq:PageContent',
    'sling:resourceType': 'core/franklin/components/page/v1/page',
    'jcr:title': metadata.title,
    'jcr:description': metadata.description,
    ...extraProps,
  };
  Object.entries(metadata).forEach(([k, v]) => {
    pageProps[k] = k === 'image' ? damPath(v) : v;
  });
  const content = `<jcr:content ${propsXml(pageProps)}>
        <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
${uniqueNames(sectionNodes).map((s) => nodeXml(s, 3)).join('\n')}
        </root>
    </jcr:content>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<jcr:root ${NS} jcr:primaryType="cq:Page">\n    ${content}\n</jcr:root>\n`;
}

/* ---------- build ---------- */

rmSync(BUILD, { recursive: true, force: true });
const JCR = join(BUILD, 'jcr_root');
const manifest = JSON.parse(readFileSync(join(REPO, 'tools/aep-training/manifest.json'), 'utf8'));
const entries = [...manifest.pages, ...manifest.fragments];
const stats = { pages: 0, blocks: 0, sections: 0, assets: 0 };

entries.forEach(({ path }) => {
  const file = join(REPO, 'content/aep-training', `${path || 'index'}.plain.html`);
  const converted = convertPage(readFileSync(file, 'utf8'));
  if (!converted.metadata.title) converted.metadata.title = path === 'nav' ? 'Navigation' : 'Footer';
  stats.pages += 1;
  stats.sections += converted.sectionNodes.length;
  const count = (n) => n.children.reduce((s, c) => s + (c.name.startsWith('block') || c.name.startsWith('columns') ? 1 : 0) + count(c), 0);
  converted.sectionNodes.forEach((s) => { stats.blocks += count(s); });
  const extra = path ? {} : { 'cq:conf': CONF };
  write(join(JCR, SITE, path, '.content.xml'), pageXml(converted, extra));
});

// DAM folders and assets
const folderXml = (title) => `<?xml version="1.0" encoding="UTF-8"?>\n<jcr:root ${NS} jcr:primaryType="sling:OrderedFolder">\n    <jcr:content jcr:primaryType="nt:unstructured" jcr:title="${xmlEsc(title)}"/>\n</jcr:root>\n`;
write(join(JCR, '/content/dam/aep-training/.content.xml'), folderXml('AEP Training'));
write(join(JCR, DAM, '.content.xml'), folderXml('Images'));
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const folders = new Set();
walk(ASSETS).forEach((file) => {
  const rel = relative(ASSETS, file);
  const folder = dirname(rel);
  if (!folders.has(folder)) {
    folders.add(folder);
    write(join(JCR, DAM, folder, '.content.xml'), folderXml(folder.charAt(0).toUpperCase() + folder.slice(1)));
  }
  const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const assetDir = join(JCR, DAM, rel);
  const [w, h] = folder === 'products' ? [800, 800] : { avatars: [240, 240], brand: [480, 120] }[folder]
    || (rel.includes('tile-') ? [800, 600] : [1600, 700]);
  const title = rel.split('/').pop().replace(/\.(png|jpg)$/, '').replace(/-/g, ' ');
  write(join(assetDir, '.content.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root ${NS} jcr:primaryType="dam:Asset">
    <jcr:content jcr:primaryType="dam:AssetContent">
        <metadata jcr:primaryType="nt:unstructured" dc:format="${mime}" dc:title="${xmlEsc(title)}" tiff:ImageWidth="{Long}${w}" tiff:ImageLength="{Long}${h}"/>
        <related jcr:primaryType="nt:unstructured"/>
        <renditions jcr:primaryType="nt:folder"/>
    </jcr:content>
</jcr:root>
`);
  mkdirSync(join(assetDir, '_jcr_content/renditions/original.dir'), { recursive: true });
  copyFileSync(file, join(assetDir, '_jcr_content/renditions/original'));
  write(join(assetDir, '_jcr_content/renditions/original.dir/.content.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" jcr:primaryType="nt:file">
    <jcr:content jcr:primaryType="nt:resource" jcr:mimeType="${mime}"/>
</jcr:root>
`);
  stats.assets += 1;
});

// package metadata
write(join(BUILD, 'META-INF/vault/filter.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
    <filter root="${SITE}"/>
    <filter root="/content/dam/aep-training"/>
</workspaceFilter>
`);
write(join(BUILD, 'META-INF/vault/properties.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
<comment>FileVault Package Properties</comment>
<entry key="name">${PKG_NAME}</entry>
<entry key="group">aep-training</entry>
<entry key="version">${VERSION}</entry>
<entry key="description">NovaMart AEP training site: ${stats.pages} pages under ${SITE} and ${stats.assets} images under /content/dam/aep-training (Universal Editor / Edge Delivery Services).</entry>
<entry key="packageType">content</entry>
<entry key="requiresRoot">false</entry>
<entry key="allowIndexDefinitions">false</entry>
</properties>
`);

const zip = join(OUT, `${PKG_NAME}-${VERSION}.zip`);
rmSync(zip, { force: true });
execFileSync('python3', ['-c', `
import os, sys, zipfile
src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as z:
    for top in ['META-INF', 'jcr_root']:
        for root, dirs, files in os.walk(os.path.join(src, top)):
            dirs.sort()
            rel = os.path.relpath(root, src)
            z.write(root, rel + '/')
            for f in sorted(files):
                z.write(os.path.join(root, f), os.path.join(rel, f))
`, BUILD, zip]);

if (!existsSync(zip)) throw new Error('zip was not created');
console.info(`Built ${relative(REPO, zip)}: ${stats.pages} pages, ${stats.sections} sections, ${stats.blocks} blocks, ${stats.assets} assets (cq:conf ${CONF}).`);
