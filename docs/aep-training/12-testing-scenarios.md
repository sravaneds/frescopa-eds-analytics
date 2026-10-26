# 12. Testing Scenarios

Run on the local preview or `aem.page`. Open the debug panel with `?aep-debug=1` (event log,
audiences, propositions) and reset the profile before each scenario (footer "Reset demo profile").
In production, verify beacons with Adobe Experience Platform Debugger and Assurance.

## A. Data layer & page tracking

| # | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| A1 | Page view on every page | Open each of the 30 pages | `pageView` with correct `pageType`; `adobeDataLayer.getState().page.pageName` = `novamart:<path>` |
| A2 | State objects present | Console: `adobeDataLayer.getState()` | `page`, `user`, `product`, `cart`, `campaign`, `personalization` exist |
| A3 | Campaign capture | Open `/?cid=EM-FALL-2026&utm_source=newsletter&utm_medium=email` | `campaign.campaignId = EM-FALL-2026`, `source = newsletter` |
| A4 | Scroll depth | Scroll home to the footer | `scrollDepth` 25, 50, 75, 90, 100 once each |
| A5 | 404 | Open `/aep-training/unknown` and `/aep-training/404` | `errorPageView` with `requestedUrl` |
| A6 | SEO | View source / Rich Results test on home, PDP, FAQ, article | Organization+WebSite, Product, FAQPage, BlogPosting, BreadcrumbList JSON-LD |

## B. Home page

| # | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| B1 | Hero click | Click "Shop now" | `heroClick` with `CTAName = Shop now`, `targetLocation = home-hero`, `personalizationVariant` |
| B2 | CTA click | Click the Rewards/affinity CTA button | `ctaClick` with `component = cta` |
| B3 | Product carousel | Click arrows, then a product | `carouselNavigate` (action next), `productCarouselClick` with productId, listName `trending-now`, position |
| B4 | Banner | Scroll to the flash sale banner, click it, copy code | `bannerImpression`, `bannerClick` with campaignId `CMP-FLASH-A`/`B`, `couponCopy` |

## C. Category / listing

| # | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| C1 | Category view | Open Electronics | `categoryView` (category electronics), profile categoryViews +1 |
| C2 | Filter usage | Change Brand, Price, On sale, Sort, Clear | `filterApply` (filterType/filterValue/resultCount), `sortApply`, `filterClear` |
| C3 | Search usage | Type "pro" in the grid search | `searchSubmit` SearchTerm `pro`, resultCount > 0 |
| C4 | Null search | Search "zzz" | `searchNoResults`, empty-state message announced |
| C5 | Header search | Search "jacket" in header | `searchSubmit` (searchType header) then product listing with `searchResultsView` |
| C6 | Product click | Click a product card | `productClick` with productId, productName, listName, position |

## D. Product detail page

| # | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| D1 | Product view | Open Nova Pro headphones | `productView`, `product` state, Product JSON-LD, recentlyViewed updated |
| D2 | Gallery | Click thumbnail 2, click main image | `galleryInteraction` action thumbnail (imageIndex 2), zoom-in |
| D3 | Tabs | Click "Specifications", use arrow keys | `tabClick` tabName, keyboard navigation works |
| D4 | Add to cart | Quantity 2, Add to cart | `cartOpen` (first item), `cartAdd` quantity 2 source pdp, header badge 2 |
| D5 | Wishlist | Click "Add to wishlist" | `wishlistAdd` source pdp, button pressed state |
| D6 | Reviews | Click the rating link | `reviewsClick`, page scrolls to Customer reviews |
| D7 | Recommendations | Scroll to "Customers also viewed", click product | `recommendationImpression`, `recommendationClick` |

## E. Cart

| # | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| E1 | Cart view | Open cart with items | `cartView` itemCount/subtotal |
| E2 | Cart additions | Click + | `cartAdd` source cart-quantity |
| E3 | Cart removals | Click − to 0 or Remove | `cartRemove` |
| E4 | Coupon invalid | Apply `BOGUS` | `couponApply` couponStatus invalid, error message |
| E5 | Coupon valid | Apply `SAVE10` | `couponApply` success, discountAmount > 0, total updated |
| E6 | VIP threshold | Subtotal < $300, apply `VIP20` | invalid with minimum message |

## F. Checkout

| # | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| F1 | Checkout start | Open checkout with items | `checkoutStart` with products |
| F2 | Steps | Focus address, change shipping, change payment | `checkoutStep` 1-3 once each |
| F3 | Shipping selection | Select Express | `shippingSelect` express, 14.99; summary updates |
| F4 | Payment selection | Select PayPal | `paymentSelect` paypal |
| F5 | Validation | Clear ZIP, Place order | `checkoutError` field zip, focus on field |
| F6 | Completion | Place order | `checkoutComplete` orderId, revenue, products; redirect to confirmation; `orderConfirmationView` (purchase counted once) |

## G. Blog

| # | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| G1 | Article view | Open an article | `articleView` with title, author, category |
| G2 | Reading time | Stay 60 s, scroll | `readingTime` 15s, 30s, 60s with percentRead; exit milestone on leave |
| G3 | CTA interaction | Click the article CTA | `ctaClick` with `personalizationVariant = AB-BLOG-CTA:A` or `B` |

## H. Personalization (simulator)

| # | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| H1 | New visitor hero | Reset profile, open home | Hero "Tech, style and home", `propositionDisplay` XT-HOME-HERO:New Visitor Hero |
| H2 | Returning visitor hero | New browser session (or `?aep-audience=returning-visitors`) | "Welcome back" hero |
| H3 | Logged-in hero | My Account > Sign in, go home | Member hero; header shows "Hi, Alex" |
| H4 | Personalized CTA | View 3 electronics products, go home | Electronics CTA in `home-cta` |
| H5 | Location-based promo | `?aep-audience=geo-europe` on Electronics | "Now shipping to Europe" banner |
| H6 | Audience-specific offer | `?aep-audience=high-value-customers` on Electronics | VIP offer with VIP20 |
| H7 | High cart value | Cart subtotal >= $300, reload cart | "You have unlocked 20% off" banner |
| H8 | Personalized coupon | `?aep-audience=cart-abandoners` on cart | SAVE10 welcome back banner; home shows cart reminder |
| H9 | Premium messaging | Sign in, then Join Rewards on Membership | Gold benefits hero (`premium-members`) |
| H10 | Enrollment banner | Reset, open Membership | "New here? Get 500 bonus points"; click -> `membershipEnroll` |
| H11 | A/B stickiness | Reload home 5 times | same `home-promo` experience each time |
| H12 | MVT | Visit Deals with 4 different profiles | combinations A/A, A/B, B/A, B/B appear |
| H13 | QA preview | `?aep-preview=home-hero:Returning Visitor Hero` | that experience regardless of audience |
| H14 | Recently viewed | View 2 products, open a third | "Recently viewed" shows the first two |
| H15 | UE authoring | Open a page in Universal Editor | all experiences visible with dashed outline and label |

## I. Adobe Target / Web SDK (with a Tags property)

| # | Scenario | Expected |
| --- | --- | --- |
| I1 | `localStorage.setItem('aep:launch-url', '<embed>')`, reload | Tags loads in delayed phase; non-adobedtm URLs are ignored |
| I2 | `?aep-mode=target` | defaults render; `sendEvent` with `decisionScopes` (all locations) in Assurance |
| I3 | HTML offer for `home-hero` | content replaced, `propositionDisplay` source adobe-target, display notification sent |
| I4 | A4T | Analytics hit contains Target activity/experience; report in Analytics for Target panel |

## J. Accessibility, responsive & performance

| # | Scenario | Expected |
| --- | --- | --- |
| J1 | Keyboard only | Skip link, menu, submenus (Escape closes), tabs (arrows), carousel (arrows), filters, checkout reachable and visible focus |
| J2 | Screen reader | Product cards announce name, rating "out of 5", price "Was"; status messages (cart, search counts) are live regions |
| J3 | Mobile 375 px | hamburger menu, grids 2 columns, no horizontal scroll |
| J4 | Lighthouse | Performance >= 90 (target 100), Accessibility 100, SEO 100 on home, category, PDP |
| J5 | Personalization does not delay LCP | No network request before first section; hero image is LCP |

## Smoke test result (local preview)

All 30 core pages were opened in a headless browser. Each one: renders a single H1, loads every
block, raises no JavaScript errors, has alt text on all images, and reports its selected Target
experience. The full shopping journey (PDP > cart > coupon > checkout > confirmation) produces the
expected event sequence.
