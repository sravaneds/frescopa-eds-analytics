# Engagement analytics: Adobe Client Data Layer events

This document lists the engagement events that the site pushes to the Adobe Client Data Layer (ACDL). For each event it gives where the code is, the trigger, the payload and how to report on it in Adobe Analytics.

Every event is pushed **inline, in the block where the interaction happens**, with `window.adobeDataLayer.push()`. There is no shared analytics module or helper function: each block is self-contained and can be changed or removed on its own.

| Event | Pushed from |
| --- | --- |
| `heroBannerInteraction` | `blocks/hero/hero.js` |
| `loginInteraction` | `blocks/login-form/login-form.js`, `blocks/header/renderCugUser.js` (CUG login success), `blocks/commerce-login/commerce-login.js`, `blocks/header/renderAuthDropdown.js`, `scripts/aep/tracking.js` (demo sign-in link) |
| `signupInteraction` | `blocks/commerce-create-account/commerce-create-account.js`, `scripts/aep/tracking.js` (Rewards enrollment link) |
| `departmentInteraction`, `departmentCardClick` | `blocks/cards/cards.js`, `blocks/product-grid/product-grid.js` |
| `departmentFilterInteraction` | `blocks/product-grid/product-grid.js` |
| `topNavInteraction` | `blocks/header/header.js` (storefront header), `blocks/header/header-aep.js` (training site header) |
| `searchInteraction` | `blocks/search/search.js`, `blocks/header/header.js`, `blocks/header/header-aep.js`, `blocks/product-grid/product-grid.js` |
| `pageScrollDepth`, `pageEngagementTime` | `scripts/delayed.js` (page level, not a block) |

These events are **added** to the existing data layer. The training-site events (`heroClick`, `ctaClick`, `navClick`, `searchSubmit`, `filterApply`, `scrollDepth`, `loginComplete` and the others in `docs/aep-training/04-analytics-tracking-matrix.md`) and the Commerce drop-in events keep firing unchanged. See [section 7](#7-relationship-to-the-existing-events) to avoid double counting.

---

## 1. Data layer conventions

### Payload shape

```js
window.adobeDataLayer = window.adobeDataLayer || [];
window.adobeDataLayer.push({
  event: 'heroBannerInteraction',          // name the Tags rule listens for
  component: {                             // event data
    type: 'hero-banner',
    title: 'Shop all departments',
    variation: 'default',
    ctaText: 'Browse all products',
    action: 'click',
  },
});
```

- **Component events** use the `component` object: hero, login, signup, department, navigation and search.
- **Page events** use the `engagement` object: scroll depth and engagement time.
- `component.type` always names the component and `component.action` always names the interaction. A Tags rule can therefore listen to one event and branch on `action`.
- Each block starts with `window.adobeDataLayer = window.adobeDataLayer || [];`, so it can push before the ACDL library loads (lazy phase). Queued pushes are processed in order.

### How the blocks avoid duplicate and unwanted events

| Rule | How it is done in each block |
| --- | --- |
| Impressions once per component instance | Each block creates its own `IntersectionObserver` and calls `disconnect()` after the first time 50 % of the block is visible (25 % for the tall product grid). Components hidden by personalization never fire. The hero and department cards also wait for activation when the page was prerendered by speculation rules. |
| One event per interaction | One listener per interaction. Results are guarded by a flag: one login success or failure per attempt, one signup completion per block, and a product grid keyword is not counted twice when Enter follows the typing pause. |
| CUG login result counted once | The login form stores a short-lived `sessionStorage` flag (`acdl:login-pending`) on submit. A failure is reported only when the flag exists, so reloading the error page does not count again. Success is reported by the header (`renderCugUser.js`) once `/auth/me` confirms the session. |
| No personal data | Form values and credentials are never read. Search terms are lower-cased, and email addresses and long numbers are replaced with `[email]` / `[number]`. In the training header, account links report their authored label ("Account") instead of the "Hi, <name>" greeting. |
| Existing behaviour unchanged | Listeners never call `preventDefault()`. Drop-in callbacks keep returning the same redirect URLs. |

**Computed state.** ACDL also merges each `component` object into its computed state (`adobeDataLayer.getState()`), and attributes that one event sends but a later one doesn't stay in that state. In Tags, read the values from the pushed message (`%event.message.component.*%`), not from "Computed State" data elements.

### Adding tracking to a new block

Follow the same inline pattern inside the block's `decorate()`:

```js
// Adobe Client Data Layer: teaser engagement (teaserInteraction)
window.adobeDataLayer = window.adobeDataLayer || [];
const title = (block.querySelector('h2')?.textContent || '').trim();

// impression: the teaser is 50 % visible, reported once
const observer = new IntersectionObserver((entries) => {
  if (!entries.some((entry) => entry.isIntersecting)) return;
  observer.disconnect();
  window.adobeDataLayer.push({
    event: 'teaserInteraction',
    component: { type: 'teaser', title, action: 'impression' },
  });
}, { threshold: 0.5 });
observer.observe(block);

// click: a link in the teaser
block.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;
  window.adobeDataLayer.push({
    event: 'teaserInteraction',
    component: { type: 'teaser', title, ctaText: link.textContent.trim(), action: 'click' },
  });
});
```

### Debugging

Type `window.adobeDataLayer` in the browser console to list every push, or `adobeDataLayer.getState()` for the computed state. The Adobe Experience Platform Debugger shows the same data, plus the Tags rules that fired.

---

## 2. Event reference

### 2.1 `heroBannerInteraction` (`blocks/hero/hero.js`)

| action | Trigger |
| --- | --- |
| `impression` | The hero becomes 50 % visible. Once per hero per page view. |
| `click` | Click on a link in the hero. `ctaType` is `primary` (bold link, `.button.primary`, or the first button), `secondary` (italic link, `.button.secondary`, or the second button) or `link` (inline text link). |

```js
{
  event: 'heroBannerInteraction',
  component: {
    type: 'hero-banner',
    title: 'Shop all departments',      // first heading of the hero
    variation: 'default',               // block variant classes, e.g. "dark centered"
    ctaText: 'Browse all products',     // impression: first CTA; click: clicked CTA
    ctaType: 'primary',                 // click only: primary | secondary | link
    ctaUrl: 'https://…/products',       // click only
    action: 'impression' | 'click'
  }
}
```

### 2.2 `loginInteraction` (login blocks)

| action | Trigger |
| --- | --- |
| `impression` | The login block (`login-form`, `commerce-login`) is 50 % visible. Once per page view. |
| `click` | The sign-in form is submitted, by clicking **Sign in** or pressing Enter. One per attempt. The CUG form uses native validation, so only complete forms count. Also fires for the header sign-in dropdown and the training-site demo sign-in link (`#aep:sign-in`). |
| `success` | **Commerce drop-in** (`commerce-login`): inside `routeRedirectOnSignIn`, which the drop-in calls only after a successful sign-in. **Header dropdown**: inside `onSuccessCallback`. **CUG** (`login-form`): on the next page, when `renderCugUser.js` gets an authenticated `/auth/me` response within 5 minutes of the submit. **Demo link**: right after the demo sign-in. |
| `failure` | **Drop-in and header dropdown**: inside `onErrorCallback` (credentials rejected or request failed). **CUG**: the server redirects back to the login page with `?error=`; `reason` carries the error code. |

```js
{
  event: 'loginInteraction',
  component: {
    type: 'login',
    location: 'login-form' | 'commerce-login' | 'header-dropdown' | 'link',
    method: 'demo',                     // demo sign-in link only
    ctaText: 'Sign in',                 // click only
    reason: 'invalid',                  // CUG failure only
    action: 'impression' | 'click' | 'success' | 'failure'
  }
}
```

### 2.3 `signupInteraction` (signup block)

| action | Trigger |
| --- | --- |
| `impression` | The `commerce-create-account` block is 50 % visible. Once per page view. |
| `start` | The visitor types in the first form field. Once per block; autofocus does not count. `field` is the field name; the value is never read. |
| `click` | The **Create account** CTA is clicked (or Enter pressed). Also fires for the Rewards **Join** link (`#aep:enroll`, `method: membership`). |
| `complete` | Inside `routeRedirectOnSignIn` (account created and the customer signed in automatically) or `onSuccessCallback` (account created, e.g. email confirmation required). Once per block. Also fires after a Rewards enrollment. |

```js
{
  event: 'signupInteraction',
  component: {
    type: 'signup',
    location: 'signup-form' | 'link',
    method: 'membership',               // Rewards enrollment only
    field: 'firstName',                 // start only
    ctaText: 'Create account',          // click only
    action: 'impression' | 'click' | 'start' | 'complete'
  }
}
```

### 2.4 `departmentInteraction` and `departmentCardClick` (department blocks)

**Department-related blocks:**

1. **Cards** (`blocks/cards/cards.js`) that list departments. A Cards block qualifies when any of these is true:
   - it has the block variant `Cards (departments)`
   - it has the section metadata `Analytics Component: department`
   - the section heading above it mentions "department" (for example **Departments** on `/shop`)

   Each card is one department. Other Cards blocks (for example **Collections**) send no department events.
2. **Product Grid** (`blocks/product-grid/product-grid.js`) on a department page, i.e. a page with page metadata `page-type: category`. The department comes from the page's `category` metadata, and each product card belongs to that department.

`departmentName` is always a slug (`electronics`, `fashion`, `home-appliances`), so department cards and department pages report the same values.

| Event / action | Trigger |
| --- | --- |
| `departmentInteraction` / `impression` | The department block is visible (cards 50 %, product grid 25 %). Once per block. On the Shop page, `departmentName` lists the departments shown, comma separated. |
| `departmentInteraction` / `card-click` | Click on a plain link in a card: image or title link, or the product link in a department grid. |
| `departmentInteraction` / `cta-click` | Click on a CTA in a card: a button-styled link ("Shop electronics") or a product card button ("Add to cart", wishlist). |
| `departmentCardClick` | Pushed right after every `card-click` and `cta-click`, as the dedicated KPI counter for "Department card clicks". `clickType` is `card` or `cta`. |

```js
{
  event: 'departmentInteraction',
  component: {
    type: 'department',
    departmentName: 'electronics',
    cardTitle: 'Electronics',           // '' for impressions
    cardPosition: 1,                    // clicks
    ctaText: 'Shop electronics',        // clicks
    ctaUrl: 'https://…/electronics',    // clicks ('' for buttons)
    sectionTitle: 'Departments',
    cardCount: 3,                       // impressions
    action: 'impression' | 'card-click' | 'cta-click'
  }
}

{
  event: 'departmentCardClick',
  component: {
    type: 'department-card',
    departmentName: 'electronics', cardTitle: 'Electronics', cardPosition: 1,
    ctaText: 'Shop electronics', ctaUrl: 'https://…/electronics',
    clickType: 'card' | 'cta',
    action: 'click'
  }
}
```

### 2.5 `departmentFilterInteraction` (`blocks/product-grid/product-grid.js`)

| action | Trigger |
| --- | --- |
| `apply` | A filter changes on a department page (brand, price, on sale), or the **Category** (department) filter changes on any page. Sorting is not a filter and is not reported. |
| `clear` | **Clear filters** on a department page. |

```js
{
  event: 'departmentFilterInteraction',
  component: {
    type: 'department-filter',
    departmentName: 'electronics',      // category filter: the selected category ('all' when reset)
    filterType: 'category' | 'brand' | 'price' | 'sale' | 'all',
    filterValue: 'Aperture',
    filterLabel: 'Aperture',
    resultCount: 1,
    action: 'apply' | 'clear'
  }
}
```

### 2.6 `topNavInteraction` (header blocks)

| action | Trigger |
| --- | --- |
| `click` | Click on a header link: brand, section link, submenu link or tool link (account, wishlist, cart). Links in the header search and sign-in forms are excluded, because they report `searchInteraction` / `loginInteraction`. In the storefront header, the mini cart button also reports a `click`. |
| `expand` / `collapse` | A submenu is opened or closed by a click: the section buttons in the training header, and the dropdowns of the storefront header on mobile. Desktop hover is not tracked. |
| `menu-open` / `menu-close` | The mobile hamburger. |

```js
{
  event: 'topNavInteraction',
  component: {
    type: 'navigation',
    menuItem: 'All departments',        // link text or menu label
    menuUrl: 'https://…/shop',          // links only
    area: 'brand' | 'sections' | 'tools' | 'menu',
    level: 2,                           // 1 = top level, 2 = submenu
    parentItem: 'Shop',                 // top-level item of a submenu link
    action: 'click' | 'expand' | 'collapse' | 'menu-open' | 'menu-close'
  }
}
```

### 2.7 `searchInteraction` (Search block, header search, Product Grid keyword)

| action | Trigger |
| --- | --- |
| `search` | A search runs: the header search form, the Search block (submit button or popular term), or the Product Grid keyword box (after an 800 ms typing pause or Enter). `resultCount` is `-1` when the results are shown on the next page. |
| `results-view` | A product grid opened with `?q=` shows the results of a search started on the previous page. Use it for the zero-result rate of header searches. |
| `open` | The storefront header search panel opens. |
| `suggestion-click` | A popular search term (Search block) or a Live Search autocomplete suggestion (storefront header) is clicked. |
| `result-click` | A site search result (Search block, `site` scope) is clicked. |
| `clear` | The Search block input is cleared. |
| `error` | The site search index could not be loaded. |

```js
{
  event: 'searchInteraction',
  component: {
    type: 'search',
    location: 'header' | 'search-block' | 'product-grid',
    scope: 'site' | 'products' | 'content' | 'stores',   // Search block only
    searchTerm: 'headphones',           // sanitized, see section 1
    resultCount: 12,                    // -1 = not known on this page
    trigger: 'submit' | 'suggestion' | 'typing' | 'url' | 'clear',
    departmentName: 'electronics',      // product grid on a department page
    suggestionText: 'jacket',           // suggestion-click
    resultText: 'Nova Pro …', resultUrl: 'https://…', resultPosition: 1,   // result-click
    action: 'search' | 'results-view' | 'open' | 'suggestion-click' | 'result-click' | 'clear' | 'error'
  }
}
```

### 2.8 `pageScrollDepth` (`scripts/delayed.js`, every page)

Fires once per milestone per page view, at 25, 50, 75 and 100 %. The measure is the bottom of the viewport relative to the page height, so short pages can reach 100 % without scrolling. Measurements are throttled with `requestAnimationFrame`, and the listener is removed once 100 % is reached. Tracking starts in the delayed phase (about 3 s after load); milestones already passed by then are reported on the first measurement.

```js
{
  event: 'pageScrollDepth',
  engagement: { type: 'scroll-depth', scrollDepth: 50, milestone: '50%', pageHeight: 4508 }
}
```

### 2.9 `pageEngagementTime` (`scripts/delayed.js`, every page)

**Active time** counts only while the tab is visible and the visitor has interacted (scroll, pointer, key, touch or wheel) within the last 30 seconds. Counting starts in the delayed phase, about 3 s after load.

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
| Hero banner engagement | `heroBannerInteraction` | Hero CTR = `click` ÷ `impression`, split by `title`, `variation`, `ctaType` |
| Login clicks | `loginInteraction` `click` | Count, by `location` |
| Login success rate | `loginInteraction` | `success` ÷ (`success` + `failure`) |
| Signup starts | `signupInteraction` `start` | Count; start rate = `start` ÷ `impression` |
| Signup completions | `signupInteraction` `complete` | Count; completion rate = `complete` ÷ `start` |
| Department engagement | `departmentInteraction`, `departmentCardClick` | Department CTR = `departmentCardClick` ÷ `departmentInteraction impression`, by `departmentName` |
| Department filter usage | `departmentFilterInteraction` | Filter uses per department page view, by `filterType` |
| Navigation engagement | `topNavInteraction` | Clicks by `menuItem`, `area`, `level`; menu opens on mobile |
| Search engagement | `searchInteraction` | Searches (`search`), zero-result rate (`search` / `results-view` with `resultCount = 0`), result CTR (`result-click` ÷ `search`) |
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
| eVar73 (hit) | Component variation | `component.variation` |
| eVar74 (hit) | CTA text | `component.ctaText` / `menuItem` |
| eVar75 (visit) | Department | `component.departmentName` |
| eVar76 (hit) | Department filter | `filterType:filterValue` |
| eVar77 (hit) | Navigation item | `area:level:parentItem:menuItem` |
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
| event101 | Internal searches | `searchInteraction` `search` |
| event102 | Null searches | `searchInteraction` `search` / `results-view` with `resultCount = 0` |
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

- Read values from the pushed message (`%event.message.component.title%`), not from the computed state (see section 1).
- **Clicks that navigate and exit summaries:** set `s.useBeacon = true` (AppMeasurement), or use `sendBeacon` / `fetch keepalive` with Web SDK. Otherwise the hit can be lost when the page unloads.
- With **Web SDK** (AEP), map the same `component` / `engagement` attributes to XDM `_<tenant>.engagement.*` fields and send them as `web.webInteraction.linkClicks` (clicks) or a custom `eventType` (impressions, time).
- Consent: `getConsent()` in `scripts/scripts.js` is still a stub. The pushes themselves are always made, so gate the Tags rules (or the Analytics extension) on the CMP consent state.

---

## 5. Adobe Analytics reporting use cases

| Use case | Workspace setup |
| --- | --- |
| Which hero message and CTA work best? | Freeform table: eVar72 (hero title) × eVar73 (variation). Metrics: event90, event91 and calculated *Hero CTR* = event91 ÷ event90. Break down by eVar74 for primary vs secondary CTA. |
| Personalization lift on the hero | Same table, segmented on the Target activity / experience. Compare *Hero CTR* and downstream orders. |
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

1. Open the page and type `window.adobeDataLayer` in the console to see the pushes.
2. **Shop page:** the hero `impression` fires once on load. Scrolling to **Departments** fires one `departmentInteraction impression`. Clicking **Shop electronics** fires `departmentInteraction cta-click` and `departmentCardClick`. **Collections** cards do not fire department events.
3. **Department page** (`/electronics`): grid impression with `departmentName: electronics`. A brand filter fires `departmentFilterInteraction`; sorting does not. **Clear filters** fires `action: clear`. Clicking a product fires `card-click`, and **Add to cart** fires `cta-click`.
4. **Search:** a Search block term fires `searchInteraction` `search`. A term containing an email address or phone number shows `[email]` / `[number]`.
5. **Header:** opening a submenu fires `expand`, a submenu link fires `click` with `level: 2` and `parentItem`. On mobile, the hamburger fires `menu-open` / `menu-close`.
6. **Account page** (`#aep:sign-in`): `loginInteraction click` then `success`. **Membership page** (`#aep:enroll`): `signupInteraction click` then `complete`.
7. **Engagement:** stay active for about 13 s (3 s delayed phase + 10 s) and the `pageEngagementTime 10s` milestone fires. Switch tabs and an `exit` summary fires once.
8. Scroll the impression area back and forth: impressions must not repeat.

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
