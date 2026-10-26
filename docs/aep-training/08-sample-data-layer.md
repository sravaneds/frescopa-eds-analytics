# 8. Sample Data Layer

The site uses the **Adobe Client Data Layer** (`window.adobeDataLayer`, library in `scripts/acdl/`).
State is pushed once per page in the eager phase and updated by events. Read it in the browser with
`adobeDataLayer.getState()` or open the debug panel (`?aep-debug=1`).

## Computed state (product detail page, signed-in returning visitor with an item in the cart)

```json
{
  "page": {
    "pageName": "novamart:products:nova-pro-wireless-headphones",
    "pageType": "product",
    "siteSection": "shop",
    "subSection": "nova-pro-wireless-headphones",
    "category": "electronics",
    "template": "aep-training",
    "title": "Nova Pro Wireless Headphones | Nova Audio | NovaMart",
    "language": "en",
    "url": "https://main--frescopa-eds-analytics--sravaneds.aem.page/products/nova-pro-wireless-headphones",
    "path": "/products/nova-pro-wireless-headphones",
    "referrer": "https://main--frescopa-eds-analytics--sravaneds.aem.page/electronics",
    "server": "main--frescopa-eds-analytics--sravaneds.aem.page",
    "environment": "preview",
    "contentType": "",
    "pageId": "novamart-products-nova-pro-wireless-headphones"
  },
  "user": {
    "visitorId": "V-mvpev0mz-qj7h89el",
    "authState": "authenticated",
    "loginStatus": "logged-in",
    "customerId": "CUST-100245",
    "visitorType": "returning",
    "visitCount": 4,
    "loyaltyTier": "gold",
    "member": true,
    "orderCount": 1,
    "lifetimeValue": 741.07,
    "audienceType": "high-value-customers",
    "audiences": ["returning-visitors", "logged-in-users", "high-value-customers", "electronics-shoppers", "first-time-buyers", "premium-members"]
  },
  "product": {
    "productId": "EL-1001",
    "productName": "Nova Pro Wireless Headphones",
    "category": "electronics",
    "brand": "Nova Audio",
    "price": 249,
    "currency": "USD",
    "rating": 4.7,
    "inStock": true
  },
  "cart": {
    "cartId": "CART-MVPF2K1A",
    "currency": "USD",
    "itemCount": 1,
    "uniqueItems": 1,
    "subtotal": 79,
    "discount": 0,
    "total": 79,
    "couponCode": "",
    "freeShipping": true,
    "items": [
      { "productId": "EL-1006", "productName": "Echo Mini Bluetooth Speaker", "price": 79, "category": "electronics", "brand": "Nova Audio", "url": "/products/echo-mini-bluetooth-speaker", "quantity": 1 }
    ]
  },
  "campaign": {
    "campaignId": "EM-FALL-2026",
    "source": "newsletter",
    "medium": "email",
    "content": "hero",
    "term": "",
    "internalCampaignId": ""
  },
  "personalization": {
    "mode": "simulator",
    "activities": [
      { "location": "pdp-trust", "activityId": "AB-PDP-TRUST", "activityType": "ab", "experience": "B", "audience": "default", "personalizationVariant": "AB-PDP-TRUST:B", "source": "simulator" },
      { "location": "pdp-cross-sell", "activityId": "RECS-PDP-CROSS-SELL", "activityType": "recs", "experience": "Frequently Bought Together", "audience": "default", "personalizationVariant": "RECS-PDP-CROSS-SELL:Frequently Bought Together", "source": "simulator" }
    ],
    "personalizationVariant": "AB-PDP-TRUST:B|RECS-PDP-CROSS-SELL:Frequently Bought Together",
    "targetLocations": ["pdp-trust", "pdp-cross-sell"]
  }
}
```

`campaign` is read from `?cid=` or `utm_*` parameters, then the page property **Default campaign ID**.

## Event pushes

Every event uses the same envelope. `eventInfo.pageName` and `eventInfo.timestamp` are always added.

```js
// page view (eager)
adobeDataLayer.push({ event: 'pageView', eventInfo: { pageType: 'product', category: 'electronics', audienceType: 'high-value-customers', personalizationVariant: 'AB-PDP-TRUST:B|...' } });

// hero / CTA / banner click (tracking.js)
adobeDataLayer.push({ event: 'heroClick', eventInfo: { CTAName: 'Shop now', linkUrl: '.../shop', component: 'hero', componentPosition: 1, sectionPosition: 1, targetLocation: 'home-hero', personalizationVariant: 'XT-HOME-HERO:New Visitor Hero', campaignId: '' } });

// search (search block, header, product grid)
adobeDataLayer.push({ event: 'searchSubmit', eventInfo: { SearchTerm: 'headphones', searchType: 'product', resultCount: 3, component: 'product-grid', listName: 'all-electronics' } });

// add to cart (store.js) - also updates the cart state
adobeDataLayer.push({ event: 'cartAdd', eventInfo: { productId: 'EL-1001', productName: 'Nova Pro Wireless Headphones', category: 'electronics', price: 249, quantity: 2, source: 'pdp' }, cart: { /* full cart */ } });

// coupon
adobeDataLayer.push({ event: 'couponApply', eventInfo: { couponCode: 'VIP20', couponStatus: 'success', discountAmount: 99.6, message: '20% member discount applied.' }, cart: { /* ... */ } });

// checkout
adobeDataLayer.push({ event: 'checkoutStart', eventInfo: { cartId: 'CART-...', itemCount: 2, cartTotal: 498, products: [ /* ... */ ] } });
adobeDataLayer.push({ event: 'shippingSelect', eventInfo: { shippingMethod: 'express', shippingCost: 14.99, cartTotal: 498 } });
adobeDataLayer.push({ event: 'paymentSelect', eventInfo: { paymentMethod: 'paypal', cartTotal: 498 } });
adobeDataLayer.push({ event: 'checkoutComplete', eventInfo: { orderId: 'NM-170933', revenue: 741.07, tax: 53.78, shipping: 14.99, discount: 74.7, couponCode: 'SAVE10', shippingMethod: 'express', paymentMethod: 'paypal', products: [ /* ... */ ] }, transaction: { orderId: 'NM-170933', total: 741.07, currency: 'USD', paymentMethod: 'paypal', shippingMethod: 'express' } });

// blog
adobeDataLayer.push({ event: 'articleView', eventInfo: { articleId: 'novamart-blog-how-to-choose-noise-cancelling-headphones', articleTitle: 'How to Choose Noise Cancelling Headphones in 2026', author: 'Jordan Lee', articleCategory: 'electronics', publishedDate: '2026-10-12' } });
adobeDataLayer.push({ event: 'readingTime', eventInfo: { readingSeconds: 60, estimatedMinutes: 2, percentRead: 72, milestone: '60s' } });

// personalization
adobeDataLayer.push({ event: 'propositionDisplay', eventInfo: { location: 'home-hero', activityId: 'XT-HOME-HERO', activityType: 'xt', experience: 'Returning Visitor Hero', audience: 'returning-visitors', personalizationVariant: 'XT-HOME-HERO:Returning Visitor Hero', source: 'simulator' } });
```

The full event list, attributes and Analytics/XDM mappings are in
[04-analytics-tracking-matrix.md](04-analytics-tracking-matrix.md).

## Mapping to Web SDK (XDM) in Adobe Tags

Sample **XDM object** data element for `cartAdd` (Tags > Data element > Adobe Experience Platform Web SDK > XDM object):

```json
{
  "eventType": "commerce.productListAdds",
  "web": { "webPageDetails": { "name": "%event.eventInfo.pageName%" } },
  "commerce": {
    "productListAdds": { "value": 1 },
    "cart": { "cartID": "%dl.cart.cartId%" }
  },
  "productListItems": [{
    "SKU": "%event.eventInfo.productId%",
    "name": "%event.eventInfo.productName%",
    "quantity": "%event.eventInfo.quantity%",
    "priceTotal": "%event.eventInfo.price%",
    "productCategories": [{ "categoryID": "%event.eventInfo.category%" }]
  }],
  "_novamart": {
    "user": { "audienceType": "%dl.user.audienceType%" },
    "personalization": { "variant": "%dl.personalization.personalizationVariant%" },
    "interaction": { "source": "%event.eventInfo.source%" }
  }
}
```

`_novamart` represents the tenant field group (replace with your `_tenantId`). Use
`%event.eventInfo.*%` for event attributes and computed-state data elements (ACDL extension,
"Computed state or data layer path") for `page.*`, `user.*`, `cart.*`.

## Validation

- `sessionStorage.setItem('acdl:debug', 'true')` loads the ACDL JSON schema validator already included
  in the boilerplate (`scripts/acdl/validate.js`).
- The debug panel lists the last 25 events with their `eventInfo`.
- In Adobe Experience Platform Debugger, check the Web SDK/Analytics beacons against this document.
