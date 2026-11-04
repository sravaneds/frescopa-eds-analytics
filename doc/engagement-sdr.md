# Engagement analytics: Solution Design Reference (SDR)

| | |
| --- | --- |
| **Document** | Solution Design Reference: engagement analytics |
| **Version** | 1.0 (draft for review) · 4 November 2026 |
| **Site** | NovaMart training site (`https://main--frescopa-eds-analytics--sravaneds.aem.page/`) |
| **Report suite** | `tcsdmprtnrsndbxtcstraining-dev` |
| **Tags property** | Adobe Training Website |
| **Business requirements** | [`engagement-brd.md`](engagement-brd.md) |
| **Spreadsheet (source of truth)** | [`sdr/engagement-sdr.csv`](sdr/engagement-sdr.csv): 38 rows, same 13 columns as [`sdr/novamart-sdr.csv`](sdr/novamart-sdr.csv) |

This SDR **extends** the existing NovaMart SDR (product and order KPIs, `sdr/novamart-sdr.csv`). It adds the engagement KPIs: navigation, login and signup, departments, hero banner, search and page engagement. Where a suitable variable already exists, it is **reused** rather than duplicated: Page Name, CTA Name, the search variables and page type/category.

If you are new to SDRs, read section 4 of [`kpi-and-sdr-guide.md`](kpi-and-sdr-guide.md) first. It explains the columns and the 12-step method this document follows.

---

## Contents

1. [How to read the spreadsheet](#1-how-to-read-the-spreadsheet)
2. [KPIs covered](#2-kpis-covered)
3. [Success events](#3-success-events)
4. [Conversion variables (eVars) and traffic variables (props)](#4-conversion-variables-evars-and-traffic-variables-props)
5. [Calculated metrics and segments](#5-calculated-metrics-and-segments)
6. [Data-layer to Analytics mapping (Tags rules)](#6-data-layer-to-analytics-mapping-tags-rules)
7. [Variable reuse, conflicts and retirements](#7-variable-reuse-conflicts-and-retirements)
8. [Data quality and privacy rules](#8-data-quality-and-privacy-rules)
9. [Test cases](#9-test-cases)
10. [Status, owners and change log](#10-status-owners-and-change-log)

---

## 1. How to read the spreadsheet

Open `sdr/engagement-sdr.csv` in Excel or Google Sheets (it is UTF-8 with BOM, so Excel shows characters correctly). Each row is **one Analytics variable**.

| Column | Meaning | Example |
| --- | --- | --- |
| KPI | The KPI the variable serves | Login / Signup Engagement |
| Business question | Why the variable exists | How many logins succeed? |
| Variable | Analytics variable | event93 |
| Friendly name | Name in the report suite and reports | Login Successes |
| Type / settings | Counter, numeric, eVar expiry and allocation | Counter |
| Description | What it counts or holds | Sign-in succeeded |
| Example value | A real value | 1 |
| Data-layer source | Which data layer event and field | `loginInteraction` (action = success) |
| Tags rule | The rule that sets it | Rule 18 (new): Login engagement |
| Hit type | Page view `s.t()` or link hit `s.tl()` | `s.tl()` with useBeacon |
| Page / block | Where on the site it happens | Commerce Login, header dropdown, … |
| Status | Planned → Implemented → Tested → Live, or To retire | Planned |
| Notes | Rules, caveats, formulas | Login Success Rate = event93 / (event93 + event94) |

---

## 2. KPIs covered

| KPI | Business requirement (BRD) | Data layer events |
| --- | --- | --- |
| Navigation Engagement | BR-01 – BR-04 | `topNavInteraction` |
| Login / Signup Engagement | BR-05 – BR-09 | `loginInteraction`, `signupInteraction` |
| Department Engagement | BR-10 – BR-14 | `departmentInteraction`, `departmentCardClick`, `departmentFilterInteraction` + page views |
| Hero Banner Engagement | BR-15 | `heroBannerInteraction` |
| Search Engagement | BR-16 | `searchInteraction` |
| Page Engagement | BR-17 | `pageScrollDepth`, `pageEngagementTime` |

---

## 3. Success events

All new events are type **Counter**, except event110 (**Numeric**). Create them in *Admin → Report Suites → Edit Settings → Conversion → Success Events*.

| Event | Friendly name | KPI | Data-layer source | Rule |
| --- | --- | --- | --- | --- |
| event90 | Hero Impressions | Hero | `heroBannerInteraction` impression | 26 |
| event91 | Hero CTA Clicks | Hero | `heroBannerInteraction` click | 26 |
| event92 | Login Clicks | Login / Signup | `loginInteraction` click | 18 |
| event93 | Login Successes | Login / Signup | `loginInteraction` success | 18 |
| event94 | Login Failures | Login / Signup | `loginInteraction` failure | 18 |
| event95 | Signup Starts | Login / Signup | `signupInteraction` start | 20 |
| event96 | Signup Completions | Login / Signup | `signupInteraction` complete | 20 |
| event97 | Department Impressions | Department | `departmentInteraction` impression | 21 |
| event98 | Department Card Clicks | Department | `departmentCardClick` | 22 |
| event99 | Department Filter Uses | Department | `departmentFilterInteraction` | 23 |
| event100 | Top Navigation Clicks | Navigation | `topNavInteraction` click | 19 |
| event103 | Search Result Clicks | Search | `searchInteraction` result-click, suggestion-click | 27 |
| event106 | Scroll 25 % | Page | `pageScrollDepth` 25 | 24 |
| event107 | Scroll 50 % | Page | `pageScrollDepth` 50 | 24 |
| event108 | Scroll 75 % | Page | `pageScrollDepth` 75 | 24 |
| event109 | Scroll 100 % | Page | `pageScrollDepth` 100 | 24 |
| event110 | Active Engagement Seconds (**numeric**) | Page | `pageEngagementTime` incrementalSeconds | 25 |
| event111 | Signup Impressions | Login / Signup | `signupInteraction` impression | 20 |
| event112 | Login Impressions | Login / Signup | `loginInteraction` impression | 18 |
| event113 | Signup Clicks | Login / Signup | `signupInteraction` click | 20 |
| event114 | Navigation Menu Toggles | Navigation | `topNavInteraction` expand, collapse, menu-open, menu-close | 19 |
| event20 *(existing)* | Searches | Search | `searchInteraction` search | 27 |
| event27 *(existing)* | Null Searches | Search | `searchInteraction` search / results-view with 0 results | 27 |

Numbers 101, 102, 104 and 105 are **intentionally unused**. They were considered and replaced by existing variables or calculated metrics (section 7).

---

## 4. Conversion variables (eVars) and traffic variables (props)

Create eVars in *Edit Settings → Conversion → Conversion Variables*, props in *Edit Settings → Traffic → Traffic Variables*. Allocation is **Most recent** for all.

| Variable | Friendly name | Expire after | Example | Data-layer source | Rules |
| --- | --- | --- | --- | --- | --- |
| eVar1 *(existing)* | Page Name | Hit | `novamart:account` | `page.pageName` (data element `DL - Page Name`) | 1, 18–27 |
| eVar2 / prop1 *(existing)* | Page Type | Hit | `category` | `page.pageType` | 1 |
| eVar3 / prop3 *(existing)* | Category | Visit | `electronics` | `page.category` | 1 |
| eVar30 *(existing)* | CTA Name | Hit | `primary:Browse all products` | hero `ctaType:ctaText` | 26 |
| eVar40 / prop40 *(existing)* | Search Term | Visit | `headphones` | `component.searchTerm` | 27 |
| eVar43 *(existing)* | Search Type | Hit | `search-block:products` | `location:scope` | 27 |
| prop41 *(existing)* | Search Result Count | – | `12` / `unknown` | `component.resultCount` | 27 |
| eVar71 | Component Action | Hit | `click` | `component.action` | 18–23, 26, 27 |
| eVar72 | Component Title | Hit | `Electronics` | hero `title`, `cardTitle` | 22, 26 |
| eVar73 | Component Variation | Hit | `default` | hero `variation` | 26 |
| eVar75 | Department | **Visit** | `home-appliances` | `departmentName` | 21–23 |
| eVar76 | Department Filter | Hit | `brand:Aperture` | `filterType:filterValue` | 23 |
| eVar77 | Navigation Item | Hit | `sections:2:Shop:Electronics` | `area:level:parentItem:menuItem` | 19 |
| eVar79 | Login / Signup Location | Hit | `commerce-login` | `location` (+ `:method`) | 18, 20 |
| prop50 | Scroll Milestone | – | `75%` | `engagement.milestone` | 24 |

**Why Department expires on Visit:** a visitor who opens Fashion and later adds to cart or signs up in the same visit is credited to Fashion. That supports "which department leads to signups / orders".

---

## 5. Calculated metrics and segments

Formulas and settings are in [`engagement-report/workspace-and-tags-setup.md`](engagement-report/workspace-and-tags-setup.md), sections 4 and 5.

| Calculated metric | Formula | BRD |
| --- | --- | --- |
| Nav CTR | event100 ÷ Page Views | BR-02 |
| Nav Item CTR | event100 ÷ Page Views (Total) | BR-02 |
| Login Success Rate | event93 ÷ (event93 + event94) | BR-06 |
| Login Conversion Rate | event93 ÷ event92 | BR-06 |
| Signup Start Rate | event95 ÷ event111 | BR-07 |
| Signup Conversion Rate | event96 ÷ event113 | BR-07 |
| Signup Completion Rate | event96 ÷ event95 | BR-07 |
| Department CTR | event98 ÷ event97 | BR-12 |
| Filter Use Rate | event99 ÷ Page Views (department pages) | BR-13 |
| Engagement Rate | Visits (segment Engaged Visits) ÷ Visits | BR-11, BR-17 |
| Avg Active Seconds per Page View | event110 ÷ Page Views | BR-11, BR-17 |
| Scroll 75 % Reach | event108 ÷ Page Views | BR-11, BR-17 |
| Hero CTR | event91 ÷ event90 | BR-15 |
| Null Search Rate | event27 ÷ event20 | BR-16 |
| All Component Impressions | event90 + event97 + event111 + event112 | BR-18 |
| All CTA Clicks | event91 + event98 + event100 + event92 + event113 | BR-18 |
| Overall CTR | All CTA Clicks ÷ All Component Impressions | BR-18 |

| Segment | Definition |
| --- | --- |
| Desktop / Mobile / Tablet | Visit: Mobile Device Type = Other / Mobile Phone / Tablet |
| Department Page Views | Hit: Page Type (eVar2) = `category` |
| Engaged Visits | Visit: event107 exists OR event110 ≥ 10 |
| Exclude internal traffic | Visit: exclude office IPs / test parameter |

---

## 6. Data-layer to Analytics mapping (Tags rules)

Every rule: *Adobe Client Data Layer → Data Pushed → Specific event* → **Set Variables** (custom code) → **Send Beacon `s.tl()`** → **Clear Variables**. Full code is in the setup guide, section 3; Rule 18 is in [`login-engagement-analytics-guide.md`](login-engagement-analytics-guide.md).

| Rule | Data layer event | Condition | Events | Variables | Beacon |
| --- | --- | --- | --- | --- | --- |
| 18 Login | `loginInteraction` | action in impression, click, success, failure | 112 / 92 / 93 / 94 | eVar1, 71, 79 | useBeacon |
| 19 Top navigation | `topNavInteraction` | – | 100 (click), 114 (toggles) | eVar1, 71, 77 | useBeacon |
| 20 Signup | `signupInteraction` | – | 111 / 113 / 95 / 96 | eVar1, 71, 79 | useBeacon |
| 21 Department impression | `departmentInteraction` | action = impression | 97 | eVar1, 71, 75 | – |
| 22 Department card click | `departmentCardClick` | – | 98 | eVar1, 71, 72, 75 | useBeacon |
| 23 Department filter | `departmentFilterInteraction` | – | 99 | eVar1, 71, 75, 76 | – |
| 24 Scroll depth | `pageScrollDepth` | – | 106 – 109 | eVar1, prop50 | – |
| 25 Engagement time | `pageEngagementTime` | incrementalSeconds > 0 | 110 = seconds | eVar1 | useBeacon |
| 26 Hero | `heroBannerInteraction` | – | 90 / 91 | eVar1, 30, 71, 72, 73 | useBeacon |
| 27 Search | `searchInteraction` | custom code (see setup guide) | 20 / 27 / 103 | eVar1, 40, prop40, eVar43, prop41, eVar71 | useBeacon |

**Where the data layer events come from in the code:**

| Data layer event | Code |
| --- | --- |
| `heroBannerInteraction` | `blocks/hero/hero.js` |
| `loginInteraction` | `blocks/login-form/login-form.js`, `blocks/header/renderCugUser.js`, `blocks/commerce-login/commerce-login.js`, `blocks/header/renderAuthDropdown.js`, `scripts/aep/tracking.js` |
| `signupInteraction` | `blocks/commerce-create-account/commerce-create-account.js`, `scripts/aep/tracking.js` |
| `departmentInteraction`, `departmentCardClick` | `blocks/cards/cards.js`, `blocks/product-grid/product-grid.js` |
| `departmentFilterInteraction` | `blocks/product-grid/product-grid.js` |
| `topNavInteraction` | `blocks/header/header.js`, `blocks/header/header-aep.js` |
| `searchInteraction` | `blocks/search/search.js`, `blocks/header/header.js`, `blocks/header/header-aep.js`, `blocks/product-grid/product-grid.js` |
| `pageScrollDepth`, `pageEngagementTime` | `scripts/delayed.js` |

Payload definitions: [`../docs/analytics/adobe-client-data-layer-events.md`](../docs/analytics/adobe-client-data-layer-events.md).

---

## 7. Variable reuse, conflicts and retirements

| Decision | Reason |
| --- | --- |
| **Reuse eVar30 (CTA Name)** for the hero CTA instead of a new eVar | Same meaning; one CTA dimension across reports |
| **Reuse eVar40, prop40, eVar43, prop41, event20, event27** for search | Search variables already exist (setup guide Rule 12). Rule 27 reads the new `searchInteraction` event, which has sanitized terms and the zero-result page, and **replaces Rule 12** |
| **Retire event10 (Scroll Milestone)** and disable Rule 15 | Replaced by event106–109 (25 / 50 / 75 / 100 %). Running both double-counts scroll hits |
| **No "all impressions" / "all CTA clicks" events** (numbers 104, 105 not used) | Calculated metrics give the same totals without extra events |
| **No separate Component Type eVar** (eVar70 not used) | Each component has its own events; the rule's link name (`login:click`, `hero:impression`, …) also identifies the component |
| **Department clicks counted once**, by Rule 22 | The site pushes `departmentInteraction` and `departmentCardClick` for the same click. Rule 21 only sends impressions |
| **Don't map `loginComplete`, `membershipEnroll` or the drop-in `sign-in` / `create-account` events** to event93 / event96 | They describe the same moments; only Rules 18 and 20 may set these events |
| Legacy events `heroClick`, `ctaClick`, `navClick`, `searchSubmit`, `filterApply`, `scrollDepth` keep firing on the site | Kept for the existing training rules (Target, AEP). They must not set the variables in this SDR |

---

## 8. Data quality and privacy rules

| Rule | How it is met |
| --- | --- |
| No personal data in any variable | The site never reads form values or credentials. Search terms have emails and long numbers replaced (`[email]`, `[number]`). Navigation reports authored labels (never "Hi, <name>"). Activity Map stays **off** (setup guide 3c) |
| Impressions once per component per page view | `IntersectionObserver` disconnects after the first impression (each block) |
| Login and signup results once per attempt | Guard flags in the blocks; CUG results use a 5-minute `sessionStorage` flag |
| Prerendered pages | Hero and department impressions wait for `prerenderingchange` |
| Link hits survive page changes | `s.useBeacon = true` on click, success and exit hits |
| Values in Tags are read from the pushed message | `%event.message.component.*%`, never the computed state (stale attributes can remain there) |
| Consent | **Open**: `getConsent()` is a placeholder. Rules must be gated on the consent tool before production (BRD NFR-03) |
| Server-call volume | Up to 4 scroll and 7 time hits per page view. Reduce milestones if the contract requires (BRD NFR-05) |

---

## 9. Test cases

Use the Adobe Experience Platform Debugger (*Analytics* tab, *Preserve log*). Update the row's **Status** to *Tested* when it passes.

| # | Action | Expected hit | SDR rows |
| --- | --- | --- | --- |
| T01 | Open `/shop` | `hero:impression`: event90, eVar72 `Shop all departments`, eVar73 `default` | event90, eVar72, eVar73 |
| T02 | Click **Browse all products** in the hero | event91, eVar30 `primary:Browse all products` | event91, eVar30 |
| T03 | Scroll to **Departments** on `/shop` | event97, eVar75 `all-departments` | event97, eVar75 |
| T04 | Click **Shop electronics** | One hit only: event98, eVar75 `electronics`, eVar71 `cta`, eVar72 `Electronics` | event98 |
| T05 | Open **Shop** in the header and click **Fashion** | event114 (`expand`), then event100 with eVar77 `sections:2:Shop:Fashion` | event100, event114, eVar77 |
| T06 | On `/electronics`, change **Brand** | event99, eVar76 `brand:<value>`, eVar75 `electronics` | event99, eVar76 |
| T07 | Change **Sort by** | **No** department filter hit | event99 |
| T08 | Search `headphones` in the Search block on `/shop`, then land on `/products?q=headphones` | event20 (prop41 `unknown`); on the results page no extra event20 | event20, eVar40, prop41 |
| T09 | Type `zzzz` in the product grid search on `/products` and wait 1 s | event20 + event27, eVar43 `product-grid`. Pressing Enter afterwards sends nothing more | event27 |
| T10 | Search `me@example.com` | eVar40 = `[email]` | eVar40 |
| T11 | On `/account` (reset demo profile first), click **Sign in** | event92 (eVar79 `link`), then event93 | event92, event93, eVar79 |
| T12 | On `/membership`, click **Join** | event113 (eVar79 `link:membership`), then event96 | event113, event96 |
| T13 | Scroll a page to the bottom | event106 … event109 once each, prop50 | event106–109, prop50 |
| T14 | Stay active ~13 s, then switch tab | event110 milestone (10), then exit summary with the remaining seconds | event110 |
| T15 | Check all hits | eVar1 = page name; no emails, names or passwords anywhere | eVar1 |
| T16 *(when blocks are published)* | Commerce login with a wrong password | event94, eVar79 `commerce-login` | event94 |
| T17 *(when blocks are published)* | Create an account | event111, event95, event113, event96 | signup rows |

---

## 10. Status, owners and change log

| Area | Owner (role) | Status |
| --- | --- | --- |
| Data layer (site code) | Web developer | Implemented on branch `feature/acdl-tracking`, not merged |
| Report suite variables | Analytics admin | Planned |
| Tags rules 18–27, disable 12 and 15 | Tags / analytics developer | Planned |
| Workspace project and report | Analyst | Planned (template ready: `engagement-report/engagement-report-template.md`) |
| Consent gating | Privacy / legal + developer | Open |
| Sign-off | Business owner, analytics lead, privacy | Open (see BRD section 12) |

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 4 Nov 2026 | First version: navigation, login/signup, department, hero, search and page engagement. Reuses eVar1, eVar30, search variables; retires event10 |
