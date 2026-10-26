# 6. Audience Strategy

The training site evaluates every audience locally (`scripts/aep/profile.js`) from a first-party
visitor profile stored in `localStorage` (`aep:profile`). The same attributes are exposed in the data
layer (`user.*`) and passed to Adobe Target as profile/mbox parameters, so each audience can be
rebuilt in **Adobe Target** (audience library), **Real-Time CDP** (segment builder) and
**Adobe Analytics** (segments) using identical rules.

## Profile attributes

| Attribute | Data layer | Updated when | Target parameter | XDM (suggested) |
| --- | --- | --- | --- | --- |
| visitorId | `user.visitorId` | first visit | (ECID in production) | `identityMap.ECID` |
| visitCount | `user.visitCount` | new browser session | `profile.visitCount` | `_novamart.user.visitCount` |
| authState | `user.authState` | `#aep:sign-in` / `#aep:sign-out` | `profile.authState` | `identityMap.CRMID[].authenticatedState` |
| customerId | `user.customerId` | sign-in | `mbox3rdPartyId` | `identityMap.CRMID` |
| loyaltyTier / member | `user.loyaltyTier`, `user.member` | sign-in, `#aep:enroll` | `profile.loyaltyTier` | `_novamart.loyalty.tier` |
| orderCount / lifetimeValue | `user.orderCount`, `user.lifetimeValue` | checkoutComplete | `profile.orderCount`, `profile.ltv` | computed attribute |
| categoryViews | (profile only) | categoryView, productView | `profile.categoryAffinity` (Target category affinity) | computed attribute |
| recentlyViewed | (profile only) | productView | `entity.id` (Recommendations) | `productListItems` history |
| articlesRead | (profile only) | articleView | `profile.articlesRead` | computed attribute |
| cartAbandoned | (profile only) | new session with non-empty cart | `profile.cartAbandoned` | streaming segment |
| audienceType | `user.audienceType` | every page | — | `_novamart.user.audienceType` |

## The 10 core audiences

| # | Audience (id) | Local rule | Adobe Target audience rule | RT-CDP / Analytics segment | Used by |
| --- | --- | --- | --- | --- | --- |
| 1 | New Visitors (`new-visitors`) | `visitCount <= 1` | Visitor Profile > New Visitor = true | Visit Number = 1 | XT-HOME-HERO, XT-CATEGORY-OFFER, XT-PLP-OFFER, XT-CART-COUPON, XT-MEMBERSHIP-ENROLL |
| 2 | Returning Visitors (`returning-visitors`) | `visitCount > 1` | Visitor Profile > Returning Visitor = true | Visit Number > 1 | XT-HOME-HERO |
| 3 | Anonymous Users (`anonymous-users`) | `!loggedIn` | `profile.authState` = anonymous | authState = anonymous | default experiences of XT-ACCOUNT, XT-WISHLIST, XT-TRACKING-HELP, XT-LEGAL |
| 4 | Logged-In Users (`logged-in-users`) | `loggedIn` | `profile.authState` = authenticated | authState = authenticated or CRM ID exists | XT-HOME-HERO, XT-ACCOUNT, XT-WISHLIST, XT-SUPPORT-PRIORITY, XT-TRACKING-HELP, XT-LEGAL, XT-CATEGORY-OFFER |
| 5 | High Value Customers (`high-value-customers`) | `lifetimeValue >= 1000` or signed-in gold/platinum | `profile.ltv >= 1000` OR `profile.loyaltyTier` in (gold, platinum) | Lifetime revenue >= $1,000 | XT-CATEGORY-OFFER, XT-SUPPORT-PRIORITY |
| 6 | Frequent Buyers (`frequent-buyers`) | `orderCount >= 3` | `profile.orderCount >= 3` | Orders (lifetime) >= 3 | XT-BESTSELLERS, XT-CONFIRMATION-NEXT, XT-ORDERS-REORDER, XT-CATEGORY-OFFER |
| 7 | Electronics Shoppers (`electronics-shoppers`) | 3+ electronics views or top category | Category Affinity = electronics | Hits with category = electronics >= 3 | XT-HOME-CTA, XT-SHOP-FEATURED, XT-NEW-ARRIVALS, XT-RECS-AFFINITY, XT-404-RECOVERY |
| 8 | Fashion Shoppers (`fashion-shoppers`) | 3+ fashion views or top category | Category Affinity = fashion | Hits with category = fashion >= 3 | XT-HOME-CTA, XT-SHOP-FEATURED, XT-NEW-ARRIVALS, XT-CATEGORY-OFFER, XT-RECS-AFFINITY, XT-404-RECOVERY |
| 9 | Cart Abandoners (`cart-abandoners`) | previous session ended with items and no order | `profile.cartAbandoned` = true (set by profile script on cartAdd without purchase) | Visits with scAdd and without purchase in last 7 days | XT-HOME-CART-REMINDER, XT-PLP-OFFER, XT-CART-COUPON, XT-CONTACT, XT-FAQ-HELP |
| 10 | Blog Readers (`blog-readers`) | `articlesRead >= 2` | `profile.articlesRead >= 2` | articleView events >= 2 | XT-BLOG-NEWSLETTER |

## Supporting conditions

Conditions are not stand-alone segments but are combined with audiences in personalization rules:

| Condition | Rule | Use |
| --- | --- | --- |
| `high-cart-value` | cart subtotal >= $300 | XT-CART-HIGH-VALUE (discount banner for high cart value) |
| `empty-cart` | cart item count = 0 | available for rules |
| `premium-members` | member and tier gold/platinum | XT-MEMBERSHIP-HERO (premium user messaging) |
| `non-members` | not enrolled in Rewards | XT-MEMBERSHIP-ENROLL |
| `first-time-buyers` | exactly 1 order | XT-CONFIRMATION-NEXT |
| `geo-us-west`, `geo-us-east`, `geo-europe` | browser time zone (proxy for Target `geo.region` / `geo.country`) | XT-GEO-PROMO, XT-SEASONAL-HERO, XT-STORES (location-based promotions) |

## Audience priority (`audienceType`)

`user.audienceType` holds the single most specific audience, for reporting in an eVar:
`high-value-customers > frequent-buyers > cart-abandoners > electronics-shoppers > fashion-shoppers > blog-readers > logged-in-users > returning-visitors > new-visitors > anonymous-users`.

## How to qualify for each audience (QA)

| Audience | Manual steps | Shortcut |
| --- | --- | --- |
| New Visitors | Reset profile (footer link or debug panel) and reload | `?aep-audience=new-visitors` |
| Returning Visitors | Close the tab/browser (new session) and come back | `?aep-audience=returning-visitors` |
| Logged-In Users | My Account > "Sign in as demo customer" | `?aep-audience=logged-in-users` |
| High Value Customers | Sign in (gold tier) or place $1,000+ of orders | `?aep-audience=high-value-customers` |
| Frequent Buyers | Complete 3 checkouts | `?aep-audience=frequent-buyers` |
| Electronics / Fashion Shoppers | View 3 electronics (or fashion) products or category pages | `?aep-audience=electronics-shoppers` |
| Cart Abandoners | Add to cart, close the browser session, return | `?aep-audience=cart-abandoners` |
| Blog Readers | Read 2 different articles | `?aep-audience=blog-readers` |

Overrides persist for the session; clear them with `?aep-audience=clear` or the debug panel
(`?aep-debug=1`). Overrides replace the computed list, so combine audiences with commas:
`?aep-audience=returning-visitors,logged-in-users,high-cart-value`.

## Governance

- Production identity: replace the local `visitorId` with ECID (Web SDK) and send the CRM ID only
  through `identityMap` after consent; never send emails or names to Analytics.
- Keep audience ids identical across Target, RT-CDP and Analytics segment names to simplify
  reporting (A4T) and activation.
- Document new audiences in `scripts/aep/profile.js` (AUDIENCES / CONDITIONS) and in this file.
