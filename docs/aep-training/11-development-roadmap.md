# 11. Development Roadmap

## Phase 0 - Done in this repository (foundation)

| Item | Status |
| --- | --- |
| 30 pages + 23 product and 2 article template instances (local preview) | done |
| 15 blocks (10 new list blocks + 5 commerce demo blocks), header, template | done |
| Universal Editor models (block, page, section properties) | done |
| ACDL data layer (page, user, product, cart, campaign, personalization) | done |
| 60+ tracked events, scroll depth, reading time, impressions | done |
| 10 audiences + conditions, Target simulator (XT, A/B, MVT, Recs), QA overrides | done |
| Web SDK decision scope hook (`personalization-mode = target`) | done |
| JSON-LD (Organization, WebSite, Breadcrumb, Product, FAQPage, BlogPosting) | done |
| Debug panel, generator with validation, 12 docs | done |

## Phase 1 - Platform setup (week 1)

1. Install the content package `packages/aep-training-content/aep-training-content-1.0.2.zip`
   (pages under `/content/aep-training`, images under `/content/dam/aep-training/images`), then
   check the site's cloud configuration and reprocess the assets. See
   `packages/aep-training-content/README.md`.
2. Push the code branch, verify `https://<branch>--frescopa-eds-analytics--sravaneds.aem.page/` (the site is published at the root).
3. Bulk metadata: `template = aep-training`, `nav`, `footer`, `launch-url` for `/aep-training/**`.
4. Run PageSpeed Insights on home, category, PDP (target 100) and fix regressions.

## Phase 2 - Adobe Experience Platform & Web SDK (week 2)

1. AEP: schema `NovaMart Web` (XDM ExperienceEvent + Commerce, Web, Environment, Implementation
   Details field groups + tenant field group `_novamart`); dataset; datastream with Analytics, Target
   and AEP services.
2. Identity: ECID + CRM ID (`customerId`) namespace, `identityMap` on loginComplete.
3. Adobe Tags property: ACDL extension, Web SDK extension; one rule per event in the tracking matrix;
   data elements for `page.*`, `user.*`, `product.*`, `cart.*`, `campaign.*`, `personalization.*`.
4. Set the embed in bulk metadata `launch-url` (dev environment) or per trainee with
   `localStorage.setItem('aep:launch-url', '<assets.adobedtm.com embed>')`.

## Phase 3 - Adobe Analytics (week 2-3)

1. Report suite variables per [04-analytics-tracking-matrix.md](04-analytics-tracking-matrix.md)
   (eVars 1-61, props, events 10-69, merchandising eVars 11-14).
2. Processing rules or Data Prep mapping from XDM to eVars.
3. Workspace projects: Commerce funnel (prodView > scAdd > scCheckout > purchase), Search
   (null search rate), Content (reading time, scroll depth), Personalization (eVar21 x conversion).
4. Segments mirroring the 10 audiences.

## Phase 4 - Adobe Target (week 3-4)

1. Create audiences ([06-audience-strategy.md](06-audience-strategy.md)) using profile parameters
   sent from the data layer.
2. Recreate activities from [05-target-activity-matrix.md](05-target-activity-matrix.md); use the
   Target Location as decision scope; switch pages to `personalization-mode = target`.
3. Recommendations: product feed from `tools/aep-training/catalog.mjs` (export to CSV), entity
   attributes on PDP, criteria per activity, design rendering into the Product Carousel markup.
4. A4T for all A/B and MVT activities.

## Phase 5 - Real-Time CDP & journeys (optional, week 5)

1. Streaming segments for Cart Abandoners and High Value Customers; edge segments for Target.
2. Computed attributes (category affinity, LTV) replacing the local profile logic.
3. Journey Optimizer: cart abandonment email using `cartAdd` without `checkoutComplete`.

## Backlog / enhancements

| Item | Value |
| --- | --- |
| Consent manager (OneTrust / Adobe consent) wired to `getConsent()` | privacy compliance |
| Product data from a spreadsheet/JSON (`/aep-training/products.json`) instead of authored rows | less authoring |
| Real Adobe Commerce backend via existing drop-ins | real catalogue and checkout |
| Server-side Target (edge personalization) for the hero to avoid any flicker | performance |
| Customer Journey Analytics connection | cross-channel reporting |
| Automated Playwright suite for the testing scenarios | regression safety |
| Localization (`/aep-training/fr/`) to practice multi-site report suites | advanced training |
