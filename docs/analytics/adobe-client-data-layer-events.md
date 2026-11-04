# Engagement analytics: Adobe Client Data Layer events

This document lists the engagement events that the site pushes to the Adobe Client Data Layer (ACDL). For each event it gives the trigger, the payload and how to report on it in Adobe Analytics.

| Item | Location |
| --- | --- |
| Reusable utility | `scripts/analytics/adobe-data-layer.js` |
| Component trackers | `scripts/analytics/{hero-banner,auth,department,navigation,search,page-engagement}.js` |
| Page-level start-up | `scripts/analytics/index.js`, loaded in the lazy phase from `scripts/scripts.js → loadLazy()` |
| Block hooks | `blocks/hero`, `blocks/login-form`, `blocks/commerce-login`, `blocks/commerce-create-account`, `blocks/cards`, `blocks/product-grid`, `blocks/search`, `blocks/header` (`header.js`, `header-aep.js`, `renderAuthDropdown.js`), `scripts/aep/tracking.js` (demo sign-in and Rewards enrollment links) |

These events are **added** to the existing data layer. The training-site events (`heroClick`, `ctaClick`, `navClick`, `searchSubmit`, `filterApply`, `scrollDepth`, `loginComplete` and the others in `docs/aep-training/04-analytics-tracking-matrix.md`) and the Commerce drop-in events keep firing unchanged. See [section 7](#7-relationship-to-the-existing-events) to avoid double counting.

---

## 1. Data layer conventions

### Payload shape

```js
window.adobeDataLayer.push({
  event: 'heroBannerInteraction',          // name the Tags rule listens for
  component: {                             // data object (merged into the ACDL computed state)
    type: 'hero-banner',
    title: 'Shop all departments',
    variation: 'default',
    ctaText: 'Browse all products',
    action: 'click',
    // ...event specific attributes
  },
  eventInfo: {                             // event metadata, not kept in the computed state
    componentId: 'hero-1',
    timestamp: '2026-11-04T10:15:00.000Z',
  },
});
```

- **Component events** use the `component` object: hero, login, signup, department, navigation and search.
- **Page events** use the `engagement` object: scroll depth and engagement time.
- `component.type` always names the component and `component.action` always names the interaction. A Tags rule can therefore listen to one event and branch on `action`.

### Rules the utility enforces

| Rule | How |
| --- | --- |
| Always `window.adobeDataLayer.push()` | `pushDataLayerEvent()` creates the array if needed. Pushes made before the ACDL library loads (lazy phase) are queued and processed in order. |
| No values left over in the computed state | ACDL deep-merges each push into its state. When a key from the previous `component` / `engagement` push is missing from the new one, the utility sends it as `null`, and ACDL deletes null keys. `adobeDataLayer.getState('component')` therefore always equals the latest payload. This is why some payloads contain `null` attributes. |
| Impressions once per component instance | `trackImpression()` uses a shared `IntersectionObserver`. It fires when 50 % of the component is visible, or when it covers 50 % of the viewport (for components taller than the screen). The element is then unobserved and marked `data-analytics-impression="tracked"`. Components hidden by personalization never fire. |
| No duplicate events | One push per DOM event and event name, even when several listeners see the same click. Identical pushes within 500 ms are dropped (double clicks). Success and completion events are guarded per attempt or per block instance. |
| Prerendered pages | Impressions and timers start only when a page prerendered by speculation rules is actually shown (`prerenderingchange`). |
| No personal data | Form values and credentials are never read. Search terms are lower-cased, and anything that looks like an email address or a long number is replaced with `[email]` / `[number]`. Text values are limited to 100 characters. |
| Never breaks the page | Every push and handler is wrapped in `try/catch`. Listeners are passive and never call `preventDefault()`. |

### Debugging

Run `sessionStorage.setItem('acdl:debug', 'true')` in the browser console and reload the page. Every push is then logged with `console.debug('[acdl]', …)`. This is the same key the existing ACDL validator uses. `window.adobeDataLayer` lists all pushes, and `adobeDataLayer.getState()` shows the computed state.

### Reusing the utility in a new block

```js
import {
  pushDataLayerEvent, trackImpression, trackClicks, getComponentId, getBlockVariation, cleanText,
} from '../../scripts/analytics/adobe-data-layer.js';

export default function decorate(block) {
  // ...decorate the block first...
  const componentId = getComponentId(block, 'teaser');
  const base = { type: 'teaser', title: cleanText(block.querySelector('h2')?.textContent), variation: getBlockVariation(block) };
  trackImpression(block, () => pushDataLayerEvent('teaserInteraction', { component: { ...base, action: 'impression' } }, { componentId }));
  trackClicks(block, 'a[href], button', (el, e) => pushDataLayerEvent('teaserInteraction', {
    component: { ...base, ctaText: cleanText(el.textContent), action: 'click' },
  }, { componentId, domEvent: e }));
}
```

---

## 2. Event reference

### 2.1 `heroBannerInteraction` (Hero block)

| action | Trigger |
| --- | --- |
| `impression` | The hero becomes 50 % visible. Fires once per hero instance per page view. |
| `click` | Click on a link or button in the hero. `ctaType` is `primary` (bold link, `.button.primary`), `secondary` (italic link, `.button.secondary`), `tertiary` (third button) or `link` (inline text link). |

```js
{
  event: 'heroBannerInteraction',
  component: {
    type: 'hero-banner',
    title: 'Shop all departments',      // first heading of the hero
    variation: 'default',               // block variant classes, e.g. "dark centered"
    experience: '',                     // section personalization experience, if any
    ctaText: 'Browse all products',     // impression: primary CTA; click: clicked CTA
    ctaType: 'primary',                 // click only
    ctaUrl: 'https://…/products',       // click only
    action: 'impression' | 'click'
  },
  eventInfo: { componentId: 'hero-1', timestamp }
}
```

The tracking module is loaded with a dynamic `import()`, so it does not delay the hero, which is usually the LCP element.

### 2.2 `loginInteraction` (Login blocks)

| action | Trigger |
| --- | --- |
| `impression` | The login block (`login-form`, `commerce-login`) is 50 % visible. Once per instance. |
| `click` | The sign-in form is submitted, by clicking **Sign in** or pressing Enter. One per attempt. The CUG form uses native validation, so only complete forms count. Also fires for the training-site demo sign-in link `#aep:sign-in`. |
| `success` | **Commerce drop-in** (`commerce-login`, header dropdown): when the drop-in calls `routeRedirectOnSignIn` / `onSuccessCallback`, which it only does after a successful sign-in. **CUG** (`login-form`): on the first page view after the form was posted, when the server has redirected to the target page. **Demo link**: right after the demo sign-in. |
| `failure` | **Drop-in**: `onErrorCallback`, i.e. invalid credentials or an API error. **CUG**: the server redirects back to the login page with `?error=`. This only counts when the form was posted from this browser session, so reloading the error page does not count again. |

```js
{
  event: 'loginInteraction',
  component: {
    type: 'login',
    location: 'login-form' | 'commerce-login' | 'header-dropdown' | 'link',
    method: 'demo',                     // demo sign-in link only
    action: 'impression' | 'click' | 'success' | 'failure'
  }
}
```

The CUG result uses a short-lived `sessionStorage` flag (`acdl:login-pending`, 5 minutes). If the visitor comes back to the login form without an error, the result is unknown and is not counted.

### 2.3 `signupInteraction` (Signup block)

| action | Trigger |
| --- | --- |
| `impression` | The `commerce-create-account` block is 50 % visible. Once per instance. |
| `start` | The visitor types in the first form field. Once per instance; autofocus does not count. |
| `click` | Signup CTA. Either the **Create account** submit button in the block (`location: signup-form`), or a click anywhere on the site on a link to an account-creation page (`/customer/create`, `/create-account`, `/signup`, `/register`) or to Rewards enrollment (`#aep:enroll`) (`location: link`). |
| `complete` | The drop-in calls `onSuccessCallback` / `routeRedirectOnSignIn`, which happens only after the account was created. Also fires after a Rewards enrollment (`#aep:enroll`, `method: membership`). Once per instance. |

```js
{
  event: 'signupInteraction',
  component: {
    type: 'signup',
    location: 'signup-form' | 'link',
    method: 'account' | 'membership',   // link clicks and enrollment
    ctaText: 'Create account',          // click only
    ctaUrl: 'https://…/customer/create',// link clicks only
    action: 'impression' | 'click' | 'start' | 'complete'
  }
}
```

### 2.4 `departmentInteraction` and `departmentCardClick` (department blocks)

**Department-related blocks:**

1. A **Cards** block that lists departments. It qualifies when any of these is true:
   - it has the block variant `Cards (departments)`
   - it has the section metadata `Analytics Component: department`
   - the section heading above it mentions "department" (for example **Departments** on `/shop`)

   Each card is one department.
2. A **Product Grid** on a department page, i.e. a page with page metadata `page-type: category` (department from `category`) or with a `department` metadata value. Each product card belongs to that department.

`departmentName` is always a slug (`electronics`, `fashion`, `home-appliances`), so department cards and department pages report the same values.

| Event / action | Trigger |
| --- | --- |
| `departmentInteraction` / `impression` | The department block is 50 % visible. Once per block instance. `departmentName` lists the departments shown, comma separated. |
| `departmentInteraction` / `card-click` | Click on a plain link in a card: image or title link, product link. |
| `departmentInteraction` / `cta-click` | Click on a CTA in a card: a button-styled link (`.button`, e.g. "Shop electronics") or a button (e.g. "Add to cart"). |
| `departmentCardClick` | Fires together with every `card-click` and `cta-click`. Dedicated KPI counter for "Department card clicks". `clickType` is `card` or `cta`. |

```js
{
  event: 'departmentInteraction',
  component: {
    type: 'department',
    departmentName: 'electronics',
    cardTitle: 'Electronics',           // '' for impressions
    cardPosition: 1,                    // clicks
    ctaText: 'Shop electronics',        // clicks
    ctaUrl: 'https://…/electronics',    // clicks
    sectionTitle: 'Departments',
    variation: 'default',               // impressions
    cardCount: 3,                       // impressions
    action: 'impression' | 'card-click' | 'cta-click'
  }
}

{
  event: 'departmentCardClick',
  component: {
    type: 'department-card',
    departmentName: 'electronics', cardTitle: 'Electronics', cardPosition: 1,
    ctaText: 'Shop electronics', ctaUrl: 'https://…/electronics', sectionTitle: 'Departments',
    clickType: 'card' | 'cta',
    action: 'click'
  }
}
```

### 2.5 `departmentFilterInteraction` (Product Grid filters)

| action | Trigger |
| --- | --- |
| `apply` | A filter changes on a department page (brand, price, on sale), or the **Category** (department) filter changes on any page. Sorting is not a filter and is not reported. |
| `clear` | **Clear filters** on a department page. |

```js
{
  event: 'departmentFilterInteraction',
  component: {
    type: 'department-filter',
    departmentName: 'electronics',      // category filter: the selected department ('all' when reset)
    filterType: 'category' | 'brand' | 'price' | 'sale' | 'all',
    filterValue: 'Aperture',
    filterLabel: 'Aperture',
    resultCount: 1,
    listName: 'all-electronics',
    action: 'apply' | 'clear'
  }
}
```

### 2.6 `topNavInteraction` (header, both variants)

A single delegated listener on the header `nav` covers the storefront header (`.nav-*`) and the training header (`.nm-*`). Forms inside the header (search, sign-in) are excluded because they report `searchInteraction` / `loginInteraction`.

| action | Trigger |
| --- | --- |
| `click` | Click on a header link: brand, section link, submenu link or tool link (account, wishlist, cart). |
| `expand` / `collapse` | Click on a submenu toggle. The state is read after the header code has toggled it. Desktop hover is not tracked. |
| `menu-open` / `menu-close` | Mobile hamburger. |
| `tool-click` | Header buttons such as the cart, search or account button. |

```js
{
  event: 'topNavInteraction',
  component: {
    type: 'top-nav',
    navType: 'header',
    area: 'brand' | 'sections' | 'tools' | 'menu',
    linkText: 'Electronics',
    linkUrl: 'https://…/electronics',   // links only
    level: 2,                           // 1 = top level, 2 = submenu
    parentItem: 'Shop',                 // top-level item of a submenu link
    action: 'click' | 'expand' | 'collapse' | 'menu-open' | 'menu-close' | 'tool-click'
  }
}
```

### 2.7 `searchInteraction` (header search, Search block, Product Grid keyword)

| action | Trigger |
| --- | --- |
| `open` | The storefront header search panel opens. |
| `submit` | A search runs: header form, Search block (submit button or popular term), or the Product Grid keyword box. The grid fires after an 800 ms typing pause or Enter, and the same term is not counted twice. `resultCount` is `-1` when the results are shown on the next page. |
| `results-view` | A product listing opened with `?q=` shows the results of a search started on the previous page. Use it for the zero-result rate of header searches. |
| `suggestion-click` | Click on a popular term (Search block) or a Live Search autocomplete suggestion (storefront header). |
| `result-click` | Click on a site search result (Search block, `site` scope). |
| `clear` | The Search block input is cleared. |
| `error` | The site search index could not be loaded. |

```js
{
  event: 'searchInteraction',
  component: {
    type: 'search',
    location: 'header' | 'search-block' | 'product-grid',
    scope: 'site' | 'products' | 'content' | 'stores',
    trigger: 'submit' | 'suggestion' | 'typing' | 'url' | 'clear',
    searchTerm: 'headphones',           // sanitized, see section 1
    resultCount: 12,                    // -1 = not known on this page
    hasResults: true,
    suggestionText: 'jacket',           // suggestion-click
    resultText: 'Nova Pro …', resultUrl: 'https://…', resultPosition: 1, // result-click
    action: 'open' | 'submit' | 'results-view' | 'suggestion-click' | 'result-click' | 'clear' | 'error'
  }
}
```

### 2.8 `pageScrollDepth` (every page)

Fires once per milestone per page view, at 25, 50, 75 and 100 %. The measure is the bottom of the viewport relative to the page height, so short pages can reach 100 % without scrolling. Measurements are throttled with `requestAnimationFrame`, and the listeners are removed once 100 % is reached.

```js
{
  event: 'pageScrollDepth',
  engagement: { type: 'scroll-depth', scrollDepth: 50, milestone: '50%', pageHeight: 4508 }
}
```

### 2.9 `pageEngagementTime` (every page)

**Active time** counts only while the tab is visible and the visitor has interacted (scroll, pointer, key, touch or wheel) within the last 30 seconds.

| trigger | When |
| --- | --- |
| `milestone` | After 10, 30, 60, 120, 300 and 600 active seconds. |
| `hidden` / `pagehide` | Exit summary when the tab is hidden or the page unloads. Sent only if there is new active time since the previous push, so tab switching does not create duplicates. |

```js
{
  event: 'pageEngagementTime',
  engagement: {
    type: 'engagement-time',
    activeSeconds: 30,          // total active seconds so far
    incrementalSeconds: 20,     // active seconds since the previous pageEngagementTime push
    milestone: '30s' | 'exit',
    trigger: 'milestone' | 'hidden' | 'pagehide',
    maxScrollDepth: 75
  }
}
```

The sum of `incrementalSeconds` over a page view is its total active time. Map it to a numeric event (see section 4).

---

## 3. KPI mapping

| KPI | Event(s) | Calculation |
| --- | --- | --- |
| Hero banner engagement | `heroBannerInteraction` | Hero CTR = `click` ÷ `impression`, split by `title`, `variation`, `experience`, `ctaType` |
| Login clicks | `loginInteraction` `click` | Count, by `location` |
| Login success rate | `loginInteraction` | `success` ÷ (`success` + `failure`) |
| Signup starts | `signupInteraction` `start` | Count; start rate = `start` ÷ `impression` |
| Signup completions | `signupInteraction` `complete` | Count; completion rate = `complete` ÷ `start` |
| Department engagement | `departmentInteraction`, `departmentCardClick` | Department CTR = `departmentCardClick` ÷ `departmentInteraction impression`, by `departmentName` |
| Department filter usage | `departmentFilterInteraction` | Filter uses per department page view, by `filterType` |
| Navigation engagement | `topNavInteraction` | Clicks by `linkText`, `area`, `level`; menu opens on mobile |
| Search engagement | `searchInteraction` | Searches (`submit`), zero-result rate (`submit`/`results-view` with `hasResults = false`), search exits / result CTR (`result-click` ÷ `submit`) |
| CTA click-through rate | All `click`, `card-click`, `cta-click` actions | CTA clicks ÷ impressions of the same component |
| Page engagement | `pageScrollDepth`, `pageEngagementTime` | Scroll-milestone reach; average active time per page = Σ `incrementalSeconds` ÷ page views |

---

## 4. Adobe Analytics and Adobe Tags implementation

### 4.1 Proposed variables

These numbers are free in the current SDR (`doc/kpi-and-sdr-guide.md`, `doc/sdr/novamart-sdr.csv`). Confirm them with the report suite owner before you enable them.

| Variable | Name | Value / source |
| --- | --- | --- |
| eVar70 (hit expiry) | Component type | `component.type` |
| eVar71 (hit) | Component action | `component.action` |
| eVar72 (hit) | Component title / card title | `component.title` or `component.cardTitle` |
| eVar73 (hit) | Component variation / experience | `component.variation` (+ `experience`) |
| eVar74 (hit) | CTA text | `component.ctaText` / `linkText` |
| eVar75 (visit) | Department | `component.departmentName` |
| eVar76 (hit) | Department filter | `filterType:filterValue` |
| eVar77 (hit) | Navigation item | `area:level:parentItem:linkText` |
| eVar78 (visit) | Internal search term | `component.searchTerm` |
| eVar79 (hit) | Auth location | `component.location` |
| prop50 | Scroll depth milestone | `engagement.milestone` (pathing on page + milestone) |
| event90 | Hero impressions | `heroBannerInteraction` `impression` |
| event91 | Hero CTA clicks | `heroBannerInteraction` `click` |
| event92 | Login clicks | `loginInteraction` `click` |
| event93 | Login successes | `loginInteraction` `success` |
| event94 | Login failures | `loginInteraction` `failure` |
| event95 | Signup starts | `signupInteraction` `start` |
| event96 | Signup completions | `signupInteraction` `complete` |
| event97 | Department impressions | `departmentInteraction` `impression` |
| event98 | Department card clicks | `departmentCardClick` |
| event99 | Department filter uses | `departmentFilterInteraction` |
| event100 | Top navigation clicks | `topNavInteraction` `click` |
| event101 | Internal searches | `searchInteraction` `submit` |
| event102 | Null searches | `searchInteraction` `submit` / `results-view` with `resultCount = 0` |
| event103 | Search result clicks | `searchInteraction` `result-click` |
| event104 | Component impressions (all) | any `impression` action |
| event105 | CTA clicks (all) | any `click`, `card-click`, `cta-click` action |
| event106–109 | Scroll 25 / 50 / 75 / 100 % | `pageScrollDepth` `scrollDepth` |
| event110 (numeric) | Active engagement seconds | `engagement.incrementalSeconds` |
| event111 | Signup impressions | `signupInteraction` `impression` |
| event112 | Login impressions | `loginInteraction` `impression` |

Impressions, scroll milestones, engagement time and exit summaries are **non-interaction** hits. Send them with `s.tl()` (link type `o`) so they don't inflate page views or affect bounce rate.

### 4.2 Tags (Launch) rules

Install the **Adobe Client Data Layer** extension and configure it to use the existing `window.adobeDataLayer` array (do not let it create a new one).

| Rule | Event | Conditions | Action |
| --- | --- | --- | --- |
| ENG – Hero | ACDL "Data Pushed", specific event `heroBannerInteraction` | – | Set variables from `%event.message.component.*%`; `event90` if `action = impression`, `event91` if `click`; send beacon `s.tl` |
| ENG – Login | `loginInteraction` | value comparison on `%event.message.component.action%` | event92/93/94/112 |
| ENG – Signup | `signupInteraction` | as above | event95/96/111, `event105` on `click` |
| ENG – Department | `departmentInteraction` | – | event97, `event105` on clicks |
| ENG – Department card | `departmentCardClick` | – | event98 |
| ENG – Department filter | `departmentFilterInteraction` | – | event99, eVar76 |
| ENG – Navigation | `topNavInteraction` | – | event100 on `click`, eVar77 |
| ENG – Search | `searchInteraction` | – | event101/102/103, eVar78 |
| ENG – Scroll | `pageScrollDepth` | – | event106–109 by `scrollDepth`, prop50 |
| ENG – Engagement time | `pageEngagementTime` | `incrementalSeconds > 0` | `event110=<incrementalSeconds>` |

Implementation notes:

- Read values from the pushed message (`%event.message.component.title%`), not from the computed state, so the values belong exactly to the event that triggered the rule.
- **Clicks that navigate and exit summaries:** set `s.useBeacon = true` (AppMeasurement), or use `sendBeacon` / `fetch keepalive` with Web SDK. Otherwise the hit can be lost when the page unloads.
- With **Web SDK** (AEP), map the same `component` / `engagement` attributes to XDM `_<tenant>.engagement.*` fields and send them as `web.webInteraction.linkClicks` (clicks) or a custom `eventType` (impressions, time).
- Consent: `getConsent()` in `scripts/scripts.js` is still a stub. The pushes themselves are always made, so gate the Tags rules (or the Analytics extension) on the CMP consent state.

---

## 5. Adobe Analytics reporting use cases

| Use case | Workspace setup |
| --- | --- |
| Which hero message and CTA work best? | Freeform table: eVar72 (hero title) × eVar73 (variation/experience). Metrics: event90, event91 and calculated *Hero CTR* = event91 ÷ event90. Break down by eVar74 for primary vs secondary CTA. |
| Personalization lift on the hero | Same table, filtered on the Target experience (eVar73 experience). Compare *Hero CTR* and downstream orders. |
| Login health | Trend of event92, event93, event94 and *Login success rate* = event93 ÷ (event93 + event94), by eVar79 (`login-form`, `commerce-login`, `header-dropdown`). Alert when the success rate drops. |
| Signup funnel | Fallout: signup impression (event111) → start (event95) → click (`signupInteraction click`) → complete (event96). Break down by device and marketing channel. |
| Department interest | eVar75 (department) with event97, event98, *Department CTR*, then orders and revenue (visit-expiry eVar gives credit to the department visited). |
| Filter usefulness | eVar76 × event99 per department; compare with the product views that follow (flow from filter to product page). |
| Navigation design | eVar77 × event100. Find navigation items nobody uses, and compare mobile hamburger opens (`menu-open`) with desktop. |
| Search quality | eVar78 × event101, event102 and *Null-search rate* = event102 ÷ event101. Search CTR = event103 ÷ event101. Top null-result terms feed merchandising and synonyms. |
| Overall CTA click-through | event105 ÷ event104 by eVar70 (component type), to compare blocks site-wide. |
| Content engagement | Pages × event106–109 (scroll reach %) and *Average active time* = event110 ÷ Page Views. Combine with bounce rate to find pages that are read but don't convert. |

---

## 6. QA checklist

1. Enable debugging: `sessionStorage.setItem('acdl:debug', 'true')`, then reload.
2. **Shop page:** the hero `impression` fires once on load. Scrolling to **Departments** fires one `departmentInteraction impression`. Clicking **Shop electronics** fires `departmentInteraction cta-click` and `departmentCardClick`. **Collections** cards do not fire department events.
3. **Department page** (`/electronics`): grid impression with `departmentName: electronics`. A brand filter fires `departmentFilterInteraction`; sorting does not. **Clear filters** fires `action: clear`.
4. **Search:** a Search block term fires `submit` with a `resultCount`. Searching for an email address shows `[email]`.
5. **Header:** opening a submenu fires `expand`, a submenu link fires `click` with `level: 2` and `parentItem`. On mobile, the hamburger fires `menu-open` / `menu-close`.
6. **Account page** (`#aep:sign-in`): `loginInteraction click` then `success`. **Membership page** (`#aep:enroll`): `signupInteraction click` then `complete`.
7. **Engagement:** stay active for 10 s and the `pageEngagementTime 10s` milestone fires. Switch tabs and an `exit` summary fires once.
8. Scroll the impression area back and forth: impressions must not repeat. `adobeDataLayer.getState('component')` must contain only the keys of the last component event.

---

## 7. Relationship to the existing events

| New event | Existing event on training pages | Recommendation |
| --- | --- | --- |
| `heroBannerInteraction click` | `heroClick` | Map hero KPIs to the new event only. Keep `heroClick` for the existing Target/AEP training rules. |
| `departmentInteraction` / `departmentCardClick` | `ctaClick` (cards) | Use the new events for department KPIs, and keep `ctaClick` as the generic CTA counter. Do not map both to the same success event. |
| `topNavInteraction` | `navClick`, `navToggle` | Use the new event for navigation reports. |
| `searchInteraction` | `searchInitiate`, `searchSubmit`, `searchNoResults`, `searchSuggestionClick`, `searchResultClick`, `searchResultsView` | The new event has one name and sanitized terms. Prefer it for eVar78 / event101–103. |
| `departmentFilterInteraction` | `filterApply`, `filterClear` | `filterApply` stays the generic filter event; the new event adds department context. |
| `pageScrollDepth` | `scrollDepth` (25/50/75/90/100) | Use `pageScrollDepth` for KPI reporting. Plan to retire `scrollDepth` from the Analytics rules. |
| `loginInteraction success` | `loginComplete` (demo sign-in), drop-in `sign-in` ACDL event | `loginComplete` keeps the identity (CRM ID) logic. Count login KPIs from `loginInteraction` only. |
| `signupInteraction complete` | `membershipEnroll` (Rewards), drop-in `create-account` ACDL event | Count signup KPIs from `signupInteraction` only. |
