# 7. Personalization Strategy

## Principles

1. **Author every experience in AEM.** Each experience is a normal section in Universal Editor, so
   content stays authorable, accessible, SEO-friendly and previewable without Target.
2. **One location = one decision.** Sections that share a **Target Location** are alternative
   experiences. Exactly one renders (or none, if no experience qualifies and there is no default).
3. **Always provide a default** unless the experience is purely additive (e.g. cart abandoner reminder).
4. **No flicker.** In simulator mode the decision runs in the eager phase before the first section is
   loaded. In Target mode only the default experience renders and Target swaps content in place.
5. **Measure everything.** Every rendered experience pushes `propositionDisplay`; every click inside
   it carries `personalizationVariant` and `targetLocation`.

## How the runtime decides (simulator mode)

```
startVisit() -> profile + session
getAudiences(cart) -> ["returning-visitors", "electronics-shoppers", ...]
for each Target Location (sections in DOM order):
  QA override (?aep-preview=location:experience)  -> that experience
  Activity Type ab | mvt                            -> hash(visitorId + activity + location) % n (sticky)
  Activity Type xt | recs                           -> first section whose Audience matches, else "default"
remove the other sections, set data-aep-variant="ACTIVITY:Experience"
```

The **order of sections is the priority**: put the most specific audience first (e.g. logged-in, then
returning, then default).

## Modes

| Mode | Set with | Behaviour | Use for |
| --- | --- | --- | --- |
| `simulator` (default) | page property **Personalization mode** or `?aep-mode=simulator` | Local rules pick the experience | Training without a Target licence, QA of content, demos |
| `target` | page property or `?aep-mode=target` | Default experience renders; after Adobe Tags loads, `alloy('sendEvent', { decisionScopes })` requests every location and HTML offers replace the section content; display notifications sent | Real Adobe Target XT/AB/MVT/Recommendations activities |

In Universal Editor all experiences are shown with a dashed outline and a "Target: location /
experience" label so authors can edit every variant.

## Use cases

### Home page
| Use case | Location | Rule | Experience |
| --- | --- | --- | --- |
| Returning Visitor Hero Banner | `home-hero` | `returning-visitors` | "Welcome back! Pick up where you left off" |
| New Visitor Hero Banner | `home-hero` | `new-visitors` / default | WELCOME15 first-order hero |
| Member hero (extension) | `home-hero` | `logged-in-users` (first priority) | Double points week |
| Personalized CTA | `home-cta` | `electronics-shoppers` / `fashion-shoppers` / default | Category-specific CTA vs. Rewards CTA |
| Cart reminder | `home-cart-reminder` | `cart-abandoners` (no default) | Banner with SAVE10 |
| Banner A/B | `home-promo` | 50/50 | Flash sale copy A vs. B |

### Product pages
| Use case | Location | Activity | Production setup |
| --- | --- | --- | --- |
| Recommended Products | `pdp-recommendations` | RECS-PDP-SIMILAR | Recommendations criteria "People who viewed this, viewed that", key = `entity.id` (productId) |
| Recently Viewed Products | `pdp-recently-viewed` | RECS-RECENTLY-VIEWED | Criteria "Recently viewed items" (profile); local version reads `profile.recentlyViewed` |
| Cross-Sell Recommendations | `pdp-cross-sell` | RECS-PDP-CROSS-SELL | Criteria "People who bought this, bought that", key = `entity.id` |
| Trust messaging test | `pdp-trust` | AB-PDP-TRUST | A/B, goal `cartAdd` |

For Target Recommendations, pass entity attributes from the data layer on the PDP:
`entity.id = product.productId`, `entity.name`, `entity.categoryId = product.category`,
`entity.value = product.price`, `entity.brand`, `entity.thumbnailUrl`, `entity.pageUrl`.

### Category pages
| Use case | Location | Rule |
| --- | --- | --- |
| Location-Based Promotions | `<category>-geo-promo` | `geo-us-west`, `geo-us-east`, `geo-europe`, default (Target: `geo.region`, `geo.country`) |
| Audience-Specific Offers | `<category>-offer` | VIP / member / first-order / affinity offers in priority order |

### Cart
| Use case | Location | Rule |
| --- | --- | --- |
| Discount Banner for High Cart Value | `cart-offer` | `high-cart-value` (subtotal >= $300) -> VIP20; default -> "spend $300" incentive |
| Personalized Coupon Offer | `cart-coupon` | `cart-abandoners` -> SAVE10, `new-visitors` -> WELCOME15, nobody else |

### Membership
| Use case | Location | Rule |
| --- | --- | --- |
| Premium User Messaging | `membership-hero` | `premium-members` -> Gold benefits hero; default -> join hero |
| New User Enrollment Banner | `membership-enroll` | `new-visitors` -> 500 bonus points; `non-members` -> join today; members -> none |

## Activity types used

| Type | Count | Examples | Notes |
| --- | --- | --- | --- |
| Experience Targeting (XT) | 27 activities / 32 locations | home hero, geo promos, cart offers | Audience -> experience, first match wins |
| A/B Test | 5 activities | AB-HOME-PROMO, AB-PDP-TRUST, AB-CHECKOUT-TRUST, AB-ABOUT-CTA, AB-BLOG-CTA | Even split, sticky by visitor; use A4T for reporting |
| Multivariate Test | 1 activity / 2 locations | MVT-DEALS | `deals-headline` x `deals-banner`, 4 combinations; full factorial |
| Recommendations | 5 activities / 6 locations | RECS-PDP-SIMILAR, RECS-PDP-CROSS-SELL, RECS-RECENTLY-VIEWED, RECS-USER-AFFINITY, RECS-CART-CROSS-SELL | Authored products are the fallback/backup recommendations |

The full list with experiences, goals and KPIs is in [05-target-activity-matrix.md](05-target-activity-matrix.md).

## Reporting

- **A4T (Analytics for Target):** enable in each activity; the Web SDK sends the
  `_experience.decisioning` data with the page view, so Analytics segments and metrics (orders,
  revenue, cartAdd) can be used as goals.
- **eVar21 personalizationVariant** (list variable, `|` delimited) is set from the data layer on every
  page view and from `eventInfo.personalizationVariant` on clicks: report CTR per experience even in
  simulator mode.
- Success metrics per page are listed in the page inventory; activity primary KPIs in the activity matrix.

## Guardrails

- Flicker: Target mode keeps the default visible; use prehiding only for the hero location and with a
  timeout below 3 s.
- Performance: no personalization script is loaded before LCP; Adobe Tags loads in the delayed phase.
- Privacy: run personalization only after consent (`getConsent('personalization')` in production).
- Content: keep experiences structurally similar (same block) to avoid layout shift.
