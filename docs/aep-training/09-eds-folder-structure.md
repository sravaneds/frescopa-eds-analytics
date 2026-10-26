# 9. EDS Folder Structure

Only the files added or changed for the AEP training site are annotated; everything else is the
existing commerce boilerplate (Frescopa).

```
repo/
├── 404.html                         # (changed) training 404s use the aep-training template + errorPageView
├── paths.json                       # (changed) /content/aep-training/ -> /aep-training/, DAM include
├── .hlxignore                       # (changed) docs/ and tools/aep-training/ are not served
├── component-definition.json        # (built) npm run build:json
├── component-models.json            # (built)
├── component-filters.json           # (built)
├── models/
│   ├── _component-definition.json   # (changed) "AEP Training" block group
│   ├── _page.json                   # (changed) template, page-type, category, product-*, campaign, personalization mode ...
│   └── _section.json                # (changed) Target Location, Audience, Activity, Activity Type, Experience, Campaign ID + styles
├── templates/
│   └── aep-training/
│       ├── aep-training.css         # NovaMart design tokens, sections, footer, UE variant labels
│       └── aep-training.js          # eager hook -> scripts/aep/index.js initEager()
├── scripts/
│   ├── scripts.js                   # (changed) registers the template, lazy hook initLazy()
│   ├── delayed.js                   # (changed) delayed hook initDelayed() (Adobe Tags + Target)
│   └── aep/                         # analytics & personalization runtime
│       ├── index.js                 # orchestration per loading phase
│       ├── datalayer.js             # ACDL helpers, page/user/product/campaign builders, pushEvent()
│       ├── profile.js               # visitor profile, 10 audiences + conditions, QA overrides
│       ├── personalization.js       # Target location selection, propositionDisplay, Web SDK decisions
│       ├── tracking.js              # click, scroll depth, reading time, impressions, #aep: actions
│       ├── store.js                 # demo cart, coupons, wishlist, orders, checkout
│       ├── product-card.js          # shared product model + card renderer
│       ├── seo.js                   # JSON-LD (Organization, WebSite, Breadcrumbs, BlogPosting)
│       ├── debug-panel.js/.css      # ?aep-debug=1 trainee panel
├── styles/
│   └── product-card.css             # shared product card styles
├── blocks/
│   ├── header/header-aep.js/.css    # NovaMart header (brand | sections | tools, search, cart badge)
│   ├── hero/ cards/ columns/ teaser/   # existing blocks, reused
│   ├── tabs/                        # new  - tabs (ARIA tablist) + tabClick
│   ├── carousel/                    # new  - slides / gallery variant + galleryInteraction
│   ├── accordion/                   # new  - details/summary + accordionToggle
│   ├── cta/                         # new  - call to action (dark, accent, image)
│   ├── faq/                         # new  - FAQPage JSON-LD, searchable, helpful feedback
│   ├── banner/                      # new  - promo banner, coupon copy, campaign id, dismissible
│   ├── product-grid/                # new  - filters, sort, keyword search, product cards
│   ├── product-carousel/            # new  - authored, recommendations, recently-viewed
│   ├── testimonials/                # new  - reviews with rating
│   ├── search/                      # new  - products / content / stores scope
│   ├── product-info/                # new  - PDP buy box, gallery, options, Product JSON-LD
│   ├── cart/                        # new  - demo cart, quantity, coupon, free-shipping meter
│   ├── checkout/                    # new  - shipping/payment selection, place order
│   ├── wishlist/                    # new  - saved products
│   └── orders/                      # new  - history / confirmation / tracking variants
│       └── each block: <name>.js, <name>.css, _<name>.json (Universal Editor definition/model/filter)
├── tools/aep-training/              # page spec + generator (not served)
│   ├── catalog.mjs                  # 24 demo products
│   ├── common.mjs                   # shared content, scenes, Target activity catalogue
│   ├── pages-a.mjs / pages-b.mjs    # the 30 page definitions (+ product/article templates)
│   ├── events.mjs                   # event dictionary (Analytics + XDM mapping)
│   ├── html.mjs / images.mjs        # markup + SVG helpers
│   ├── generate.mjs                 # writes content, assets, manifest.json and generated docs, validates
│   ├── build-package.mjs            # converts the pages into an AEM content package (Universal Editor JCR)
│   └── assets/                      # JPEG/PNG renders of the SVG illustrations (DAM assets in the package)
├── packages/aep-training-content/   # AEM content package (not served)
│   ├── aep-training-content-1.0.1.zip
│   └── README.md                    # install and verification steps
└── docs/aep-training/               # the 12 deliverables (not served)
```

## Content (local preview / AEM site)

```
content/
├── aep-training/                    # AEM site path /content/aep-training
│   ├── index.plain.html             # 01 Home
│   ├── shop, electronics, fashion, home-appliances, products ...   # one .plain.html per page
│   ├── products/<slug>.plain.html   # 07 Product Details + 23 more product instances
│   ├── blog/<slug>.plain.html       # 23 Blog Details + 2 more article instances
│   ├── account/orders, account/track-order
│   ├── nav.plain.html               # header fragment
│   └── footer.plain.html            # footer fragment
└── dam/aep-training/images/         # mirrors /content/dam/aep-training in AEM Assets
    ├── products/<slug>(-2|-3).svg
    ├── scenes/*.svg                  # hero, tile and blog illustrations
    ├── avatars/*.svg
    └── brand/novamart-logo.svg
```

Regenerate everything with `node tools/aep-training/generate.mjs` (this overwrites local edits to
the generated pages).

## Conventions

- Blocks are self-contained (`blocks/<name>/<name>.{js,css}`), selectors scoped to the block, mobile
  first with `min-width` 600/900/1200 px media queries.
- Analytics code lives in `scripts/aep`; blocks only call `pushEvent()` or set `data-track*`
  attributes, so tracking rules stay in one place.
- Everything training-specific is activated by the page template `aep-training`; other site pages are
  unaffected.
