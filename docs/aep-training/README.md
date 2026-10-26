# NovaMart: AEP / Analytics / Target Training Site

A fictional commerce site ("NovaMart": electronics, fashion, home appliances) built on AEM Edge
Delivery Services with Universal Editor (XWalk) under **`/content/aep-training`**. It is designed for
hands-on practice of Adobe Analytics implementation, Adobe Target personalization and
experimentation, AEP Web SDK integration, audience building and commerce journey tracking.

## Deliverables

| # | Deliverable | File |
| --- | --- | --- |
| 1 | Complete sitemap | [01-sitemap.md](01-sitemap.md) |
| 2 | Page inventory (purpose, components, authoring fields, events, activities, audiences, rules, metrics) | [02-page-inventory.md](02-page-inventory.md), [page-inventory.json](page-inventory.json) |
| 3 | Block mapping | [03-block-mapping.md](03-block-mapping.md) |
| 4 | Analytics tracking matrix (+ event dictionary, required variables) | [04-analytics-tracking-matrix.md](04-analytics-tracking-matrix.md) |
| 5 | Adobe Target activity matrix (XT, A/B, MVT, Recommendations) | [05-target-activity-matrix.md](05-target-activity-matrix.md) |
| 6 | Audience strategy | [06-audience-strategy.md](06-audience-strategy.md) |
| 7 | Personalization strategy | [07-personalization-strategy.md](07-personalization-strategy.md) |
| 8 | Sample data layer | [08-sample-data-layer.md](08-sample-data-layer.md) |
| 9 | EDS folder structure | [09-eds-folder-structure.md](09-eds-folder-structure.md) |
| 10 | Content authoring guide | [10-content-authoring-guide.md](10-content-authoring-guide.md) |
| 11 | Development roadmap | [11-development-roadmap.md](11-development-roadmap.md) |
| 12 | Testing scenarios | [12-testing-scenarios.md](12-testing-scenarios.md) |

Files 01-05 and `page-inventory.json` are generated from the page spec, so they always match the
pages. Regenerate with `node tools/aep-training/generate.mjs`.

**AEM content package:** `packages/aep-training-content/aep-training-content-1.0.1.zip` contains
all pages and images for `/content/aep-training`. Install steps are in
[the package README](../../packages/aep-training-content/README.md).

## At a glance

- **30 core pages** + 23 additional product detail pages and 2 additional articles built from the
  Product Details and Blog Details templates.
- **Blocks:** Hero, Tabs, Cards, Carousel, Accordion, Columns, CTA, FAQ, Banner, Product Grid,
  Product Carousel, Teaser, Testimonials, Search + Product Info, Cart, Checkout, Wishlist, Orders.
- **Data layer:** Adobe Client Data Layer with `page`, `user`, `product`, `cart`, `campaign`,
  `personalization`; 63 documented events.
- **Personalization:** 38 activities across 45 Target locations (27 XT, 5 A/B, 1 MVT, 5
  Recommendations), at least one per page. They run locally in simulator mode and can be switched to
  Adobe Target through the Web SDK.
- **Audiences:** New, Returning, Anonymous, Logged-In, High Value, Frequent Buyers, Electronics
  Shoppers, Fashion Shoppers, Cart Abandoners, Blog Readers, plus cart value, membership and
  location conditions.

## Quick start for trainees

1. Open the home page with `?aep-debug=1`. The red **AEP Debug** button shows your audiences, the
   experiences you were given, and the live event log.
2. In the browser console: `adobeDataLayer.getState()`.
3. Shop: open a product, add it to the cart, apply `SAVE10`, check out. Watch the event sequence.
4. Change who you are:
   - **My Account > Sign in** (logged-in, gold tier)
   - close the browser (returning visitor)
   - `?aep-audience=cart-abandoners`
   - footer **Reset demo profile**
5. Connect your own Adobe Tags property:
   `localStorage.setItem('aep:launch-url', 'https://assets.adobedtm.com/.../launch-xxxx-development.min.js')`.
   Then switch a page to Target with `?aep-mode=target`.

Demo coupon codes:
- `SAVE10`: 10 % off
- `WELCOME15`: 15 % off
- `VIP20`: 20 % off orders over $300
- `FREESHIP`: free shipping
