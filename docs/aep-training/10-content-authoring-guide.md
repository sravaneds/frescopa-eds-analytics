# 10. Content Authoring Guide

For authors building or changing the NovaMart training site in **Universal Editor** (AEM Sites,
site `/content/aep-training`).

## 1. Create a page

1. In Sites, select `/content/aep-training` (or a subfolder) > **Create > Page**.
2. Open **Page Properties** and fill in:

| Field | Required | Example | Used for |
| --- | --- | --- | --- |
| Title | yes | `Electronics \| NovaMart` | `<title>`, `og:title`, SEO |
| Description | yes | 140-160 characters | meta description, SEO |
| Image | recommended | DAM image | `og:image` social share |
| Template | **yes** | `AEP Training` | turns on NovaMart design, data layer, tracking, personalization |
| Page type | **yes** | `category` | `page.pageType`, page-specific events (categoryView, articleView ...) |
| Site section | yes | `shop` | `page.siteSection` (Analytics channel) |
| Category | category/PDP/articles | `electronics` | `page.category`, category affinity audiences |
| Page name override | no | `novamart:electronics` | default is `novamart:<path>` |
| Product ID / name / brand / price | PDP only | `EL-1001` | `product.*`, Target Recommendations entity |
| Default campaign ID | no | `CMP-FALL-2026` | `campaign.campaignId` when no `cid` in the URL |
| Personalization mode | no | `Simulator` | `Adobe Target (Web SDK)` once real activities exist |
| Author / Published date | articles | `Jordan Lee`, `2026-10-12` | articleView, BlogPosting JSON-LD |
| Robots | cart, checkout, account, 404 | `noindex, follow` | SEO |
| Navigation / Footer fragment path | yes | `/content/aep-training/nav` | NovaMart header & footer |

Tip: set Template, Nav, Footer and Launch URL once for the whole site with **bulk metadata**
(`metadata` sheet mapped in `paths.json`) instead of on every page.

## 2. Sections

Every page is a stack of sections. **Section properties**:

| Field | Values | Effect |
| --- | --- | --- |
| Style | Highlight, Dark, Accent, Centered, Narrow, Full Width, Article | background and layout |
| Target Location | e.g. `home-hero` | marks the section as an experience of a Target location |
| Audience | `new-visitors`, `returning-visitors`, `logged-in-users`, `high-value-customers`, `frequent-buyers`, `electronics-shoppers`, `fashion-shoppers`, `cart-abandoners`, `blog-readers`, `high-cart-value`, `premium-members`, `non-members`, `first-time-buyers`, `geo-us-west`, `geo-us-east`, `geo-europe`, `default` | who qualifies (comma separated = any) |
| Activity | e.g. `XT-HOME-HERO` | activity id reported in the data layer |
| Activity type | XT, A/B, MVT, Recommendations | selection logic |
| Experience | e.g. `Returning Visitor Hero`, `A`, `B` | experience name in reports and QA links |
| Campaign ID | e.g. `CMP-FLASH-A` | added to every click in the section |

### Authoring a personalized hero (example)

1. Add three sections at the top of the page, each with a **Hero** block.
2. Give all three **Target Location** `home-hero` and **Activity** `XT-HOME-HERO`, type **XT**.
3. Audiences in priority order: section 1 `logged-in-users`, section 2 `returning-visitors`,
   section 3 `new-visitors,default`.
4. Preview each experience with `?aep-preview=home-hero:Returning Visitor Hero` or the debug panel.

### Authoring an A/B test

Two sections, same Target Location, **Activity type** `A/B`, Experience `A` and `B`, no audience.
Each visitor gets a sticky experience.

## 3. Blocks

| Block | What to author | Tips |
| --- | --- | --- |
| Hero | Image + alt, rich text with H1, text and 1-2 links (bold = primary, italic = secondary button) | one H1 per page; the first section's image is the LCP image |
| Banner | Image (optional), text, coupon code, campaign ID; styles Alert / Dark / Dismissible | coupon code adds a "Copy code" button (couponCopy) |
| CTA | Text (heading, copy, buttons), optional image; styles Dark / Accent | use for every conversion-oriented message |
| Cards | Image + rich text per card | add a link in each card so clicks are tracked |
| Columns | Rich text per column | trust badges, contact channels, tiers |
| Tabs | Label + content per tab | tabClick reports the label |
| Accordion | Label + body | accordionToggle |
| FAQ | Question + answer; option Searchable | generates FAQPage structured data |
| Carousel | Image, alt, text per slide; style Product image gallery | keep slides <= 6 |
| Testimonials | Photo, quote, name, role, rating | social proof |
| Search | Placeholder, scope (Products, Page content, Stores), popular terms | Products scope opens the product listing with `?q=` |
| Product Grid | Product items (image, name, **SKU**, price, compare-at price, category, brand, rating, badge, product page); option filters | SKU = analytics productId, never change it |
| Product Carousel | Product items; source Authored / Recommendations / Recently viewed | recently viewed ignores authored items when the visitor has history |
| Product Info (PDP) | Gallery images, name, SKU, price, compare-at, brand, category, rating, review count, description, colour options | must match the page properties product fields |
| Cart, Checkout, Wishlist, Orders | Optional intro / empty-state text; Orders view (history, confirmation, tracking) | data comes from the demo store |

## 4. Links and action links

- Internal links: pick the page (`/content/aep-training/...`); paths are mapped to `/aep-training/...` on publish.
- Demo actions are normal links with these targets:

| Link | Action | Event |
| --- | --- | --- |
| `#aep:sign-in` | sign in as demo customer Alex Morgan (gold) | loginComplete |
| `#aep:sign-out` | sign out | logout |
| `#aep:enroll` | join Rewards | membershipEnroll |
| `#aep:reset-profile` | clear profile, cart, wishlist, orders | profileReset |

## 5. Accessibility and SEO checklist

- One H1 per page; headings in order (H2 for section titles, H3 inside cards).
- Alt text on every informative image; leave alt empty only for decoration.
- Link text must describe the destination ("Shop electronics", not "Click here").
- Unique title and description per page; `noindex` for cart, checkout, account, wishlist, 404.
- Keep coupon codes in text, not only in images.

## 6. Publish

1. Preview (Universal Editor > Publish > Preview) and check `aem.page` with `?aep-debug=1`.
2. Publish to Live. The query index adds the page to `sitemap.json` / `sitemap-content.xml`.

## 7. Local preview (training workspace)

The local workspace pages are generated from `tools/aep-training/` with
`node tools/aep-training/generate.mjs`. Edits made directly to `content/aep-training/*.plain.html`
are local only and are overwritten when the generator runs again.
