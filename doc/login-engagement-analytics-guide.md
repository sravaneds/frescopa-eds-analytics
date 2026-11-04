# Login engagement analytics: a beginner's step-by-step guide

This guide takes you from "the website sends login events" to "I can see a login report in Adobe Analytics". It assumes no previous Adobe experience. Do the steps in order and don't skip the checks.

**What you will have at the end:** a report that shows, for every place visitors can log in:

| Number | Meaning |
| --- | --- |
| Login impressions | How many times a login form was seen |
| Login clicks | How many times someone pressed **Sign in** |
| Login successes | How many sign-ins worked |
| Login failures | How many sign-ins were rejected |
| Login success rate | Successes ÷ (successes + failures), e.g. 92 % |

**Time needed:** about 1 hour of setup, then 30–90 minutes of waiting before data shows up in reports.

---

## Contents

1. [The big picture](#1-the-big-picture)
2. [Words you need to know](#2-words-you-need-to-know)
3. [What is already done and what you do](#3-what-is-already-done-and-what-you-do)
4. [Before you start](#4-before-you-start)
5. [Step 1: See the login events on the website](#step-1-see-the-login-events-on-the-website)
6. [Step 2: Create the variables in Adobe Analytics](#step-2-create-the-variables-in-adobe-analytics)
7. [Step 3: Create the rule in Adobe Tags](#step-3-create-the-rule-in-adobe-tags)
8. [Step 4: Publish the Tags library](#step-4-publish-the-tags-library)
9. [Step 5: Test with the Adobe Experience Platform Debugger](#step-5-test-with-the-adobe-experience-platform-debugger)
10. [Step 6: Build the login report in Analysis Workspace](#step-6-build-the-login-report-in-analysis-workspace)
11. [Step 7 (optional): Get an alert when logins start failing](#step-7-optional-get-an-alert-when-logins-start-failing)
12. [Troubleshooting](#troubleshooting)
13. [Limitations today](#limitations-today)
14. [Checklist](#checklist)

---

## 1. The big picture

Data travels through four stations. Think of it as a parcel being posted:

```
 1. WEBSITE                2. DATA LAYER             3. ADOBE TAGS              4. ADOBE ANALYTICS
 Visitor clicks       →    The site writes a    →    A rule reads the     →    Stores the hit and
 "Sign in"                 note: "loginInter-        note and sends it         shows it in reports
                           action, click"            to Analytics              (Analysis Workspace)
   (already done)            (already done)            (YOU set this up)         (YOU set this up)
```

- The **website** and the **data layer** are already done: the code is in the blocks.
- You set up **Adobe Tags** (the postman) and **Adobe Analytics** (the post office and its reports).

---

## 2. Words you need to know

| Word | Plain meaning | In this project |
| --- | --- | --- |
| **Data layer** | A list in the browser where the website writes notes about what the visitor does | `window.adobeDataLayer` |
| **Event (data layer)** | One note in that list, with a name and details | `loginInteraction` with `action: 'click'` |
| **Adobe Tags** (old name: Launch) | Adobe's tool that reads the data layer and sends data to Analytics. You configure it in the browser, no coding on the site | Property "Adobe Training Website" |
| **Rule** | An "if this happens, do that" instruction in Tags | "If `loginInteraction` is pushed, send a login hit" |
| **Library** | The published version of your Tags rules. Changes only reach the website after you build it | Development library, already linked in `head.html` |
| **Report suite** | The database in Adobe Analytics where hits are stored | `tcsdmprtnrsndbxtcstraining-dev` |
| **Hit / beacon** | One message sent from the browser to Analytics | One login click = one hit |
| **Success event** | A counter in Analytics (counts things) | event92 = Login Clicks |
| **eVar** | A text label stored with the hit, used to split numbers | eVar79 = Login Location (`commerce-login`, `link`, …) |
| **Analysis Workspace** | The Adobe Analytics screen where you build reports by drag and drop | |
| **Calculated metric** | A formula built from other numbers | Login Success Rate |
| **Debugger** | A free Chrome extension that shows what Tags sends to Analytics | Adobe Experience Platform Debugger |

---

## 3. What is already done and what you do

### Already done on the website

Every login form pushes one data layer event, `loginInteraction`. `component.action` says what happened:

| `component.action` | When it fires |
| --- | --- |
| `impression` | The login form is half visible on screen (once per page view) |
| `click` | The visitor presses **Sign in** (or Enter) |
| `success` | The sign-in worked |
| `failure` | The sign-in was rejected (wrong password, server error) |

`component.location` says *which* login form was used:

| `component.location` | Login form | Code |
| --- | --- | --- |
| `login-form` | Closed user group (CUG) login page | `blocks/login-form/login-form.js` (success reported by `blocks/header/renderCugUser.js`) |
| `commerce-login` | Adobe Commerce sign-in page | `blocks/commerce-login/commerce-login.js` |
| `header-dropdown` | Sign-in box in the storefront header | `blocks/header/renderAuthDropdown.js` |
| `link` | Demo **Sign in** link on the training site's Account page | `scripts/aep/tracking.js` |

Example of what the website writes when someone clicks **Sign in**:

```js
{
  event: 'loginInteraction',
  component: { type: 'login', location: 'commerce-login', ctaText: 'Sign in', action: 'click' }
}
```

No email address or password is ever written to the data layer.

### What you do

| Step | Where | What |
| --- | --- | --- |
| 1 | Browser | Check that the events appear |
| 2 | Adobe Analytics | Create 4 counters and 2 labels |
| 3 | Adobe Tags | Create 1 rule |
| 4 | Adobe Tags | Publish the library |
| 5 | Browser + Debugger | Check that hits are sent |
| 6 | Analysis Workspace | Build the report |
| 7 | Analysis Workspace | (Optional) set an alert |

---

## 4. Before you start

### Access

| You need | Where to check | Ask for it from |
| --- | --- | --- |
| Adobe Experience Cloud login | https://experience.adobe.com | Your Adobe admin |
| **Edit** rights on Tags property "Adobe Training Website" | Data Collection → Tags | Your Tags admin |
| **Admin** rights on report suite `tcsdmprtnrsndbxtcstraining-dev` (Step 2 only) | Adobe Analytics → Admin → Report Suites | Your Analytics admin |
| Analysis Workspace access to that report suite | Adobe Analytics → Workspace | Your Analytics admin |

### Tools

1. **Google Chrome.**
2. **Adobe Experience Platform Debugger** extension: open the Chrome Web Store, search for "Adobe Experience Platform Debugger", click **Add to Chrome**, then pin it (puzzle icon → pin).

### Which website to test on

The login tracking code is on the branch `feature/acdl-tracking` (not yet merged into `main`), so use the **branch preview**:

https://feature-acdl-tracking--frescopa-eds-analytics--sravaneds.aem.page/account

After the pull request is merged, the same steps work on the main site.

---

## Step 1: See the login events on the website

This proves the website part works before you touch any Adobe tool.

1. Open https://feature-acdl-tracking--frescopa-eds-analytics--sravaneds.aem.page/account in Chrome.
2. If the page already says you are signed in, scroll to the footer and click **Reset demo profile**.
3. Open the browser console: press **F12** (Mac: **Cmd + Option + J**), then click the **Console** tab.
4. Click the gear icon in the console and tick **Preserve log**. The demo sign-in reloads the page, and without this the console is emptied.
5. Paste this into the console and press **Enter**. It prints every login event the page writes from now on:

   ```js
   window.adobeDataLayer.push = ((push) => function (...items) {
     items.forEach((i) => i && i.event === 'loginInteraction' && console.log('LOGIN EVENT', i.component));
     return push.apply(this, items);
   })(window.adobeDataLayer.push);
   ```

   Chrome may ask you to type `allow pasting` first. Type it, press Enter, then paste again.
6. Click the **Sign in** link on the Account page. The page reloads after a moment.

**Expected:** two lines in the console:

```
LOGIN EVENT {type: 'login', location: 'link', method: 'demo', action: 'click'}
LOGIN EVENT {type: 'login', location: 'link', method: 'demo', action: 'success'}
```

If you see them, the website part works. Go to Step 2.

---

## Step 2: Create the variables in Adobe Analytics

Analytics only stores numbers it knows about, so you first create "boxes" for them.

1. Go to https://experience.adobe.com → **Adobe Analytics** → **Admin** (top menu) → **Report Suites**.
2. Tick the report suite `tcsdmprtnrsndbxtcstraining-dev`.
3. Click **Edit Settings** → **Conversion** → **Success Events**.
4. Find each event number below, type the **Name**, set **Type** to **Counter**, and leave the rest as it is:

   | Event | Name | Type |
   | --- | --- | --- |
   | event112 | Login Impressions | Counter |
   | event92 | Login Clicks | Counter |
   | event93 | Login Successes | Counter |
   | event94 | Login Failures | Counter |

5. Click **Save**.
6. Go to **Edit Settings** → **Conversion** → **Conversion Variables**.
7. Find each eVar below, set **Status** to **Enabled**, fill in the fields, then **Save**:

   | eVar | Name | Expire After | Allocation |
   | --- | --- | --- | --- |
   | eVar79 | Login Location | Hit | Most Recent (Last) |
   | eVar71 | Component Action | Hit | Most Recent (Last) |

> **eVar1 (Page Name)** and the data element `DL - Page Name` come from `doc/adobe-analytics-setup-guide.md` (Steps 2 and 4). If they don't exist yet, create them first: Rule 18 uses them to record the page each login happened on.

> **If a number is already used** (it already has a name), pick another free number and write your numbers down. Use them everywhere this guide says event92 / eVar79 and so on.

---

## Step 3: Create the rule in Adobe Tags

The rule says: *"When the website writes a `loginInteraction` note, send it to Analytics."*

1. Go to https://experience.adobe.com → **Data Collection** → **Tags** → open property **Adobe Training Website**.
2. **Check the extensions first:** click **Extensions** → **Installed**. You need **Adobe Client Data Layer** and **Adobe Analytics**. If Adobe Client Data Layer is missing: **Catalog** → search it → **Install** → *Data Layer object name* `adobeDataLayer` → **Save**.
3. Click **Rules** → **Add Rule**.
4. **Name:** `Rule 18: Login engagement`

### 3a. The event (WHEN the rule runs)

1. Under **EVENTS**, click **Add**.
2. **Extension:** Adobe Client Data Layer
3. **Event Type:** Data Pushed
4. **Listen to:** Specific event
5. **Event/Key to register for:** `loginInteraction` (exactly like this: capital I, no spaces)
6. Click **Keep Changes**.

### 3b. The condition (ONLY IF)

1. Under **CONDITIONS**, click **Add**.
2. **Extension:** Core · **Condition Type:** Value Comparison
3. **Left operand:** `%event.message.component.action%`
4. **Operator:** Matches Regex
5. **Right operand:** `^(impression|click|success|failure)$`
6. Click **Keep Changes**.

### 3c. Action 1: Set Variables (WHAT to send)

1. Under **ACTIONS**, click **Add**.
2. **Extension:** Adobe Analytics · **Action Type:** Set Variables
3. Scroll down to **Custom Code** → **Open Editor**, paste the code below, then **Save** → **Keep Changes**.

```js
// The data layer note that triggered this rule
var c = event.message.component || {};

// Which Analytics counter belongs to which login action
var counters = {
  impression: 'event112', // Login Impressions
  click: 'event92',       // Login Clicks
  success: 'event93',     // Login Successes
  failure: 'event94'      // Login Failures
};

s.events = counters[c.action];
s.eVar71 = c.action;      // impression | click | success | failure
s.eVar79 = c.location;    // login-form | commerce-login | header-dropdown | link
// Link hits don't carry the page name, so send it in eVar1 (lets you report "logins by page")
s.eVar1 = _satellite.getVar('DL - Page Name');

// A successful sign-in redirects at once; useBeacon makes sure the hit is still delivered
s.useBeacon = true;

// Link hits (s.tl) only send variables that are listed here
s.linkTrackVars = 'events,eVar1,eVar71,eVar79';
s.linkTrackEvents = s.events;
```

> If you used other numbers in Step 2, change them in this code.

### 3d. Action 2: Send Beacon (SEND it)

1. **Add** another action → **Extension:** Adobe Analytics · **Action Type:** Send Beacon
2. Choose **s.tl()** (link tracking, *not* s.t()). This keeps login hits from counting as extra page views.
3. **Link Type:** Custom Link · **Link Name:** `login:%event.message.component.action%`
4. **Keep Changes**.

### 3e. Action 3: Clear Variables (CLEAN UP)

1. **Add** another action → **Extension:** Adobe Analytics · **Action Type:** Clear Variables
2. **Keep Changes**.

The order must be: **Set Variables → Send Beacon → Clear Variables**. Click **Save** for the rule.

---

## Step 4: Publish the Tags library

Your rule is saved but not yet on the website.

1. In the Tags property, click **Publishing Flow**.
2. Open your existing **Development** library (or **Add Library** → name `login analytics` → Environment **Development** → **Save**).
3. Click **Add All Changed Resources**.
4. Click **Save & Build to Development**.
5. Wait until the library shows a **green dot** (about 1 minute).

The website already loads the development library (`head.html`), so nothing changes on the site itself.

---

## Step 5: Test with the Adobe Experience Platform Debugger

1. Open https://feature-acdl-tracking--frescopa-eds-analytics--sravaneds.aem.page/account
2. If you're already signed in, click **Reset demo profile** in the footer.
3. Click the **Debugger** icon in Chrome, then **Analytics** in its left menu.
4. Turn on **Preserve log** (top of the Debugger) so hits are kept when the page reloads.
5. Click the **Sign in** link on the page.

**Expected:** two new rows (hits) in the Debugger:

| Hit | Must show |
| --- | --- |
| 1 | `events` = **event92**, `eVar71` = **click**, `eVar79` = **link**, `eVar1` = **novamart:account**, link name `login:click` |
| 2 | `events` = **event93**, `eVar71` = **success**, `eVar79` = **link**, link name `login:success` |

Also check:
- Report suite = `tcsdmprtnrsndbxtcstraining-dev`.
- No email address or person's name appears in any field.

If you see both hits, the setup works.

---

## Step 6: Build the login report in Analysis Workspace

Data normally appears **30–90 minutes** after the test. Do a few test logins first.

### 6a. Create the calculated metrics (once)

1. **Adobe Analytics** → **Components** → **Calculated metrics** → **Create metric**.
2. **Login Success Rate**
   - Title: `Login Success Rate`
   - Drag **Login Successes** into the definition box.
   - Click the operator and choose **÷** (divide).
   - Click **Add → Container**, and inside it drag **Login Successes**, operator **+**, **Login Failures**.
   - The result reads: *Login Successes ÷ (Login Successes + Login Failures)*.
   - **Format:** Percent, **Decimal places:** 1 → **Save**.
3. Repeat for:

   | Title | Formula | Format |
   | --- | --- | --- |
   | `Login Failure Rate` | Login Failures ÷ (Login Successes + Login Failures) | Percent |
   | `Login Click Rate` | Login Clicks ÷ Login Impressions | Percent |

### 6b. Create the project

1. **Workspace** → **Create project** → **Blank project** → **Create**.
2. Top right: choose report suite `tcsdmprtnrsndbxtcstraining-dev`.
3. Set the date range (calendar at the top of the panel), e.g. **Last 7 days**.
4. Save the project as **Login engagement**.

### 6c. Table 1: logins by location

1. A **Freeform table** is already in the panel.
2. From the left rail, drag **Login Location (eVar79)** into the table's dimension area ("Drop a dimension here").
3. Drag these metrics into the column area, one next to the other: **Login Impressions**, **Login Clicks**, **Login Successes**, **Login Failures**, **Login Success Rate**.

You get one row per login form, for example:

| Login Location | Impressions | Clicks | Successes | Failures | Success Rate |
| --- | --- | --- | --- | --- | --- |
| commerce-login | 1,200 | 400 | 360 | 40 | 90.0 % |
| header-dropdown | – | 150 | 120 | 30 | 80.0 % |
| link | – | 50 | 50 | 0 | 100.0 % |

The header dropdown and the demo link have no impressions, because only the login blocks report them.

### 6d. Chart: success rate over time

1. Drag a **Line** visualization (left rail → visualizations icon) into the panel.
2. Drag **Login Success Rate** in as the metric, and set the dimension to **Day**.

### 6e. Funnel: where visitors drop off

1. Drag a **Fallout** visualization into the panel.
2. Drag **Login Impressions**, then **Login Clicks**, then **Login Successes** in as the three touchpoints.

This shows how many people saw a login form, tried to log in, and actually got in.

### 6f. Useful extra breakdowns

| Question | Do this |
| --- | --- |
| Which pages make people log in? | Freeform table: **Page** (or Page Name) × Login Clicks |
| Do failures happen more on phones? | Right-click Login Failures → **Breakdown** → **Mobile Device Type** |

Click **Save**.

---

## Step 7 (optional): Get an alert when logins start failing

1. **Components** → **Alerts** → **Add**.
2. **Alert title:** `Login success rate dropped`
3. **Time granularity:** Daily.
4. **Metric:** Login Success Rate · **Is below** · `80` %.
5. **Recipients:** your email → **Save**.

To send the report every week: in the Workspace project, **Share** → **Send file on schedule**.

---

## Troubleshooting

| Problem | Likely cause | Fix |
| --- | --- | --- |
| No `LOGIN EVENT` lines in the console (Step 1) | Not on the branch preview, or the page reloaded and cleared the console | Use the `feature-acdl-tracking--…` URL; tick **Preserve log** |
| No Analytics hit in the Debugger | Library not built, or rule not in the library | Step 4 again; check the green dot and that Rule 18 is in the library |
| Hit appears but `events` is empty | Typo in the event name or custom code | Event/Key must be exactly `loginInteraction`; compare the code with Step 3c |
| Hit appears but eVar79 is missing | `linkTrackVars` missing in the code | Make sure `s.linkTrackVars = 'events,eVar1,eVar71,eVar79';` is there |
| eVar1 is empty on login hits | Data element `DL - Page Name` missing | Create it (setup guide, Step 4) |
| Success hit missing after a redirect | Page left before the hit was sent | Keep `s.useBeacon = true;` in the code |
| Hits go to the wrong report suite | Adobe Analytics extension setting | Extensions → Adobe Analytics → Configure → Report Suites |
| Numbers show in Debugger but not in Workspace | Processing delay | Wait 30–90 minutes; check the date range includes today |
| Success counted twice | Another rule (e.g. on `loginComplete`) also sets event93 | Only Rule 18 may set event93 |

---

## Limitations today

- **Only the demo sign-in can be tested right now.** No published page contains the Login Form or Commerce Login block yet. To test impressions, failures and real sign-ins, an author has to add one of those blocks to a page, and the matching login backend (`/auth/login` for CUG, or Adobe Commerce) has to work.
- **The demo sign-in never fails**, so Login Failures stays at 0 until a real login form is used.
- **The tracking code is on the branch `feature/acdl-tracking`.** The main site only sends these events after the pull request is merged.
- **No consent banner yet.** `getConsent()` in `scripts/scripts.js` is a placeholder. Before real visitors, add a condition to Rule 18 that checks your consent tool.
- **Details of every login event** (all fields, all trigger rules) are in `docs/analytics/adobe-client-data-layer-events.md`, section 2.2.

---

## Checklist

- [ ] Step 1: `LOGIN EVENT … click` and `… success` seen in the console
- [ ] Step 2: event92, event93, event94, event112, eVar71, eVar79 created in the report suite
- [ ] Step 3: Rule 18 created with event, condition and three actions in the right order
- [ ] Step 4: Development library built (green dot)
- [ ] Step 5: Two hits seen in the Debugger with the right events and eVars
- [ ] Step 6: Calculated metrics and the **Login engagement** project created
- [ ] Step 7: (Optional) alert set
