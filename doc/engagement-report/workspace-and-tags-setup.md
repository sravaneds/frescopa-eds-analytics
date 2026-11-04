# Engagement report: data setup and Analysis Workspace project

This is the build sheet behind the stakeholder report (`engagement-report-template.md`). It lists everything needed to fill the report with real numbers for the **last 30 days compared with the previous 30 days**:

1. [Data readiness](#1-data-readiness): what has to be in place before any number appears
2. [Report suite variables](#2-report-suite-variables)
3. [Tags rules](#3-tags-rules) for navigation, signup, department, scroll, engagement time, hero and search (login is Rule 18 in `doc/login-engagement-analytics-guide.md`)
4. [Segments](#4-segments)
5. [Calculated metrics](#5-calculated-metrics)
6. [The Workspace project](#6-the-workspace-project), panel by panel
7. [Filling the report](#7-filling-the-report): exports and the % change

Data layer events and fields are described in `docs/analytics/adobe-client-data-layer-events.md`. Report suite: `tcsdmprtnrsndbxtcstraining-dev`. Tags property: **Adobe Training Website**.

---

## 1. Data readiness

**The report stays empty until these are done.** Status on 4 November 2026:

| # | Requirement | Needed for | Status |
| --- | --- | --- | --- |
| 1 | Merge `feature/acdl-tracking` into `main`, so the live site pushes the engagement events | All three KPIs | Open (branch pushed, no pull request) |
| 2 | Page view rule (Rule 1) and data elements from `doc/adobe-analytics-setup-guide.md` | Page views, unique visitors, pages, device, traffic source | Unknown (the 30 October assessment found no rules in the library) |
| 3 | Report suite variables in [section 2](#2-report-suite-variables) | All three KPIs | Open |
| 4 | Rule 18 (login) and Rules 19–27 in [section 3](#3-tags-rules); disable Rules 12 and 15 | All three KPIs | Open |
| 5 | Development library built, then a production library before go-live | All three KPIs | Open |
| 6 | **30 + 30 days of data collected** after items 1–5, for a full current and previous period | % change versus the previous period | Not started |
| 7 | Marketing Channel processing rules in the report suite | Traffic source (Last Touch Channel) | Unknown; use **Referrer Type** until they exist |
| 8 | Login and signup blocks published on real pages, with a working backend | Login/signup beyond the demo sign-in link | Open: no page uses them yet |
| 9 | Consent management | Any production reporting | Open: `getConsent()` is a placeholder |

Until item 6 is done, a "previous period" either doesn't exist or is only partly filled, so its % change is meaningless. The template marks it **n/a** in that case.

---

## 2. Report suite variables

**Adobe Analytics → Admin → Report Suites →** `tcsdmprtnrsndbxtcstraining-dev` **→ Edit Settings.** The full variable list, with business questions and data-layer sources, is the SDR: `doc/sdr/engagement-sdr.csv` (summary in `doc/engagement-sdr.md`). If any number is already taken, choose a free one and update the SDR first.

### Success events (*Conversion → Success Events*, type Counter unless noted)

| Event | Name | Fed by |
| --- | --- | --- |
| event92 | Login Clicks | Rule 18 |
| event93 | Login Successes | Rule 18 |
| event94 | Login Failures | Rule 18 |
| event112 | Login Impressions | Rule 18 |
| event111 | Signup Impressions | Rule 20 |
| event113 | Signup Clicks | Rule 20 |
| event95 | Signup Starts | Rule 20 |
| event96 | Signup Completions | Rule 20 |
| event100 | Top Navigation Clicks | Rule 19 |
| event114 | Navigation Menu Toggles | Rule 19 |
| event97 | Department Impressions | Rule 21 |
| event98 | Department Card Clicks | Rule 22 |
| event99 | Department Filter Uses | Rule 23 |
| event106 / 107 / 108 / 109 | Scroll 25 % / 50 % / 75 % / 100 % | Rule 24 |
| event110 | Active Engagement Seconds (**Numeric**) | Rule 25 |
| event90 | Hero Impressions | Rule 26 |
| event91 | Hero CTA Clicks | Rule 26 |
| event103 | Search Result Clicks | Rule 27 |
| event20, event27 | Searches, Null Searches *(already in the setup guide)* | Rule 27 (replaces Rule 12) |
| event10 | Scroll Milestone *(setup guide)* | **Retire**: replaced by event106–109; disable Rule 15 |

### Conversion variables (*Conversion → Conversion Variables*)

| eVar | Name | Expire after | Value |
| --- | --- | --- | --- |
| eVar1 | Page Name *(already in the setup guide)* | Hit | Page name, sent on every engagement hit too |
| eVar30 | CTA Name *(already in the setup guide)* | Hit | `primary:Browse all products` (hero) |
| eVar40 / prop40, eVar43, prop41 | Search Term, Search Type, Search Result Count *(already in the setup guide)* | Visit / Hit | Rule 27 |
| eVar71 | Component Action | Hit | `click`, `impression`, `success`, `expand`, … |
| eVar72 | Component Title | Hit | Hero title, card title or product name |
| eVar73 | Component Variation | Hit | Hero block variant, `default` |
| eVar75 | Department | **Visit** | `electronics`, `fashion`, `home-appliances` |
| eVar76 | Department Filter | Hit | `brand:Aperture` |
| eVar77 | Navigation Item | Hit | `sections:2:Shop:Electronics` (area:level:parent:item) |
| eVar79 | Login / Signup Location | Hit | `commerce-login`, `signup-form`, `link`, … |

### Traffic variable (*Traffic → Traffic Variables*)

| prop | Name | Value |
| --- | --- | --- |
| prop50 | Scroll Milestone | `25%` … `100%` |

> **Why eVar1 on every engagement hit?** Link hits (`s.tl()`) don't carry the page name. Without eVar1, "which pages generate logins / nav clicks" shows *Unspecified*.

---

## 3. Tags rules

All rules follow the same pattern as the setup guide:

```
EVENT       Adobe Client Data Layer → Data Pushed → Specific event → <event name>
ACTIONS     1. Adobe Analytics → Set Variables → Custom code (below)
            2. Adobe Analytics → Send Beacon → s.tl(), Custom Link, link name as given
            3. Adobe Analytics → Clear Variables
```

Each snippet sets `s.linkTrackVars` and `s.linkTrackEvents`, because `s.tl()` hits only send variables listed there. `_satellite.getVar('DL - Page Name')` is the data element from the setup guide (Step 4).

### Rule 18: Login engagement (update)

Use the code in `doc/login-engagement-analytics-guide.md`, Step 3c (it now includes eVar1).

### Rule 19: Top navigation

- **Event:** `topNavInteraction` · **Link name:** `nav:%event.message.component.action%`

```js
var c = event.message.component || {};
s.events = c.action === 'click' ? 'event100' : 'event114';
s.eVar1 = _satellite.getVar('DL - Page Name');
s.eVar71 = c.action;                                  // click | expand | collapse | menu-open | menu-close
s.eVar77 = [c.area, c.level || 1, c.parentItem || '-', c.menuItem].join(':');
s.linkTrackVars = 'events,eVar1,eVar71,eVar77';
s.linkTrackEvents = s.events;
s.useBeacon = true;                                   // nav clicks leave the page
```

### Rule 20: Signup engagement

- **Event:** `signupInteraction` · **Link name:** `signup:%event.message.component.action%`

```js
var c = event.message.component || {};
var counters = { impression: 'event111', click: 'event113', start: 'event95', complete: 'event96' };
s.events = counters[c.action];
s.eVar1 = _satellite.getVar('DL - Page Name');
s.eVar71 = c.action;
s.eVar79 = c.location + (c.method ? ':' + c.method : '');   // signup-form | link:membership
s.linkTrackVars = 'events,eVar1,eVar71,eVar79';
s.linkTrackEvents = s.events;
s.useBeacon = true;
```

### Rule 21: Department interaction

- **Event:** `departmentInteraction` · **Condition:** Value Comparison `%event.message.component.action%` *equals* `impression` · **Link name:** `department:impression`
- Clicks are counted once, by Rule 22. The condition keeps this rule from sending a second hit for the same click.

```js
var c = event.message.component || {};
// impressions only (see the condition); clicks are counted by Rule 22
s.events = 'event97';
s.eVar1 = _satellite.getVar('DL - Page Name');
s.eVar71 = 'impression';
// impressions on the Shop page list several departments ("electronics,fashion,home-appliances")
var dept = c.departmentName || '';
s.eVar75 = dept.indexOf(',') > -1 ? 'all-departments' : dept;
s.linkTrackVars = 'events,eVar1,eVar71,eVar72,eVar75';
s.linkTrackEvents = s.events;
```

### Rule 22: Department card click

- **Event:** `departmentCardClick` · **Link name:** `department:card-click`

```js
var c = event.message.component || {};
s.events = 'event98';
s.eVar1 = _satellite.getVar('DL - Page Name');
s.eVar71 = c.clickType;                               // card | cta
s.eVar72 = c.cardTitle;
s.eVar75 = c.departmentName;
s.linkTrackVars = 'events,eVar1,eVar71,eVar72,eVar75';
s.linkTrackEvents = 'event98';
s.useBeacon = true;
```

### Rule 23: Department filter

- **Event:** `departmentFilterInteraction` · **Link name:** `department:filter`

```js
var c = event.message.component || {};
s.events = 'event99';
s.eVar1 = _satellite.getVar('DL - Page Name');
s.eVar71 = c.action;                                  // apply | clear
s.eVar75 = c.departmentName;
s.eVar76 = c.filterType + ':' + c.filterValue;
s.linkTrackVars = 'events,eVar1,eVar71,eVar75,eVar76';
s.linkTrackEvents = 'event99';
```

### Rule 24: Scroll depth

- **Event:** `pageScrollDepth` · **Link name:** `scroll:%event.message.engagement.milestone%`
- Replaces Rule 15 (legacy `scrollDepth`). Don't run both.

```js
var e = event.message.engagement || {};
var counters = { 25: 'event106', 50: 'event107', 75: 'event108', 100: 'event109' };
s.events = counters[e.scrollDepth];
s.eVar1 = _satellite.getVar('DL - Page Name');
s.prop50 = e.milestone;
s.linkTrackVars = 'events,eVar1,prop50';
s.linkTrackEvents = s.events;
```

### Rule 25: Engagement time

- **Event:** `pageEngagementTime` · **Condition:** Value Comparison `%event.message.engagement.incrementalSeconds%` *is greater than* `0` · **Link name:** `engagement:%event.message.engagement.milestone%`

```js
var e = event.message.engagement || {};
s.events = 'event110=' + e.incrementalSeconds;        // numeric event: adds the seconds
s.eVar1 = _satellite.getVar('DL - Page Name');
s.linkTrackVars = 'events,eVar1';
s.linkTrackEvents = 'event110';
s.useBeacon = true;                                   // exit summaries are sent while the page closes
```

### Rule 26: Hero engagement

- **Event:** `heroBannerInteraction` · **Link name:** `hero:%event.message.component.action%`

```js
var c = event.message.component || {};
s.events = c.action === 'impression' ? 'event90' : 'event91';
s.eVar1 = _satellite.getVar('DL - Page Name');
s.eVar71 = c.action;                                  // impression | click
s.eVar72 = c.title;
s.eVar73 = c.variation;
if (c.action === 'click') s.eVar30 = c.ctaType + ':' + c.ctaText;   // primary | secondary | link
s.linkTrackVars = 'events,eVar1,eVar30,eVar71,eVar72,eVar73';
s.linkTrackEvents = s.events;
s.useBeacon = true;
```

### Rule 27: Search engagement (replaces Rule 12)

- **Event:** `searchInteraction`
- **Condition:** Core → **Custom Code**:

```js
var c = event.message.component || {};
// every search counts. The product grid sends each distinct term once (after an 800 ms typing
// pause or Enter), so a visitor who pauses mid-word can add a partial term: known limitation
if (c.action === 'search') return true;
// header searches show their results (and zero-result state) on the next page
if (c.action === 'results-view') return c.resultCount === 0;
return c.action === 'result-click' || c.action === 'suggestion-click';
```

- **Link name:** `search:%event.message.component.action%`
- **Disable Rule 12** when this rule is published, or searches are counted twice.

```js
var c = event.message.component || {};
var ev = [];
if (c.action === 'search') ev.push('event20');
if ((c.action === 'search' || c.action === 'results-view') && c.resultCount === 0) ev.push('event27');
if (c.action === 'result-click' || c.action === 'suggestion-click') ev.push('event103');
s.events = ev.join(',');
s.eVar1 = _satellite.getVar('DL - Page Name');
s.eVar40 = c.searchTerm || '';                        // already sanitized on the site
s.prop40 = 'D=v40';
s.eVar43 = c.location + (c.scope ? ':' + c.scope : '');
s.prop41 = c.resultCount >= 0 ? String(c.resultCount) : 'unknown';
s.eVar71 = c.action;
s.linkTrackVars = 'events,eVar1,eVar40,prop40,eVar43,prop41,eVar71';
s.linkTrackEvents = 'event20,event27,event103';
s.useBeacon = true;
```

> **Server calls.** Impressions, scroll milestones and engagement time add link hits. Up to 4 scroll + 7 time hits per page view is typical; check this against your Analytics contract. If needed, send only the 50 % and 100 % milestones and the `exit` summary.

Build the library afterwards (**Publishing Flow → Add All Changed Resources → Save & Build to Development**) and test every rule in the Debugger as in the login guide, Step 5.

---

## 4. Segments

**Components → Segments → Create** (or the **+** next to Segments in Workspace). Share them with the report audience.

| Segment | Container | Definition | Used for |
| --- | --- | --- | --- |
| Desktop | Visit | **Mobile Device Type** equals `Other` | Device split |
| Mobile | Visit | **Mobile Device Type** equals `Mobile Phone` | Device split |
| Tablet | Visit | **Mobile Device Type** equals `Tablet` | Device split |
| Department Page Views | Hit | **Page Type (eVar2)** equals `category` | Department KPIs (Electronics, Fashion, Home Appliances) |
| Shop Page Views | Hit | **Page Type (eVar2)** equals `shop` | Department cards on the Shop page |
| Engaged Visits | Visit | **Scroll 50 % (event107)** exists **OR** **Active Engagement Seconds (event110)** is greater than or equal to `10` | Engagement rate |
| Nav Users | Visitor | **Top Navigation Clicks (event100)** exists | Behaviour of navigation users |
| Logged-in Visits | Visit | **Login Successes (event93)** exists | Post-login behaviour |
| Exclude internal traffic | Visit | Exclude **IP / domain** of your office, or a test parameter | Apply to every panel |

> **Mobile Device Type `Other`** means a device that is not a phone or tablet. In practice that is desktop and laptop.

---

## 5. Calculated metrics

**Components → Calculated metrics → Create.** Format percentages as **Percent**, 1 decimal.

| Name | Formula | Notes |
| --- | --- | --- |
| **Nav CTR** | Top Navigation Clicks ÷ Page Views | Share of page views with a nav click |
| **Nav Item CTR** | Top Navigation Clicks ÷ Page Views *(Metric type: **Total**)* | For rows of Navigation Item (eVar77): the gear icon on Page Views → *Metric type: Total*, so every row is divided by all page views |
| **Nav Clicks per Visitor** | Top Navigation Clicks ÷ Unique Visitors | |
| **Login Click Rate** | Login Clicks ÷ Login Impressions | Only the login blocks report impressions |
| **Login Success Rate** | Login Successes ÷ (Login Successes + Login Failures) | Main login KPI |
| **Login Conversion Rate** | Login Successes ÷ Login Clicks | Clicks that ended signed in |
| **Signup Start Rate** | Signup Starts ÷ Signup Impressions | |
| **Signup Conversion Rate** | Signup Completions ÷ Signup Clicks | |
| **Signup Completion Rate** | Signup Completions ÷ Signup Starts | Form abandonment = 1 − this |
| **Department CTR** | Department Card Clicks ÷ Department Impressions | |
| **Engagement Rate** | Visits *(with segment Engaged Visits)* ÷ Visits | Drag the segment onto the Visits metric inside the formula |
| **Avg Active Seconds per Page View** | Active Engagement Seconds ÷ Page Views | More accurate than Time Spent (counts only active, visible time) |
| **Scroll 75 % Reach** | Scroll 75 % ÷ Page Views | Use the same formula with event107/event109 for 50 % / 100 % |
| **Filter Use Rate** | Department Filter Uses ÷ Page Views | Use with segment Department Page Views |
| **Hero CTR** | Hero CTA Clicks ÷ Hero Impressions | |
| **Null Search Rate** | Null Searches ÷ Searches | |
| **All Component Impressions** | Hero Impressions + Department Impressions + Login Impressions + Signup Impressions | Replaces a separate "all impressions" event |
| **All CTA Clicks** | Hero CTA Clicks + Department Card Clicks + Top Navigation Clicks + Login Clicks + Signup Clicks | Replaces a separate "all CTA clicks" event |
| **Overall CTR** | All CTA Clicks ÷ All Component Impressions | Site-wide CTA click-through |

Standard metrics used as-is: **Page Views**, **Visits**, **Unique Visitors**, **Time Spent per Visit (seconds)**, **Average Time on Site**, **Bounce Rate**, **Entries**.

---

## 6. The Workspace project

**Workspace → Create project → Blank project**, then save it as **Engagement report – NovaMart**.

### Date range and comparison

1. In each panel, set the calendar to **Last 30 full days** (e.g. 5 Oct – 3 Nov 2026).
2. To get the previous period: in a Freeform table, right-click a metric column header → **Compare time periods** → **Prior period** (the 30 days before). Workspace adds the previous-period column and a **% change** column.
3. Line charts: set granularity to **Day** and turn on **Show anomalies** in the visualization settings. This marks the days that are out of the expected range, which feeds the "anomalies" part of the report.
4. Drag the segment **Exclude internal traffic** into the drop zone of every panel.

### Panel 0: Executive scorecard

| Visualization | Content |
| --- | --- |
| **Summary Number** × 6 | Nav Clicks, Nav CTR, Login Success Rate, Signup Completions, Department CTR, Engagement Rate |
| **Summary Change** × 6 | The same metrics, comparing the current and previous period (shows the % change arrow) |

### Panel 1: Top navigation

| # | Visualization | Dimension (rows) | Metrics (columns) | Segments / options |
| --- | --- | --- | --- | --- |
| 1.1 | Freeform table | Navigation Item (eVar77) | Top Navigation Clicks, Unique Visitors, Nav Item CTR, % of total clicks | Sort by clicks; Compare time periods → Prior period |
| 1.2 | Line | Day | Top Navigation Clicks, Nav CTR | Show anomalies |
| 1.3 | Freeform table | Page Name (eVar1) | Top Navigation Clicks, Page Views, Nav CTR | Which pages the nav is used from |
| 1.4 | Freeform table | Navigation Item (eVar77) | Top Navigation Clicks | Columns segmented by Desktop / Mobile / Tablet (drag each segment above the metric) |
| 1.5 | Freeform table | Referrer Type (or Last Touch Channel) | Top Navigation Clicks, Unique Visitors, Nav CTR | Traffic source |
| 1.6 | Freeform table | Component Action (eVar71) | Navigation Menu Toggles | Segment Mobile: hamburger `menu-open` vs `menu-close` |
| 1.7 | Bar | Navigation Item (eVar77), **bottom 10** | Top Navigation Clicks | Least used items; check the whole menu is listed (items with 0 clicks are absent) |

### Panel 2: Login and signup

| # | Visualization | Dimension | Metrics | Segments / options |
| --- | --- | --- | --- | --- |
| 2.1 | Freeform table | (none; totals) | Login Impressions, Login Clicks, Login Successes, Login Failures, Login Success Rate, Login Conversion Rate, Unique Visitors | Compare time periods |
| 2.2 | Freeform table | (none) | Signup Impressions, Signup Clicks, Signup Starts, Signup Completions, Signup Start / Conversion / Completion Rate, Unique Visitors | Compare time periods |
| 2.3 | Freeform table: **Login vs Signup** | Component Action (eVar71): `impression`, `click`, `success` / `complete` | Login and signup counters side by side | Two metric groups |
| 2.4 | Freeform table | Login / Signup Location (eVar79) | Login Clicks, Successes, Failures, Success Rate, Signup Clicks, Completions | Entry points compared |
| 2.5 | Freeform table | Page Name (eVar1) | Login Clicks, Signup Clicks | Top 10 pages generating login and signup activity |
| 2.6 | Donut × 2 | Mobile Device Type | Login Clicks / Signup Clicks | Device distribution |
| 2.7 | Line | Day | Login Success Rate, Login Failures, Signup Completions | Show anomalies |
| 2.8 | Fallout | – | Login Impressions → Login Clicks → Login Successes | Second fallout: Signup Impressions → Starts → Clicks → Completions |

### Panel 3: Department engagement

Department pages are `/electronics`, `/fashion`, `/home-appliances` (page type `category`). Department cards are on `/shop`.

| # | Visualization | Dimension | Metrics | Segments / options |
| --- | --- | --- | --- | --- |
| 3.1 | Freeform table: **department ranking** | Category (eVar3) | Page Views, Unique Visitors, Time Spent per Visit, Avg Active Seconds per Page View, Engagement Rate, Scroll 75 % Reach, Department Filter Uses, Bounce Rate | Segment **Department Page Views**; Compare time periods |
| 3.2 | Freeform table | Department (eVar75) | Department Impressions, Department Card Clicks, Department CTR | Department cards and product grids |
| 3.3 | Freeform table | Component Title (eVar72) | Department Card Clicks | Breakdown by Component Action (`card` vs `cta`): top cards and products |
| 3.4 | Freeform table | Department Filter (eVar76) | Department Filter Uses | Breakdown by Department (eVar75): filters that are used |
| 3.5 | Line | Day | Page Views by department (one line per Category) | Segment Department Page Views; show anomalies |
| 3.6 | Bar (stacked) | Category (eVar3) | Scroll 25 / 50 / 75 / 100 % Reach | How far each department page is read |
| 3.7 | Flow | Entry: Page Name = `novamart:shop` | Next page | Which department visitors choose after the Shop page |

**Ranking rule for 3.1.** For each department, rank each metric 1–3 and take the average rank. **Engagement Rate** and **Department CTR** count double. The lowest average is the most engaged department. Write the method in the report, so the ranking can be repeated.

---

## 7. Filling the report

1. Set the date range (section 6) and check the segments are applied.
2. For each panel: panel menu → **Download CSV** (or **Project → Download → CSV**). Name the files `panel1-nav.csv`, `panel2-login-signup.csv`, `panel3-departments.csv`.
3. Copy the numbers into `engagement-report-template.md`:
   - **% change** = (current − previous) ÷ previous × 100. Workspace shows it already when *Compare time periods* is used.
   - Write **n/a** when the previous value is 0 or the previous period isn't fully collected (section 1, item 6).
   - For rates (CTR, success rate), report the change in **percentage points** (pp) as well, e.g. *62.0 % → 65.5 % (+3.5 pp, +5.6 %)*.
4. Charts: in Workspace, right-click a visualization → **Copy image** (or **Share → Download PDF**), then paste it into the slide or document version of the report.
5. If you'd like help with the write-up, share the three CSV exports (no personal data is in them) and the analysis can be drafted from the real numbers.
