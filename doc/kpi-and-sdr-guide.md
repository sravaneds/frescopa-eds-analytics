# KPIs, Solution Design Reference (SDR) and e-commerce journey analysis

**For:** someone new to Adobe Analytics, working on the NovaMart training site
(`https://main--frescopa-eds-analytics--sravaneds.aem.page/`)
**Builds on:** [Adobe Analytics setup guide](adobe-analytics-setup-guide.md) (same variable numbers) and the
[readiness assessment](../docs/analytics-assessment/README.md)

**Files that come with this guide:**

| File | What it is |
| --- | --- |
| [`sdr/novamart-sdr.csv`](sdr/novamart-sdr.csv) | The SDR itself: every variable, what it means, where its value comes from, and which KPI uses it. Open it in Excel or Google Sheets |
| [`sdr/product-classification.csv`](sdr/product-classification.csv) | Product details (name, brand, category, price) for the 24 NovaMart products, ready to upload as an Analytics **classification** |

---

## Contents

1. [The ideas in five minutes](#1-the-ideas-in-five-minutes)
2. [KPI 1: Product Analysis](#2-kpi-1-product-analysis)
3. [KPI 2: Orders / Transactions Insights](#3-kpi-2-orders--transactions-insights)
4. [What an SDR is, and how to build one (step by step)](#4-what-an-sdr-is-and-how-to-build-one-step-by-step)
5. [The NovaMart SDR for these two KPIs](#5-the-novamart-sdr-for-these-two-kpis)
6. [Implementing it (what to change in Analytics and Tags)](#6-implementing-it-what-to-change-in-analytics-and-tags)
7. [E-commerce journey analysis](#7-e-commerce-journey-analysis)
8. [Your first week: a learning plan](#8-your-first-week-a-learning-plan)
9. [Things to confirm with the business](#9-things-to-confirm-with-the-business)

---

## 1. The ideas in five minutes

| Term | Meaning | NovaMart example |
| --- | --- | --- |
| **Business question** | Something a person needs to know to decide | "Which products get looked at but not bought?" |
| **KPI** (Key Performance Indicator) | A small set of measures that answer business questions, tracked over time | *Product Analysis*, *Orders / Transactions Insights* |
| **Metric** | A number you count or calculate | Product Views, Orders, Revenue |
| **Dimension** | A way to slice a metric | Product, Category, Brand, Product List, Payment Method |
| **Calculated metric** | A formula built from metrics in Analytics | Average Order Value = Revenue ÷ Orders |
| **SDR** (Solution Design Reference) | The **blueprint** that connects each business question → metric/dimension → Analytics variable → data-layer value → Tags rule | The table in section 5 and `sdr/novamart-sdr.csv` |
| **Data layer** | What the website already tells Tags about the page and actions | `adobeDataLayer.push({ event: 'cartAdd', eventInfo: { productId: 'EL-1008', quantity: 1 } })` |

**The chain you'll always follow:**

```
Business question → KPI → metrics + dimensions → Analytics variables (eVar / prop / event)
      → data-layer value (what the site sends) → Tags rule (how it's sent) → report (how it's read)
```

If you can fill in every link of that chain for a question, your implementation will work.

---

## 2. KPI 1: Product Analysis

### Description

**Product Analysis** shows how shoppers **discover, consider and buy** each product: how often it's seen in a list,
clicked, viewed on its detail page, added to the cart, removed, and finally ordered, and how much revenue it brings.
It helps merchandisers decide which products to promote, re-price, re-photograph or drop, and which lists, carousels
and searches send shoppers to products that sell.

### Business questions it answers

1. Which products, categories and brands get the most **views**, and which turn those views into **sales**?
2. Which products are **viewed but rarely added to the cart**? (Price, images or description may be the problem.)
3. Which products are **added to the cart but often removed or not bought**?
4. Which **product lists** (Shop carousel, category grid, recommendations, search results) produce the most clicks
   and revenue?
5. Does a product's **position** in a list change how often it's clicked?
6. Which products get **saved to the wishlist** (interest without purchase)?

### Metrics

| Metric | Type | Definition on NovaMart | Comes from (data layer) |
| --- | --- | --- | --- |
| Product List Views | Counter (event21) | A product grid or carousel became half visible | `productListImpression` |
| Product Clicks | Counter (event22) | A product card was clicked in a list | `productClick`, `productCarouselClick`, `recommendationClick` |
| Product Views | Standard (prodView) | A product detail page was shown | `productView` |
| Cart Additions | Standard (scAdd) | A product was added (or its quantity increased) | `cartAdd` |
| Cart Removals | Standard (scRemove) | A product was removed (or its quantity decreased) | `cartRemove` |
| Wishlist Adds | Counter (event42) | Heart / "Add to wishlist" | `wishlistAdd` |
| Orders, Units, Revenue | Standard (purchase) | Ordered products (from KPI 2) | `checkoutComplete` |

### Calculated metrics (create in Analysis Workspace → Components → Calculated metrics)

| Calculated metric | Formula | What "good" looks like |
| --- | --- | --- |
| **List click-through rate** | Product Clicks ÷ Product List Views | Higher = the list shows the right products |
| **View-to-cart rate** | Cart Additions ÷ Product Views | Higher = the PDP convinces |
| **Cart removal rate** | Cart Removals ÷ Cart Additions | Lower = fewer second thoughts |
| **Product conversion rate** | Orders ÷ Product Views | The headline product KPI |
| **Revenue per product view** | Revenue ÷ Product Views | Compares products fairly regardless of traffic |

### Dimensions

| Dimension | Variable | Source |
| --- | --- | --- |
| Product (SKU) | `s.products` | `productId` (e.g. `EL-1008`) |
| Product Name, Brand, Category, List Price | **Classifications** of Products | `sdr/product-classification.csv` (uploaded once) |
| Product List Name | eVar12 (merchandising) | `listName` (e.g. `featured-for-you-electronics`, `cart`, `wishlist`) |
| Product List Position | eVar13 (merchandising) | `position` |
| Cart Add Source | eVar14 (merchandising) | `source` (`pdp`, list name, `cart-quantity`, `wishlist`) |
| Page Type | eVar2 / prop1 | `page.pageType` |

> **Why classifications?** The site only needs to send the SKU. Name, brand, category and price are attached in
> Analytics from the uploaded file, so they stay consistent even if a product name changes on one page.

### Example reports (Analysis Workspace)

| Visualisation | Rows | Columns |
| --- | --- | --- |
| Freeform table: "Product funnel" | Products (or Product Category classification) | Product Views, Cart Additions, View-to-cart rate, Orders, Revenue, Product conversion rate |
| Freeform table: "Which lists sell" | Product List Name (eVar12) | Product Clicks, Cart Additions, Orders, Revenue |
| Scatter plot: "Viewed but not bought" | Products | X = Product Views, Y = Product conversion rate |
| Freeform table: "Position effect" | Product List Position (eVar13) | Product Clicks, List click-through rate |

---

## 3. KPI 2: Orders / Transactions Insights

### Description

**Orders / Transactions Insights** shows how many orders the site takes, how big they are, how they're paid and
shipped, how discounts affect them, and how many shoppers who start checking out actually finish. It helps the
business track sales performance, spot checkout problems, measure coupon campaigns and understand new versus
repeat customers.

### Business questions it answers

1. How many **orders** and how much **revenue** per day, week and month?
2. What is the **average order value (AOV)** and **units per order**? Are they going up?
3. What share of visits end in an order (**conversion rate**)? What share of checkouts finish?
4. Which **coupons** are used, and how much **discount** do they cost?
5. Which **shipping** and **payment** methods do shoppers choose?
6. How much revenue comes from **new** versus **repeat** customers?
7. Where in checkout do shoppers **drop out**?

### Metrics

| Metric | Type | Definition on NovaMart | Comes from |
| --- | --- | --- | --- |
| Orders | Standard (purchase) | Order placed | `checkoutComplete` |
| Revenue | Standard (from `s.products` price) | **Product revenue** = price × quantity (excludes tax and shipping; see section 9) | `checkoutComplete.products[]` |
| Units | Standard | Sum of quantities in the order | `checkoutComplete.products[].quantity` |
| Order Discount | Currency event (event80) | Coupon discount amount | `checkoutComplete.discount` |
| Shipping Amount | Currency event (event81) | Shipping charged | `checkoutComplete.shipping` |
| Tax Amount | Currency event (event82) | Tax charged | `checkoutComplete.tax` |
| Checkouts | Standard (scCheckout) | Checkout opened with items | `checkoutStart` |
| Carts | Standard (scOpen) | First item added to an empty cart | `cartOpen` |
| Coupon Applied / Invalid Coupon | Counters (event39 / event40) | Coupon accepted / rejected | `couponApply` (`couponStatus`) |
| Checkout Step | Counter (event45) | Each checkout step reached | `checkoutStep`, `shippingSelect`, `paymentSelect` |
| Visits | Standard | Sessions | automatic |

### Calculated metrics

| Calculated metric | Formula |
| --- | --- |
| **Average Order Value (AOV)** | Revenue ÷ Orders |
| **Units per Order** | Units ÷ Orders |
| **Conversion rate** | Orders ÷ Visits |
| **Checkout completion rate** | Orders ÷ Checkouts |
| **Cart-to-order rate** | Orders ÷ Carts |
| **Cart abandonment rate** | 1 − (Orders ÷ Carts) |
| **Discount share** | Order Discount ÷ Revenue |
| **Total order value incl. tax and shipping** | Revenue + Shipping Amount + Tax Amount − Order Discount |

### Dimensions

| Dimension | Variable | Source |
| --- | --- | --- |
| Order ID | `s.purchaseID` (deduplication) + eVar48 (to report on it) | `orderId` (e.g. `NM-394674`) |
| Coupon Code | eVar6 | `couponCode` (`SAVE10`, `WELCOME15`, `VIP20`, `FREESHIP`) |
| Shipping Method | eVar46 | `shippingMethod` (`standard`, `express`, `next-day`, `pickup`) |
| Payment Method | eVar47 | `paymentMethod` (`credit-card`, `paypal`, `apple-pay`, `gift-card`) |
| New vs Repeat Customer | eVar49 | `user.orderCount` at purchase: `0` → `new`, otherwise `repeat` |
| Checkout Step | eVar45 | `checkoutStep` |
| Audience Type | eVar20 | `user.audienceType` |
| Product, Category, Brand | `s.products` + classifications | as KPI 1 |

### Example reports

| Visualisation | Rows | Columns |
| --- | --- | --- |
| Line chart: "Sales trend" | Day | Orders, Revenue, AOV |
| Freeform table: "Coupons" | Coupon Code (eVar6) | Orders, Revenue, Order Discount, Discount share |
| Freeform table: "Payment and shipping mix" | Payment Method (eVar47) × Shipping Method (eVar46) | Orders, Revenue |
| Freeform table: "New vs repeat" | New vs Repeat Customer (eVar49) | Orders, Revenue, AOV |
| Fallout: "Checkout" | Checkouts → Checkout Step = shipping-method → Checkout Step = payment → Orders | — |

---

## 4. What an SDR is, and how to build one (step by step)

An **SDR** is one spreadsheet that everyone (business, analyst, developer, QA) agrees on. Each row is one Analytics
variable, and the row says **why it exists, what goes in it, where the value comes from and how it's sent**. Without an
SDR, variables get reused for different things and reports become untrustworthy.

### The columns of a good SDR

| Column | Example |
| --- | --- |
| KPI | Orders / Transactions Insights |
| Business question | Which coupons drive orders? |
| Variable | eVar6 |
| Friendly name | Coupon Code |
| Type / settings | eVar, expire on Purchase, Most recent |
| Description | Coupon code applied to the order |
| Example value | `SAVE10` |
| Data-layer source | `checkoutComplete.eventInfo.couponCode` |
| Set on (Tags rule) | Rule 11: Purchase |
| Hit type | `s.tl()` link hit |
| Page / block | `/checkout` → Checkout block |
| Owner, status, notes | Analytics team, implemented, empty when no coupon |

### Steps (do them in this order)

**Step 1: Write the business questions.** Ask the people who will use the reports: "What do you want to decide?"
Write each answer as a question (see sections 2 and 3). *Don't start from variables.*

**Step 2: Group the questions into KPIs.** Here: *Product Analysis* and *Orders / Transactions Insights*.

**Step 3: For each question, list the metrics and dimensions.** "Which coupons drive orders?" → metrics Orders,
Revenue, Order Discount; dimension Coupon Code.

**Step 4: Check what the website already sends.** Open the site with `?aep-debug=1`, or run
`adobeDataLayer.getState()` in the console. The site's event list is in Step 1 of the
[setup guide](adobe-analytics-setup-guide.md#step-1-see-the-data-layer-for-yourself). Write down the exact name of
each value, e.g. `checkoutComplete.eventInfo.couponCode`. **If a value isn't sent, note it as a gap. Don't invent it.**

**Step 5: Choose an Analytics variable for each item.**
- Counting something → a **success event** (`purchase`, `scAdd` or a custom `eventNN`)
- Money that isn't product revenue (tax, discount) → a **currency event**
- A description that should be remembered until a later success (coupon code until purchase, list name until the
  product is bought) → an **eVar** with the right **expiration**
- A description for that one hit only → a **prop**
- Product details that never change → **classifications** of the Products variable

**Step 6: Decide the settings.** For each eVar: expiration (Hit, Visit, Purchase) and allocation (usually *Most
recent*). For product-related eVars: **merchandising, product syntax**.

**Step 7: Map each variable to a Tags rule.** Which data-layer message sets it, and does it go on a page-view hit
(`s.t()`) or a link hit (`s.tl()`)?

**Step 8: Review the SDR with the business, privacy and the developer.** Check that no variable holds personal data
(email, name, phone). Check the definitions, especially **revenue**. Sign it off.

**Step 9: Build it.** Create the variables in the report suite (Admin), then the Tags data elements and rules
(section 6).

**Step 10: Test against the SDR.** For every row, do the action and check the value in the Experience Platform
Debugger. Mark the row's status as *Tested*.

**Step 11: Build the reports** (sections 2, 3 and 7) and share them.

**Step 12: Keep the SDR alive.** Every new variable, change or retirement is recorded in the SDR first.

---

## 5. The NovaMart SDR for these two KPIs

The full version, with data-layer paths, rules, example values and status, is in
[`sdr/novamart-sdr.csv`](sdr/novamart-sdr.csv). Summary:

### Success events

| Variable | Name | KPI | Data-layer source | Rule |
| --- | --- | --- | --- | --- |
| prodView | Product Views | Product | `productView` | 4 |
| event21 | Product List Views | Product | `productListImpression` | 2 |
| event22 | Product Clicks | Product | `productClick`, `productCarouselClick`, `recommendationClick` | 3 |
| scOpen | Carts | Orders | `cartOpen` | 5 |
| scAdd | Cart Additions | Product, Orders | `cartAdd` | 6 |
| scRemove | Cart Removals | Product | `cartRemove` | 7 |
| scView | Cart Views | Orders | `cartView` | 8 |
| scCheckout | Checkouts | Orders | `checkoutStart` | 9 |
| event45 | Checkout Step | Orders | `checkoutStep`, `shippingSelect`, `paymentSelect` | 10 |
| purchase | Orders / Units / Revenue | Both | `checkoutComplete` | 11 |
| event39 | Coupon Applied | Orders | `couponApply` (`couponStatus = success`) | **16 (new)** |
| event40 | Invalid Coupon | Orders | `couponApply` (`couponStatus = invalid`) | **16 (new)** |
| event42 | Wishlist Adds | Product | `wishlistAdd` | **17 (new)** |
| event80 | Order Discount (currency) | Orders | `checkoutComplete.discount` | 11 (extended) |
| event81 | Shipping Amount (currency) | Orders | `checkoutComplete.shipping` | 11 (extended) |
| event82 | Tax Amount (currency) | Orders | `checkoutComplete.tax` | 11 (extended) |

### Conversion variables (eVars)

| Variable | Name | Expire | KPI | Data-layer source |
| --- | --- | --- | --- | --- |
| eVar6 | Coupon Code | Purchase | Orders | `couponApply.couponCode`, `checkoutComplete.couponCode` |
| eVar12 | Product List Name *(merch, product syntax)* | Purchase | Product | `listName` |
| eVar13 | Product List Position *(merch, product syntax)* | Purchase | Product | `position` |
| eVar14 | Cart Add Source *(merch, product syntax)* | Purchase | Product | `cartAdd.source` |
| eVar45 | Checkout Step | Hit | Orders | `checkoutStep` |
| eVar46 | Shipping Method | Purchase | Orders | `shippingMethod` |
| eVar47 | Payment Method | Purchase | Orders | `paymentMethod` |
| eVar48 | Order ID | Hit | Orders | `checkoutComplete.orderId` |
| eVar49 | New vs Repeat Customer | Hit | Orders | `user.orderCount` (state) |

### Products variable and classifications

| Variable | Content | Classification columns |
| --- | --- | --- |
| `s.products` | `;SKU;quantity;line revenue;events;merch eVars` | Product Name, Brand, Category, List Price ([`sdr/product-classification.csv`](sdr/product-classification.csv)) |

### Known gaps (don't build these yet)

| Gap | Why |
| --- | --- |
| Product variant / colour | Chosen on the PDP but not sent with `cartAdd` (assessment, section 2.3) |
| Unique order IDs | Random 6-digit IDs on the demo store; collisions are possible |
| Real revenue | Demo checkout; no payment provider or order system |
| Stock / availability | Not available in the site data |

---

## 6. Implementing it (what to change in Analytics and Tags)

Do the [setup guide](adobe-analytics-setup-guide.md) first (Rules 1–15). Then add the items below.

### 6a. Report suite (Admin → Report Suites → Edit Settings)

| Where | Add |
| --- | --- |
| Conversion → Success Events | event39 *Coupon Applied* (Counter), event40 *Invalid Coupon* (Counter), event42 *Wishlist Adds* (Counter), event80 *Order Discount* (**Currency**), event81 *Shipping Amount* (**Currency**), event82 *Tax Amount* (**Currency**) |
| Conversion → Conversion Variables | eVar6 *Coupon Code* (expire **Purchase**), eVar48 *Order ID* (expire **Hit**), eVar49 *New vs Repeat Customer* (expire **Hit**) |
| Conversion → Conversion Variables | Check eVar12, eVar13, eVar14 are **Merchandising: Enabled, Product Syntax** |
| Traffic → Classifications | Variable **Products** → add classifications *Product Name*, *Brand*, *Category*, *List Price* |

### 6b. Upload the product classification

1. **Admin → Classification Importer → Download Template** for the Products variable (this shows the exact column
   headers your report suite expects).
2. Copy the rows from [`sdr/product-classification.csv`](sdr/product-classification.csv) into the template. The `Key`
   column is the SKU that the site sends (`EL-1001`…).
3. **Import File**, choose the report suite, and wait for processing (it can take a few hours).
4. Check: in Workspace, drag **Products → Category** into a table. You should see `electronics`, `fashion` and
   `home-appliances`.

### 6c. Tags: extend Rule 11 (Purchase)

Replace the custom code of Rule 11 with:

```js
var info = event.message.eventInfo;
s.purchaseID = info.orderId;
s.eVar48 = info.orderId;
s.eVar6 = info.couponCode || '';
s.eVar46 = info.shippingMethod;
s.eVar47 = info.paymentMethod;
// orderCount is the visitor's order count when the page loaded (before this order)
s.eVar49 = Number(adobeDataLayer.getState('user.orderCount') || 0) > 0 ? 'repeat' : 'new';
s.products = (info.products || []).map(function (p) {
  return ';' + p.productId + ';' + p.quantity + ';' + (p.price * p.quantity).toFixed(2);
}).join(',');
var ev = ['purchase'];
if (info.discount > 0) ev.push('event80=' + Number(info.discount).toFixed(2));
if (info.shipping > 0) ev.push('event81=' + Number(info.shipping).toFixed(2));
if (info.tax > 0) ev.push('event82=' + Number(info.tax).toFixed(2));
s.events = ev.join(',');
s.useBeacon = true;
s.linkTrackVars = 'products,events,purchaseID,eVar6,eVar46,eVar47,eVar48,eVar49';
s.linkTrackEvents = 'purchase,event80,event81,event82';
```

### 6d. Tags: Rule 16 (new): Coupon applied

- **Event:** Adobe Client Data Layer → Data Pushed → `couponApply`
- **Set Variables → custom code:**

```js
var info = event.message.eventInfo;
s.eVar6 = info.couponCode;
s.events = info.couponStatus === 'success' ? 'event39' : 'event40';
s.linkTrackVars = 'eVar6,events';
s.linkTrackEvents = 'event39,event40';
```

- **Send Beacon:** `s.tl()`, Other, `coupon` · **Clear Variables**

### 6e. Tags: Rule 17 (new): Wishlist add

- **Event:** Data Pushed → `wishlistAdd`
- **Set Variables → custom code:**

```js
var info = event.message.eventInfo;
s.products = ';' + info.productId + ';;;;eVar14=wishlist-' + (info.source || 'unknown');
s.events = 'event42';
s.linkTrackVars = 'products,events';
s.linkTrackEvents = 'event42';
```

- **Send Beacon:** `s.tl()`, Other, `wishlist add` · **Clear Variables**

### 6f. Test it

| Do this on the preview | Check in Experience Platform Debugger |
| --- | --- |
| Product page → heart (wishlist) | `event42`, `products=;EL-…;;;;eVar14=wishlist-pdp` |
| Cart → apply `BOGUS` | `event40`, `eVar6=BOGUS` |
| Cart → apply `SAVE10` | `event39`, `eVar6=SAVE10` |
| Place an order with Express + PayPal | `purchase`, `event80` (discount), `event81=14.99`, `event82` (tax), `eVar46=express`, `eVar47=paypal`, `eVar48=NM-…`, `eVar49=new` |
| Place a second order | `eVar49=repeat` |
| Check every hit | No email address, no names |

---

## 7. E-commerce journey analysis

### What it is

**E-commerce journey analysis** follows shoppers through the steps from arriving on the site to placing an order.
It measures how many continue at each step and where they leave. Both KPIs live inside this journey: *Product
Analysis* covers the first half (discover → consider → add), and *Orders / Transactions Insights* covers the second
half (cart → checkout → order).

### The NovaMart journey

```
 1 ARRIVE        2 DISCOVER            3 CONSIDER          4 INTENT          5 CART           6 CHECKOUT                 7 ORDER
 Home / Shop  →  Lists & search    →   Product page    →   Add to cart   →   Cart page    →   Shipping → Payment     →   Confirmation
 (pageView)      (event21, event22,    (prodView)          (scAdd, scOpen)   (scView,         (scCheckout, event45)      (purchase)
                  event20)                                                    scRemove,
                                                                              event39/40)
 └──────────── KPI 1: Product Analysis ─────────────────────────────┘└──────── KPI 2: Orders / Transactions Insights ─────┘
```

| Step | Pages / blocks on NovaMart | Measured by | Question to ask | If shoppers drop here, check… |
| --- | --- | --- | --- | --- |
| 1 Arrive | Home, Shop, category pages (Hero, Cards, Banner) | Visits, Page Views (`pageView`) | Where do visitors land and from which campaign? | Landing-page relevance, campaign targeting |
| 2 Discover | Product Grid, Product Carousel, Search block, header search | event21 List Views, event22 Clicks, event20 Searches, event27 Null Searches | Do lists and search lead to products? | List CTR, null-search terms, list position |
| 3 Consider | Product page (Product Info, Tabs, Reviews) | prodView | Which products get attention? | Images, price, reviews, description |
| 4 Intent | "Add to cart" on PDP, cards, wishlist | scAdd, scOpen | Do product views turn into cart adds? | View-to-cart rate, price, stock |
| 5 Cart | Cart page | scView, scRemove, coupon events | Do carts move to checkout? | Removals, coupon errors, shipping cost surprise |
| 6 Checkout | Checkout page (address → shipping → payment) | scCheckout, event45 + eVar45 | Which step loses people? | Form errors, shipping options, payment options |
| 7 Order | Order confirmation | purchase, Revenue, AOV | How much and how often do people buy? | Coupon use, new vs repeat, AOV |

### How to build the journey reports (Analysis Workspace)

1. **Fallout (the funnel):** Workspace → Visualizations → **Fallout**. Drop these touchpoints in order:
   - Visits
   - Product List Views (event21)
   - Product Views (prodView)
   - Cart Additions (scAdd)
   - Checkouts (scCheckout)
   - Orders (purchase)

   The chart shows the percentage that continues at each step. The biggest drop is where to look first.
2. **Checkout fallout:** a second Fallout with Checkouts → Checkout Step = `shipping-method` → Checkout Step =
   `payment` → Orders.
3. **Flow:** Visualizations → **Flow**, entry dimension *Page Name*. Shows the real paths, for example
   `novamart:shop` → `novamart:products:…` → `novamart:cart`.
4. **Segments to compare** (Components → Segments, then drag onto the Fallout):
   - *Visits with a search* (event20 exists)
   - *Visits from a campaign* (Tracking Code exists)
   - *New vs repeat customers* (eVar49)
   - *Electronics vs fashion* (Products → Category classification)
5. **Product journey table:** Products as rows and the KPI 1 metrics as columns. It shows the funnel per product.

### Reading the journey (worked example)

| Step | Count | Continues to next step |
| --- | --- | --- |
| Visits | 1,000 | 62 % see a product list |
| Product List Views | 620 | 45 % view a product |
| Product Views | 280 | 25 % add to cart |
| Cart Additions | 70 | 57 % start checkout |
| Checkouts | 40 | 75 % order |
| Orders | 30 | Conversion rate 3 % · AOV = Revenue ÷ 30 |

*Example numbers, for illustration only.* Here the biggest relative drop is **Product View → Cart Addition** (75 %
leave). Use the KPI 1 table to find which products have the lowest view-to-cart rate.

---

## 8. Your first week: a learning plan

| Day | Do | Learn |
| --- | --- | --- |
| 1 | Open the site with `?aep-debug=1`; shop, add to cart, check out; watch the event log | What the data layer is |
| 2 | Read sections 2–5 of this guide; open `sdr/novamart-sdr.csv` | KPIs, metrics, dimensions, SDR |
| 3 | Follow the [setup guide](adobe-analytics-setup-guide.md) Steps 2–4 (report suite, extensions, data elements) | Admin and Tags basics |
| 4 | Build Rules 1–11, then section 6 of this guide (Rules 16–17, extended Rule 11) | Rules and `s.products` |
| 5 | Test with the Debugger (tables in the setup guide and section 6f) | QA against the SDR |
| 6 | Upload the classification; build the KPI tables and the Fallout | Reporting |
| 7 | Present the journey: where is the biggest drop, and which products cause it? | Turning data into answers |

---

## 9. Things to confirm with the business

| Question | Why it matters |
| --- | --- |
| Is **Revenue** product revenue only (this guide) or including tax and shipping? | Changes every revenue and AOV number |
| Which system gives **real order IDs** when the site moves beyond the demo? | Prevents duplicate or lost orders |
| Do empty **cart views** count? | Affects cart and abandonment rates |
| Are **coupon codes** safe to store (not personal codes)? | Privacy |
| Which **consent** category covers Analytics, and must tracking wait for consent? | The site has no consent banner yet. Needed before real visitors |
| Should **wishlist** count as a product "intent" step in the journey? | Shapes the funnel |
