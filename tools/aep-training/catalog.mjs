/**
 * NovaMart demo catalog used by the AEP training site generator.
 * glyph = illustration used for the generated product image.
 */
export const CATEGORIES = {
  electronics: { name: 'Electronics', colors: ['#1d4ed8', '#60a5fa'] },
  fashion: { name: 'Fashion', colors: ['#be185d', '#f9a8d4'] },
  'home-appliances': { name: 'Home Appliances', colors: ['#047857', '#6ee7b7'] },
};

export const PRODUCTS = [
  {
    sku: 'EL-1001', slug: 'nova-pro-wireless-headphones', name: 'Nova Pro Wireless Headphones', category: 'electronics', brand: 'Nova Audio', price: 249, compareAt: 299, rating: 4.7, reviews: 1284, badge: 'Best Seller', tags: ['best-seller', 'deal'], glyph: 'headphones', options: ['Midnight Black', 'Glacier White', 'Ocean Blue'],
    description: 'Adaptive noise cancelling, 40-hour battery life and studio-tuned 40 mm drivers. Multipoint Bluetooth 5.3 lets you switch between laptop and phone instantly.',
  },
  {
    sku: 'EL-1002', slug: 'lumen-book-14-laptop', name: 'Lumen Book 14 Laptop', category: 'electronics', brand: 'Lumen', price: 1099, compareAt: 0, rating: 4.6, reviews: 412, badge: 'New', tags: ['new'], glyph: 'laptop', options: ['Silver', 'Graphite'],
    description: '14-inch 2.8K display, 16 GB RAM and 1 TB SSD in a 1.2 kg aluminium body. All-day battery for work and study.',
  },
  {
    sku: 'EL-1003', slug: 'pulse-x-smartphone', name: 'Pulse X Smartphone', category: 'electronics', brand: 'Pulse', price: 799, compareAt: 899, rating: 4.5, reviews: 903, badge: 'Sale', tags: ['deal', 'best-seller'], glyph: 'phone', options: ['Black', 'Sage', 'Sand'],
    description: '6.4-inch OLED, triple 50 MP camera system and 5G. Two days of battery with fast wireless charging.',
  },
  {
    sku: 'EL-1004', slug: 'orbit-smartwatch', name: 'Orbit Smartwatch', category: 'electronics', brand: 'Orbit', price: 299, compareAt: 0, rating: 4.4, reviews: 655, badge: '', tags: ['seasonal'], glyph: 'watch', options: ['Black', 'Rose Gold'],
    description: 'Health and fitness tracking with GPS, ECG and sleep coaching. Swim-proof to 50 m.',
  },
  {
    sku: 'EL-1005', slug: 'aperture-m50-mirrorless-camera', name: 'Aperture M50 Mirrorless Camera', category: 'electronics', brand: 'Aperture', price: 649, compareAt: 749, rating: 4.8, reviews: 288, badge: 'Sale', tags: ['deal'], glyph: 'camera', options: ['Black'],
    description: '24 MP APS-C sensor, 4K video and in-body stabilisation. Includes a 15-45 mm kit lens.',
  },
  {
    sku: 'EL-1006', slug: 'echo-mini-bluetooth-speaker', name: 'Echo Mini Bluetooth Speaker', category: 'electronics', brand: 'Nova Audio', price: 79, compareAt: 0, rating: 4.3, reviews: 1540, badge: 'Best Seller', tags: ['best-seller', 'seasonal'], glyph: 'speaker', options: ['Coral', 'Slate', 'Mint'],
    description: 'Room-filling 360° sound, IP67 waterproof and 18-hour playtime.',
  },
  {
    sku: 'EL-1007', slug: 'vista-55-4k-tv', name: 'Vista 55" 4K Smart TV', category: 'electronics', brand: 'Vista', price: 549, compareAt: 699, rating: 4.5, reviews: 734, badge: 'Deal', tags: ['deal', 'seasonal'], glyph: 'tv', options: ['55"', '65"'],
    description: '4K HDR with Dolby Vision, 120 Hz gaming mode and built-in streaming apps.',
  },
  {
    sku: 'EL-1008', slug: 'airlite-wireless-earbuds', name: 'AirLite Wireless Earbuds', category: 'electronics', brand: 'Nova Audio', price: 129, compareAt: 0, rating: 4.2, reviews: 980, badge: 'New', tags: ['new'], glyph: 'earbuds', options: ['White', 'Black'],
    description: 'Feather-light earbuds with active noise cancelling and 30 hours of total battery.',
  },
  {
    sku: 'FA-2001', slug: 'summit-puffer-jacket', name: 'Summit Puffer Jacket', category: 'fashion', brand: 'Northline', price: 179, compareAt: 229, rating: 4.6, reviews: 421, badge: 'Seasonal', tags: ['seasonal', 'deal'], glyph: 'jacket', options: ['Black', 'Olive', 'Burgundy'],
    description: 'Recycled down-alternative insulation, water-repellent shell and packable hood.',
  },
  {
    sku: 'FA-2002', slug: 'riviera-linen-dress', name: 'Riviera Linen Dress', category: 'fashion', brand: 'Maison Lune', price: 89, compareAt: 0, rating: 4.5, reviews: 212, badge: 'New', tags: ['new'], glyph: 'dress', options: ['Sand', 'Terracotta', 'Navy'],
    description: 'Breathable European linen midi dress with adjustable straps and side pockets.',
  },
  {
    sku: 'FA-2003', slug: 'trailblazer-running-sneakers', name: 'Trailblazer Running Sneakers', category: 'fashion', brand: 'Stride', price: 119, compareAt: 0, rating: 4.7, reviews: 1630, badge: 'Best Seller', tags: ['best-seller'], glyph: 'sneaker', options: ['Grey/Volt', 'Black', 'White'],
    description: 'Responsive foam midsole and breathable knit upper for daily miles.',
  },
  {
    sku: 'FA-2004', slug: 'coastline-polarized-sunglasses', name: 'Coastline Polarized Sunglasses', category: 'fashion', brand: 'Solace', price: 69, compareAt: 89, rating: 4.4, reviews: 318, badge: 'Sale', tags: ['deal', 'seasonal'], glyph: 'sunglasses', options: ['Tortoise', 'Black'],
    description: 'Polarized UV400 lenses in a lightweight bio-acetate frame.',
  },
  {
    sku: 'FA-2005', slug: 'everyday-organic-hoodie', name: 'Everyday Organic Hoodie', category: 'fashion', brand: 'Northline', price: 59, compareAt: 0, rating: 4.6, reviews: 874, badge: '', tags: ['best-seller'], glyph: 'hoodie', options: ['Heather Grey', 'Forest', 'Black'],
    description: 'Brushed organic cotton fleece with a relaxed fit.',
  },
  {
    sku: 'FA-2006', slug: 'weekender-canvas-tote', name: 'Weekender Canvas Tote', category: 'fashion', brand: 'Maison Lune', price: 59, compareAt: 0, rating: 4.3, reviews: 190, badge: '', tags: ['seasonal'], glyph: 'bag', options: ['Natural', 'Black'],
    description: 'Heavyweight canvas tote with leather handles and an inner zip pocket.',
  },
  {
    sku: 'FA-2007', slug: 'heritage-leather-boots', name: 'Heritage Leather Boots', category: 'fashion', brand: 'Stride', price: 189, compareAt: 239, rating: 4.8, reviews: 267, badge: 'Sale', tags: ['deal', 'seasonal'], glyph: 'boot', options: ['Brown', 'Black'],
    description: 'Full-grain leather Chelsea boots with a Goodyear-welted sole.',
  },
  {
    sku: 'FA-2008', slug: 'metro-commuter-backpack', name: 'Metro Commuter Backpack', category: 'fashion', brand: 'Northline', price: 99, compareAt: 0, rating: 4.5, reviews: 503, badge: 'New', tags: ['new'], glyph: 'backpack', options: ['Charcoal', 'Navy'],
    description: 'Weatherproof 22 L backpack with a padded 16" laptop sleeve.',
  },
  {
    sku: 'HA-3001', slug: 'vortex-pro-blender', name: 'Vortex Pro Blender', category: 'home-appliances', brand: 'KitchenCraft', price: 129, compareAt: 159, rating: 4.6, reviews: 702, badge: 'Sale', tags: ['deal', 'best-seller'], glyph: 'blender', options: ['Steel', 'Black'],
    description: '1400 W motor, 6 presets and a 2 L BPA-free jar. Self-cleaning in 60 seconds.',
  },
  {
    sku: 'HA-3002', slug: 'cyclone-cordless-vacuum', name: 'Cyclone Cordless Vacuum', category: 'home-appliances', brand: 'AirHome', price: 349, compareAt: 429, rating: 4.7, reviews: 1120, badge: 'Best Seller', tags: ['best-seller', 'deal'], glyph: 'vacuum', options: ['Purple', 'Grey'],
    description: 'Powerful cyclonic suction, 60-minute runtime and a laser dust detector.',
  },
  {
    sku: 'HA-3003', slug: 'barista-touch-espresso-machine', name: 'Barista Touch Espresso Machine', category: 'home-appliances', brand: 'KitchenCraft', price: 499, compareAt: 0, rating: 4.8, reviews: 389, badge: 'New', tags: ['new', 'seasonal'], glyph: 'coffee', options: ['Brushed Steel', 'Black Truffle'],
    description: 'Touchscreen espresso machine with integrated grinder and automatic milk texturing.',
  },
  {
    sku: 'HA-3004', slug: 'crispair-xl-air-fryer', name: 'CrispAir XL Air Fryer', category: 'home-appliances', brand: 'AirHome', price: 119, compareAt: 149, rating: 4.5, reviews: 1890, badge: 'Deal', tags: ['deal', 'best-seller'], glyph: 'airfryer', options: ['Black', 'White'],
    description: '5.8 L basket, 8 presets and 75% less oil than deep frying.',
  },
  {
    sku: 'HA-3005', slug: 'pour-over-smart-kettle', name: 'Pour-Over Smart Kettle', category: 'home-appliances', brand: 'KitchenCraft', price: 79, compareAt: 0, rating: 4.4, reviews: 276, badge: '', tags: ['seasonal'], glyph: 'kettle', options: ['Matte Black', 'Copper'],
    description: 'Gooseneck spout, precise temperature control and keep-warm mode.',
  },
  {
    sku: 'HA-3006', slug: 'freshload-front-load-washer', name: 'FreshLoad Front-Load Washer', category: 'home-appliances', brand: 'AirHome', price: 899, compareAt: 1049, rating: 4.3, reviews: 158, badge: 'Sale', tags: ['deal'], glyph: 'washer', options: ['White', 'Graphite'],
    description: '9 kg capacity, steam refresh and an A-rated energy profile.',
  },
  {
    sku: 'HA-3007', slug: 'purebreeze-air-purifier', name: 'PureBreeze Air Purifier', category: 'home-appliances', brand: 'AirHome', price: 229, compareAt: 0, rating: 4.6, reviews: 447, badge: 'New', tags: ['new', 'seasonal'], glyph: 'purifier', options: ['White'],
    description: 'True HEPA H13 filtration for rooms up to 60 m² with live air-quality display.',
  },
  {
    sku: 'HA-3008', slug: 'bakemaster-stand-mixer', name: 'BakeMaster Stand Mixer', category: 'home-appliances', brand: 'KitchenCraft', price: 379, compareAt: 0, rating: 4.9, reviews: 612, badge: '', tags: ['best-seller', 'seasonal'], glyph: 'mixer', options: ['Cherry Red', 'Cream', 'Slate'],
    description: '5.5 L stainless bowl, 10 speeds and a planetary mixing action.',
  },
];

export const bySku = (sku) => PRODUCTS.find((p) => p.sku === sku);
export const byTag = (tag) => PRODUCTS.filter((p) => p.tags.includes(tag));
export const byCategory = (category) => PRODUCTS.filter((p) => p.category === category);
