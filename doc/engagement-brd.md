# Engagement analytics: Business Requirements Document (BRD)

| | |
| --- | --- |
| **Document** | Business Requirements Document: engagement analytics |
| **Version** | 1.0 (draft for review) · 4 November 2026 |
| **Site** | NovaMart training site on AEM Edge Delivery Services (`https://main--frescopa-eds-analytics--sravaneds.aem.page/`) |
| **Analytics** | Adobe Analytics, report suite `tcsdmprtnrsndbxtcstraining-dev`, via Adobe Tags property *Adobe Training Website* and the Adobe Client Data Layer |
| **Solution design** | [`engagement-sdr.md`](engagement-sdr.md) and [`sdr/engagement-sdr.csv`](sdr/engagement-sdr.csv) |
| **Related** | Event reference [`../docs/analytics/adobe-client-data-layer-events.md`](../docs/analytics/adobe-client-data-layer-events.md) · Report template [`engagement-report/engagement-report-template.md`](engagement-report/engagement-report-template.md) · Setup [`engagement-report/workspace-and-tags-setup.md`](engagement-report/workspace-and-tags-setup.md) |
| **Status** | Draft: targets and open questions (section 13) to be agreed with the business |

---

## Contents

1. [Purpose](#1-purpose)
2. [Background and current state](#2-background-and-current-state)
3. [Business objectives](#3-business-objectives)
4. [Stakeholders](#4-stakeholders)
5. [Scope](#5-scope)
6. [KPIs and definitions](#6-kpis-and-definitions)
7. [Business questions](#7-business-questions)
8. [Business requirements](#8-business-requirements)
9. [Reporting requirements](#9-reporting-requirements)
10. [Data and tracking requirements](#10-data-and-tracking-requirements)
11. [Non-functional requirements](#11-non-functional-requirements)
12. [Assumptions, dependencies and constraints](#12-assumptions-dependencies-and-constraints)
13. [Risks and open questions](#13-risks-and-open-questions)
14. [Acceptance criteria and sign-off](#14-acceptance-criteria-and-sign-off)
15. [Traceability matrix](#15-traceability-matrix)
16. [Glossary](#16-glossary)

---

## 1. Purpose

This document defines **what the business needs to know about visitor engagement** on the NovaMart site, and the requirements the analytics implementation and reports must meet. It covers:

- **Top navigation bar** interactions
- **Login and signup** engagement
- **Department** engagement (Electronics, Fashion, Home Appliances)
- Supporting engagement: **hero banners**, **search** and **page engagement** (scroll depth, active time)

*How* each requirement is implemented (variables, rules, data layer) is in the SDR. This BRD is the agreement on *what* and *why*.

---

## 2. Background and current state

| Topic | Current state (4 Nov 2026) |
| --- | --- |
| Site | NovaMart, a fictional training store on AEM Edge Delivery Services. Every page uses the `aep-training` template |
| Departments | `/electronics`, `/fashion`, `/home-appliances` (page type `category`), reached from the **Departments** cards on `/shop` and the **Shop** menu |
| Login / signup | Demo sign-in link (`/account`) and Rewards enrollment (`/membership`) are live. The real login blocks (CUG Login Form, Commerce Login, header sign-in dropdown) and the Commerce signup block exist in the code but are **not used on any published page** |
| Data layer | Engagement events are implemented in the blocks (Adobe Client Data Layer, inline `window.adobeDataLayer.push()`), on branch `feature/acdl-tracking`, **not merged** |
| Adobe Tags | Development library loads on every page; at the last assessment (30 Oct 2026) it had **no rules**, so **no Analytics hits were sent** |
| Adobe Analytics | Report suite exists; engagement variables not yet created |
| Consent | No consent banner; `getConsent()` is a placeholder |

---

## 3. Business objectives

| ID | Objective | How analytics supports it |
| --- | --- | --- |
| BO-1 | Help visitors find products and departments faster | Show which navigation items and department entry points are used, and which are ignored |
| BO-2 | Grow the number of signed-in and registered customers | Measure login and signup funnels, find where visitors drop off or fail |
| BO-3 | Increase engagement with department pages and their products | Rank departments by engagement and clicks, and show which content works |
| BO-4 | Base site changes on evidence | Give a monthly report with trends, comparisons and recommendations, and success measures for each change |

---

## 4. Stakeholders

| Role | Interest | Responsibility in this project |
| --- | --- | --- |
| Business owner (e-commerce / digital) | Engagement and conversion | Approves KPIs, targets and this BRD |
| Merchandising / category managers | Department performance | Use the department section; act on recommendations |
| UX / content team | Navigation and page content | Use navigation and content insights; run tests |
| CRM / loyalty team | Logins, signups, Rewards | Use the login/signup section |
| Analytics lead / analyst | Data quality and reporting | Owns the SDR, Workspace project and monthly report |
| Tags / analytics developer | Implementation | Builds rules, data elements and libraries |
| Web developer (AEM EDS) | Site code | Owns the data layer events in the blocks |
| Privacy / legal | Compliance | Approves data collected and consent approach |

---

## 5. Scope

### In scope

| Area | Included |
| --- | --- |
| Navigation | Header links (brand, top-level, submenus, tools: Account, Wishlist, Cart), submenu and mobile menu toggles, both header variants |
| Login / signup | Impressions, clicks, success and failure of every login entry point; signup impression, start, click and completion; Rewards enrollment |
| Departments | Department page views, visitors, time, engagement rate, scroll depth; department card and product card clicks; department filters |
| Supporting | Hero impressions and CTA clicks; search usage, null searches and result clicks; site-wide scroll depth and active engagement time |
| Reporting | Analysis Workspace project, monthly stakeholder report (last 30 days vs previous 30 days), alerts |

### Out of scope

| Item | Reason / where handled |
| --- | --- |
| Product, cart, checkout and order analytics | Covered by the existing KPI/SDR guide (`kpi-and-sdr-guide.md`) |
| Personalization / Adobe Target reporting | Separate training material (`docs/aep-training/`) |
| Desktop hover on menus | Hover is not an intentional interaction; only clicks are tracked |
| Personal data (email, name, customer ID in engagement reports) | Not allowed (NFR-02) |
| Web SDK / AEP migration | Possible later; the data layer design supports it |

---

## 6. KPIs and definitions

Targets are **to be agreed** (section 13, Q1). The first full 30-day period sets the baseline.

| KPI | Definition | Formula | Target |
| --- | --- | --- | --- |
| Navigation clicks | Clicks on header links | count | TBD |
| Nav CTR | Share of page views with a navigation click | nav clicks ÷ page views | TBD |
| Login clicks | Sign-in attempts | count | TBD |
| **Login success rate** | Attempts that succeed | successes ÷ (successes + failures) | TBD (suggested start: ≥ 90 %) |
| Login conversion rate | Clicks that end signed in | successes ÷ clicks | TBD |
| Signup starts | Visitors who begin the signup form | count | TBD |
| **Signup conversion rate** | Signup CTA clicks that complete | completions ÷ signup clicks | TBD |
| Signup completion rate | Started forms that complete | completions ÷ starts | TBD |
| Department page views / visitors | Visits to department pages | count | TBD |
| **Department CTR** | Department sections that lead to a card click | card clicks ÷ department impressions | TBD |
| **Engagement rate** | Visits that are engaged | visits with ≥ 50 % scroll or ≥ 10 active seconds ÷ visits | TBD |
| Active time per page view | Active, visible time | active seconds ÷ page views | TBD |
| Scroll 75 % reach | Page views read to 75 % | 75 % milestones ÷ page views | TBD |
| Hero CTR | Hero banners that are clicked | hero clicks ÷ hero impressions | TBD |
| Null search rate | Searches with no results | null searches ÷ searches | TBD (lower is better) |

---

## 7. Business questions

| # | Question | KPI area |
| --- | --- | --- |
| Q-01 | Which navigation items are used most, and which are never used? | Navigation |
| Q-02 | Does navigation usage differ between desktop, mobile and tablet, and by traffic source? | Navigation |
| Q-03 | From which pages do visitors rely on the menu? | Navigation |
| Q-04 | How many visitors try to log in, and how many succeed? | Login |
| Q-05 | Which login entry point works best and which fails most? | Login |
| Q-06 | Where do visitors drop out of signup? | Signup |
| Q-07 | How does login engagement compare with signup engagement, by page and device? | Login / signup |
| Q-08 | Which department is most and least engaging? | Department |
| Q-09 | Do visitors read department pages and click products, or leave? | Department |
| Q-10 | Which department cards and filters do visitors use? | Department |
| Q-11 | Which hero banners and CTAs work? | Supporting |
| Q-12 | What do visitors search for, and how often do they find nothing? | Supporting |
| Q-13 | Did engagement improve compared with the previous period, and after a site change? | All |

---

## 8. Business requirements

Priority: **M** must, **S** should, **C** could (MoSCoW).

### Navigation

| ID | Requirement | Priority | Acceptance criteria | Questions |
| --- | --- | --- | --- | --- |
| BR-01 | Count clicks for every navigation item (brand, top-level, submenu, tools), identified by its label and position in the menu | M | Every header link appears as a row with its clicks; submenu items show their parent (e.g. *Shop › Electronics*) | Q-01 |
| BR-02 | Report Nav CTR, unique visitors and daily trend for the navigation and for each item | M | Report shows clicks, unique visitors, CTR, a daily trend and % change vs previous period | Q-01, Q-13 |
| BR-03 | Break down navigation clicks by page, device type and traffic source | M | Tables by page name, by desktop / mobile / tablet, and by traffic source | Q-02, Q-03 |
| BR-04 | Measure menu opening (submenus, mobile menu), to find menus that are opened but not used | S | Menu toggles counted separately from link clicks | Q-01, Q-02 |

### Login and signup

| ID | Requirement | Priority | Acceptance criteria | Questions |
| --- | --- | --- | --- | --- |
| BR-05 | Measure the login funnel (form seen, sign-in clicked, success, failure) for every login entry point | M | Four counters, split by entry point (CUG login page, Commerce login page, header dropdown, demo link) | Q-04, Q-05 |
| BR-06 | Report login success rate and login conversion rate | M | Both rates in the report with % change vs previous period | Q-04 |
| BR-07 | Measure the signup funnel (form seen, started, CTA clicked, completed), including Rewards enrollment | M | Four counters and the start, conversion and completion rates | Q-06 |
| BR-08 | Compare login and signup engagement by page and device | M | Side-by-side table; top 10 pages; device distribution | Q-07 |
| BR-09 | Alert the business when login success drops or failures spike | S | Alert on Login Success Rate (threshold agreed in Q1) | Q-04 |

### Departments

| ID | Requirement | Priority | Acceptance criteria | Questions |
| --- | --- | --- | --- | --- |
| BR-10 | Report page views, unique visitors and time spent per department page | M | One row per department with the three metrics and % change | Q-08 |
| BR-11 | Report engagement per department: engagement rate, active time, scroll depth | M | Engagement rate, active seconds per page view and scroll reach per department | Q-08, Q-09 |
| BR-12 | Count clicks on department cards (Shop page) and on product cards of department pages, separating card links from CTAs | M | Card clicks and Department CTR per department; card vs CTA split; top cards/products | Q-09, Q-10 |
| BR-13 | Measure department filter usage | S | Filter uses per department and per filter (sorting excluded) | Q-10 |
| BR-14 | Rank departments with a documented, repeatable method | S | Ranking table and the method stated in the report | Q-08 |

### Supporting engagement

| ID | Requirement | Priority | Acceptance criteria | Questions |
| --- | --- | --- | --- | --- |
| BR-15 | Measure hero banner impressions and CTA clicks by banner, variation and CTA (primary / secondary) | S | Hero CTR by title, variation and CTA | Q-11 |
| BR-16 | Measure searches, null searches and search result clicks, with the search term | S | Searches, null search rate and top terms; terms contain no personal data | Q-12 |
| BR-17 | Measure scroll depth (25 / 50 / 75 / 100 %) and active engagement time on every page | M | Scroll reach and active time per page; basis of the engagement rate | Q-09, Q-13 |
| BR-18 | Report an overall CTA click-through rate across components | C | Calculated overall CTR | Q-13 |

---

## 9. Reporting requirements

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| RR-01 | Monthly stakeholder report for the **last 30 days compared with the previous 30 days** | M | Report follows `engagement-report/engagement-report-template.md` |
| RR-02 | Executive summary with the KPI scorecard, % change (and percentage points for rates), key findings and top 3 recommendations | M | Present on page 1 |
| RR-03 | Daily trend charts with anomalies marked | M | Line charts with *Show anomalies* for navigation, login and departments |
| RR-04 | Breakdowns by device type (desktop / mobile / tablet) and traffic source | M | Segments and tables as in the setup guide, section 6 |
| RR-05 | Top-performing and lowest-performing items: navigation links, pages, departments, user actions | M | Ranked tables in each section and a top-performers summary |
| RR-06 | Actionable recommendations, each with evidence, owner and success measure | M | Recommendation tables in each section |
| RR-07 | Shared Analysis Workspace project for self-service | M | Project *Engagement report – NovaMart* shared with stakeholders |
| RR-08 | Alerts for login success rate (and optional others) | S | Alert configured, recipients agreed |
| RR-09 | Internal and test traffic excluded | M | Segment *Exclude internal traffic* applied to every panel |

---

## 10. Data and tracking requirements

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| DR-01 | Interactions are sent to the Adobe Client Data Layer with `window.adobeDataLayer.push()`, using the agreed event names (`topNavInteraction`, `loginInteraction`, `signupInteraction`, `departmentInteraction`, `departmentCardClick`, `departmentFilterInteraction`, `heroBannerInteraction`, `searchInteraction`, `pageScrollDepth`, `pageEngagementTime`) | M | Events visible in `window.adobeDataLayer`; payloads as in the event reference |
| DR-02 | Impressions fire once per component per page view, when the component is visible (50 %; 25 % for tall product grids) | M | Scrolling back and forth does not repeat impressions; hidden personalization variants never fire |
| DR-03 | One event per interaction; login/signup results once per attempt | M | No duplicate pushes in QA (SDR test cases T01–T17) |
| DR-04 | No personal data: no form values, passwords, emails, names; search terms sanitized | M | Privacy review passed; `[email]` / `[number]` replacements verified |
| DR-05 | Every engagement hit carries the page name | M | eVar1 populated on all engagement link hits |
| DR-06 | Department components are identified by authorable rules (Cards variant *departments*, section metadata, or a section heading containing "department"; department pages by page metadata) | M | Department events only on department components; other Cards blocks (e.g. Collections) send none |
| DR-07 | Each analytics variable has one meaning. Existing variables are reused where the meaning matches; duplicates are retired | M | SDR section 7 decisions applied; Rules 12 and 15 disabled when replaced |
| DR-08 | Existing site behaviour and existing data layer events are unchanged | M | Regression check of blocks; legacy events still fire |
| DR-09 | Tags rules read values from the pushed event message, not from the computed data layer state | M | Rule code as in the setup guide |

---

## 11. Non-functional requirements

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| NFR-01 | **Performance:** tracking must not delay page rendering (no impact on LCP); no third-party libraries added | M | PageSpeed Insights score on the branch preview not lower than on `main` |
| NFR-02 | **Privacy:** compliant with the company privacy policy and GDPR/CCPA as applicable; no PII in Analytics | M | Privacy sign-off |
| NFR-03 | **Consent:** analytics hits sent only with visitor consent (production) | M | CMP installed and Tags rules gated before go-live |
| NFR-04 | **Reliability:** analytics errors never break the page; clicks that navigate are still delivered | M | `useBeacon` on navigating and exit hits; no console errors from tracking |
| NFR-05 | **Server-call budget:** engagement hits fit the Analytics contract | S | Calls per page view estimated and approved; milestones reduced if needed |
| NFR-06 | **Data latency:** standard Analytics processing (30–90 minutes) is acceptable; monthly reporting | M | Agreed |
| NFR-07 | **Maintainability:** tracking code lives in the block where the interaction happens; documented in the SDR and event reference | M | Each block self-contained; SDR updated before any variable change |
| NFR-08 | **Browser support:** current versions of Chrome, Edge, Safari, Firefox (desktop and mobile); older browsers without IntersectionObserver lose impressions only | S | QA on these browsers |

---

## 12. Assumptions, dependencies and constraints

| Type | Item |
| --- | --- |
| Dependency | Branch `feature/acdl-tracking` reviewed and merged into `main` |
| Dependency | Report suite admin creates the variables (SDR sections 3–4) |
| Dependency | Tags developer builds Rules 18–27, disables Rules 12 and 15, publishes development then production libraries |
| Dependency | Page view rule and data elements from `adobe-analytics-setup-guide.md` (Rule 1, `DL - Page Name`) are in place |
| Dependency | Authors publish pages with the Login Form / Commerce Login / Commerce Create Account blocks, and the login backends (`/auth/login`, Adobe Commerce) work, before real login/signup KPIs exist |
| Dependency | Marketing Channel processing rules configured for traffic-source reporting (else *Referrer Type* is used) |
| Assumption | Desktop is reported as Mobile Device Type `Other` |
| Assumption | An engaged visit = ≥ 50 % scroll or ≥ 10 active seconds (to confirm, Q2) |
| Assumption | The CUG login result is inferred on the next page view (success within 5 minutes, failure via `?error=`) |
| Constraint | The site is a training store: traffic is low and mostly internal, so results are indicative until real traffic exists |
| Constraint | 60 days of collected data are needed before the first report with a full previous period |

---

## 13. Risks and open questions

### Risks

| # | Risk | Impact | Mitigation |
| --- | --- | --- | --- |
| R1 | Double counting with legacy rules (`heroClick`, `ctaClick`, `searchSubmit`, `scrollDepth`, `loginComplete`) | Inflated KPIs | Only the SDR rules set engagement variables; disable Rules 12 and 15 (SDR section 7) |
| R2 | No consent management | Cannot go live in production | CMP and rule gating before go-live (NFR-03) |
| R3 | Demo sign-in and Rewards links always succeed | Login success rate looks perfect | Segment or filter out eVar79 `link` / `link:demo` for production KPIs (Q5) |
| R4 | Hits lost when the page navigates | Under-counted clicks and successes | `s.useBeacon = true` in rules |
| R5 | Partial search terms counted when visitors pause while typing in the product grid | Slightly inflated searches | Known limitation; monitor top terms |
| R6 | Time Spent metrics miss the last page of a visit | Under-stated time | Use Active Engagement Seconds as the primary time metric |
| R7 | Server-call volume from impressions and milestones | Cost | Estimate and reduce milestones if needed (NFR-05) |
| R8 | Login and signup blocks not published | No real funnel data | Authoring task and backend readiness (section 12) |

### Open questions for the business

| # | Question | Owner |
| --- | --- | --- |
| Q1 | What are the targets for each KPI (section 6) and the alert threshold for login success? | Business owner |
| Q2 | Do you agree with the definition of an engaged visit (≥ 50 % scroll or ≥ 10 active seconds)? | Business owner, analyst |
| Q3 | Should hero and search be part of the monthly report, or only available in Workspace? | Business owner |
| Q4 | Who receives the monthly report and alerts? | Business owner |
| Q5 | Should demo and Rewards links be excluded from login/signup KPIs in production? | CRM / loyalty |
| Q6 | Which consent tool will be used, and does analytics need opt-in or opt-out? | Privacy / legal |
| Q7 | Is the server-call increase approved? | Analytics lead |

---

## 14. Acceptance criteria and sign-off

The implementation is accepted when:

1. All **Must** requirements (BR, RR, DR, NFR) meet their acceptance criteria.
2. Every SDR row has status **Tested** (SDR test cases T01–T15; T16–T17 once the login and signup blocks are published).
3. The Workspace project returns data for all three KPI areas for at least 7 days.
4. Privacy has approved the data collected and the consent approach.
5. The first monthly report has been produced from the template and reviewed with stakeholders.

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Business owner | | Approve / Reject | |
| Analytics lead | | Approve / Reject | |
| Privacy / legal | | Approve / Reject | |
| Web development lead | | Approve / Reject | |

---

## 15. Traceability matrix

| Requirement | Data layer event | SDR variables | Tags rule | Report section |
| --- | --- | --- | --- | --- |
| BR-01 | `topNavInteraction` click | event100, eVar77 | 19 | 2.2 |
| BR-02 | `topNavInteraction` click | event100, eVar77, Nav CTR | 19 | 2.1, 2.2 |
| BR-03 | `topNavInteraction` click | event100, eVar1, Mobile Device Type, Referrer Type / Last Touch Channel | 19 | 2.3 |
| BR-04 | `topNavInteraction` expand / collapse / menu-open / menu-close | event114, eVar71 | 19 | 2.1 |
| BR-05 | `loginInteraction` | event112, event92, event93, event94, eVar79 | 18 | 3.1, 3.3 |
| BR-06 | `loginInteraction` | Login Success Rate, Login Conversion Rate | 18 | 3.1 |
| BR-07 | `signupInteraction` | event111, event95, event113, event96, rates | 20 | 3.1, 3.2 |
| BR-08 | `loginInteraction`, `signupInteraction` | eVar1, eVar79, Mobile Device Type | 18, 20 | 3.2, 3.4, 3.5 |
| BR-09 | `loginInteraction` | Login Success Rate (alert) | 18 | 3.6, Alerts |
| BR-10 | page view | Page Views, Unique Visitors, Time Spent, eVar2, eVar3 | 1 | 4.1 |
| BR-11 | `pageScrollDepth`, `pageEngagementTime` | event106–109, event110, Engagement Rate | 24, 25 | 4.1, 4.3 |
| BR-12 | `departmentInteraction` impression, `departmentCardClick` | event97, event98, eVar71, eVar72, eVar75 | 21, 22 | 4.1, 4.2 |
| BR-13 | `departmentFilterInteraction` | event99, eVar76 | 23 | 4.3 |
| BR-14 | all department data | Ranking method | – | 4.1 |
| BR-15 | `heroBannerInteraction` | event90, event91, eVar30, eVar72, eVar73 | 26 | Workspace |
| BR-16 | `searchInteraction` | event20, event27, event103, eVar40, eVar43, prop41 | 27 | Workspace |
| BR-17 | `pageScrollDepth`, `pageEngagementTime` | event106–109, prop50, event110 | 24, 25 | Scorecard, 4.3 |
| BR-18 | all component events | All CTA Clicks, All Component Impressions, Overall CTR | – | Scorecard |

---

## 16. Glossary

| Term | Meaning |
| --- | --- |
| Adobe Client Data Layer (ACDL) | A JavaScript list (`window.adobeDataLayer`) where the site records interactions for analytics tools |
| Adobe Tags | Adobe's tag manager; its rules send data layer events to Adobe Analytics |
| Report suite | The Adobe Analytics database the data is stored in |
| Success event | A counter metric in Analytics (e.g. Login Clicks) |
| eVar / prop | Dimensions (labels) used to break down metrics; eVars can persist (e.g. for a visit) |
| Calculated metric | A metric built with a formula (e.g. a rate) |
| Segment | A filter on visitors, visits or hits (e.g. mobile visits) |
| Impression | A component was visible on screen |
| CTR | Click-through rate: clicks ÷ impressions (or page views) |
| SDR | Solution Design Reference: the variable-by-variable implementation design |
| CUG | Closed user group: the server-side login used by the Login Form block |
