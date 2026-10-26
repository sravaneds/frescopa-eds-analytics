/**
 * Generates lightweight SVG illustrations for the AEP training site
 * (products, heroes, category tiles, blog, avatars, logo). SVGs keep the repo
 * small and render crisply at any size.
 */

const g = (c, a) => ({
  headphones: `<path d="M110 230v-40a90 90 0 0 1 180 0v40" fill="none" stroke="${c}" stroke-width="18" stroke-linecap="round"/><rect x="88" y="215" width="54" height="90" rx="22" fill="${c}"/><rect x="258" y="215" width="54" height="90" rx="22" fill="${c}"/><rect x="100" y="232" width="30" height="56" rx="12" fill="${a}"/><rect x="270" y="232" width="30" height="56" rx="12" fill="${a}"/>`,
  laptop: `<rect x="105" y="115" width="190" height="130" rx="10" fill="${c}"/><rect x="118" y="128" width="164" height="104" rx="4" fill="${a}"/><path d="M80 255h240l-18 30H98z" fill="${c}"/><rect x="180" y="262" width="40" height="6" rx="3" fill="${a}"/>`,
  phone: `<rect x="145" y="85" width="110" height="230" rx="22" fill="${c}"/><rect x="155" y="105" width="90" height="185" rx="8" fill="${a}"/><circle cx="200" cy="300" r="6" fill="${a}"/><rect x="185" y="93" width="30" height="5" rx="2.5" fill="${a}"/>`,
  watch: `<rect x="170" y="80" width="60" height="70" rx="12" fill="${c}"/><rect x="170" y="250" width="60" height="70" rx="12" fill="${c}"/><rect x="140" y="140" width="120" height="120" rx="32" fill="${c}"/><rect x="155" y="155" width="90" height="90" rx="22" fill="${a}"/><path d="M200 175v28l18 12" stroke="${c}" stroke-width="8" fill="none" stroke-linecap="round"/>`,
  camera: `<rect x="90" y="140" width="220" height="150" rx="18" fill="${c}"/><rect x="120" y="118" width="60" height="30" rx="8" fill="${c}"/><circle cx="200" cy="215" r="55" fill="${a}"/><circle cx="200" cy="215" r="34" fill="${c}"/><circle cx="270" cy="165" r="8" fill="${a}"/>`,
  speaker: `<rect x="135" y="95" width="130" height="210" rx="40" fill="${c}"/><circle cx="200" cy="235" r="42" fill="${a}"/><circle cx="200" cy="235" r="18" fill="${c}"/><circle cx="200" cy="145" r="18" fill="${a}"/>`,
  tv: `<rect x="70" y="105" width="260" height="160" rx="10" fill="${c}"/><rect x="82" y="117" width="236" height="136" rx="4" fill="${a}"/><path d="M170 265h60l15 35h-90z" fill="${c}"/><rect x="140" y="298" width="120" height="8" rx="4" fill="${c}"/>`,
  earbuds: `<rect x="130" y="210" width="140" height="95" rx="40" fill="${c}"/><rect x="130" y="250" width="140" height="6" fill="${a}"/><circle cx="160" cy="160" r="26" fill="${c}"/><rect x="150" y="160" width="18" height="55" rx="9" fill="${c}"/><circle cx="240" cy="160" r="26" fill="${c}"/><rect x="232" y="160" width="18" height="55" rx="9" fill="${c}"/><circle cx="160" cy="160" r="10" fill="${a}"/><circle cx="240" cy="160" r="10" fill="${a}"/>`,
  jacket: `<path d="M150 90l50 25 50-25 70 40-25 60-25-12v135H130V178l-25 12-25-60z" fill="${c}"/><path d="M200 115v195" stroke="${a}" stroke-width="6"/><path d="M130 175h140M130 225h140M130 275h140" stroke="${a}" stroke-width="4" opacity=".6"/>`,
  dress: `<path d="M165 85h70l-10 60 30 25-15 20 55 120H105l55-120-15-20 30-25z" fill="${c}"/><path d="M170 85l-5-20M230 85l5-20" stroke="${c}" stroke-width="6"/><path d="M140 250q60 25 120 0" stroke="${a}" stroke-width="5" fill="none"/>`,
  sneaker: `<path d="M75 245c0-30 15-60 40-70l45 30c35 20 70 25 115 30 25 3 50 15 50 40v15H75z" fill="${c}"/><rect x="75" y="285" width="250" height="20" rx="8" fill="${a}"/><path d="M150 200l15 20M170 195l15 22M190 205l12 20" stroke="${a}" stroke-width="5" stroke-linecap="round"/>`,
  sunglasses: `<path d="M70 175h260" stroke="${c}" stroke-width="10" stroke-linecap="round"/><path d="M85 175h95c0 50-15 70-50 70s-45-25-45-70zM220 175h95c0 45-10 70-45 70s-50-20-50-70z" fill="${c}"/><path d="M110 190l30 30M245 190l30 30" stroke="${a}" stroke-width="6" stroke-linecap="round"/>`,
  hoodie: `<path d="M160 100q40-40 80 0l75 40-25 65-20-10v120H130V195l-20 10-25-65z" fill="${c}"/><path d="M165 100q35 50 70 0" fill="${a}"/><rect x="160" y="245" width="80" height="45" rx="8" fill="${a}" opacity=".6"/><path d="M188 135v40M212 135v40" stroke="${a}" stroke-width="4"/>`,
  bag: `<path d="M150 150v-25a50 50 0 0 1 100 0v25" fill="none" stroke="${c}" stroke-width="12"/><path d="M105 150h190l-15 160H120z" fill="${c}"/><rect x="150" y="200" width="100" height="10" rx="5" fill="${a}"/>`,
  boot: `<path d="M140 80h80v150l75 30c15 6 25 18 25 35v15H120l20-100z" fill="${c}"/><rect x="120" y="300" width="200" height="18" rx="6" fill="${a}"/><path d="M220 120h-80" stroke="${a}" stroke-width="5"/>`,
  backpack: `<rect x="120" y="110" width="160" height="200" rx="45" fill="${c}"/><path d="M170 110v-15a30 30 0 0 1 60 0v15" fill="none" stroke="${c}" stroke-width="10"/><rect x="145" y="210" width="110" height="70" rx="16" fill="${a}"/><path d="M145 235h110" stroke="${c}" stroke-width="4"/>`,
  blender: `<path d="M145 80h110l-15 150h-80z" fill="${a}" stroke="${c}" stroke-width="8" stroke-linejoin="round"/><rect x="140" y="230" width="120" height="80" rx="14" fill="${c}"/><circle cx="200" cy="270" r="16" fill="${a}"/><rect x="155" y="70" width="90" height="14" rx="6" fill="${c}"/>`,
  vacuum: `<rect x="185" y="70" width="30" height="190" rx="12" fill="${c}"/><rect x="200" y="90" width="55" height="80" rx="20" fill="${c}"/><circle cx="228" cy="130" r="18" fill="${a}"/><path d="M130 280h140a20 20 0 0 1 0 40H130a20 20 0 0 1 0-40z" fill="${c}"/><rect x="190" y="255" width="20" height="30" fill="${c}"/>`,
  coffee: `<rect x="110" y="90" width="180" height="220" rx="18" fill="${c}"/><rect x="135" y="115" width="130" height="50" rx="8" fill="${a}"/><rect x="175" y="180" width="50" height="20" rx="4" fill="${a}"/><path d="M165 240h70v30a20 20 0 0 1-20 20h-30a20 20 0 0 1-20-20z" fill="#fff"/><path d="M235 248h10a10 10 0 0 1 0 20h-10" fill="none" stroke="#fff" stroke-width="6"/>`,
  airfryer: `<rect x="115" y="95" width="170" height="215" rx="50" fill="${c}"/><rect x="140" y="190" width="120" height="85" rx="20" fill="${a}"/><rect x="185" y="225" width="30" height="10" rx="5" fill="${c}"/><circle cx="200" cy="140" r="22" fill="${a}"/>`,
  kettle: `<path d="M140 150h120l15 150H125z" fill="${c}"/><path d="M260 170c40 0 40 70 5 80" fill="none" stroke="${c}" stroke-width="12"/><path d="M140 175c-40-10-60-50-70-75" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/><rect x="160" y="130" width="80" height="22" rx="10" fill="${c}"/><rect x="150" y="285" width="100" height="10" rx="5" fill="${a}"/>`,
  washer: `<rect x="110" y="80" width="180" height="240" rx="16" fill="${c}"/><rect x="125" y="95" width="150" height="35" rx="6" fill="${a}"/><circle cx="200" cy="220" r="65" fill="${a}"/><circle cx="200" cy="220" r="45" fill="${c}" opacity=".7"/>`,
  purifier: `<rect x="135" y="80" width="130" height="240" rx="30" fill="${c}"/><g fill="${a}">${[0, 1, 2, 3, 4, 5].map((r) => [0, 1, 2, 3].map((col) => `<circle cx="${165 + col * 23}" cy="${150 + r * 25}" r="6"/>`).join('')).join('')}</g><rect x="165" y="100" width="70" height="20" rx="10" fill="${a}"/>`,
  mixer: `<path d="M140 300h150v15H140z" fill="${c}"/><rect x="255" y="120" width="35" height="185" rx="14" fill="${c}"/><path d="M140 110h150a30 30 0 0 1 0 60H160a40 40 0 0 1-20-60z" fill="${c}"/><path d="M150 210h100l-15 75h-70z" fill="${a}"/><path d="M200 170v40" stroke="${c}" stroke-width="8"/>`,
});

function lighten(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * amount));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const svg = (w, h, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"><title>${title}</title>${body}</svg>\n`;

export function productSvg(product, colors, variant = 0) {
  const [dark, light] = colors;
  const bgA = lighten(light, 0.75 - variant * 0.1);
  const bgB = lighten(light, 0.45);
  const glyph = g(dark, lighten(light, 0.5 - variant * 0.15))[product.glyph] || '';
  const rotate = [0, -8, 8][variant] || 0;
  return svg(400, 400, `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient></defs><rect width="400" height="400" fill="url(#bg)"/><ellipse cx="200" cy="335" rx="120" ry="14" fill="${dark}" opacity=".12"/><g transform="rotate(${rotate} 200 200)">${glyph}</g>`, product.name);
}

/**
 * Wide illustrated banner (hero, blog, category).
 * @param {string[]} glyphs glyph names placed on the right
 */
export function sceneSvg({
  w = 1600, h = 700, colors, glyphs = [], title, pattern = 'circles',
}) {
  const [dark, light] = colors;
  const start = w * 0.5;
  const spacing = (w * 0.47) / Math.max(glyphs.length, 1);
  const size = Math.min((spacing / 400) * 1.15, (h / 400) * 0.75);
  const items = glyphs.map((name, i) => {
    const cx = start + spacing * (i + 0.5);
    const x = Math.round(cx - 200 * size);
    const y = Math.round(h / 2 - 200 * size + (i % 2 ? h * 0.06 : -h * 0.04));
    return `<g transform="translate(${x} ${y}) scale(${size.toFixed(3)})">${g(dark, lighten(light, 0.55))[name] || ''}</g>`;
  }).join('');
  const deco = pattern === 'circles'
    ? `<circle cx="${w * 0.78}" cy="${h * 0.3}" r="${h * 0.55}" fill="${lighten(light, 0.35)}" opacity=".55"/><circle cx="${w * 0.95}" cy="${h * 0.9}" r="${h * 0.35}" fill="${lighten(light, 0.15)}" opacity=".4"/>`
    : `<path d="M${w * 0.4} ${h}L${w * 0.75} 0H${w}V${h}z" fill="${lighten(light, 0.35)}" opacity=".6"/>`;
  return svg(w, h, `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(light, 0.85)}"/><stop offset="1" stop-color="${lighten(light, 0.55)}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#bg)"/>${deco}${items}`, title);
}

export function avatarSvg(initials, color) {
  return svg(120, 120, `<rect width="120" height="120" rx="60" fill="${lighten(color, 0.7)}"/><text x="60" y="72" text-anchor="middle" font-family="system-ui, sans-serif" font-size="40" font-weight="700" fill="${color}">${initials}</text>`, initials);
}

export function logoSvg() {
  return svg(240, 60, '<rect x="2" y="10" width="40" height="40" rx="10" fill="#1d4ed8"/><path d="M12 40V20l20 20V20" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="54" y="42" font-family="system-ui, sans-serif" font-size="30" font-weight="800" fill="#0f172a">NovaMart</text>', 'NovaMart');
}
