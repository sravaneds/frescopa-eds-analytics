/**
 * Event dictionary for the AEP training site: every adobeDataLayer event pushed by the
 * runtime (scripts/aep) and the blocks, with suggested Adobe Analytics and XDM mappings.
 */

const click = ['CTAName', 'linkUrl', 'component', 'componentPosition', 'sectionPosition', 'targetLocation', 'personalizationVariant', 'campaignId'];
const product = ['productId', 'productName', 'category', 'price'];

export const EVENTS = {
  pageView: {
    trigger: 'Every page load (eager phase, after personalization)', source: 'scripts/aep/index.js', attributes: ['pageType', 'category', 'audienceType', 'personalizationVariant'], aa: 's.t(); pageName, channel, prop1/eVar2 pageType, eVar3 category, eVar20 audienceType, eVar21 personalizationVariant', xdm: 'web.webpagedetails.pageViews; web.webPageDetails.name',
  },
  scrollDepth: {
    trigger: '25/50/75/90/100 % of the page scrolled', source: 'tracking.js', attributes: ['scrollDepth', 'pageHeight'], aa: 'event10 (scroll milestone), eVar31/prop31 scrollDepth', xdm: '_novamart.engagement.scrollDepth',
  },
  heroClick: {
    trigger: 'Click on a link/button in a Hero block', source: 'hero + tracking.js', attributes: click, aa: 'event11 heroClick, eVar30 CTAName, eVar21 personalizationVariant', xdm: 'web.webInteraction (linkClicks), _novamart.interaction',
  },
  ctaClick: {
    trigger: 'Click on a CTA/Cards/Columns/Teaser/default-content button or link', source: 'tracking.js', attributes: [...click, 'actionLink'], aa: 'event12 ctaClick, eVar30 CTAName', xdm: 'web.webInteraction.name = CTAName',
  },
  bannerImpression: {
    trigger: 'Banner block 50 % visible (once)', source: 'banner + tracking.js', attributes: ['campaignId', 'bannerName', 'couponCode'], aa: 'event13 internal promo impression, eVar5 internal campaign (list var)', xdm: '_novamart.promotion.impressions',
  },
  bannerClick: {
    trigger: 'Click on a link in a Banner', source: 'banner + tracking.js', attributes: click, aa: 'event14 internal promo click, eVar5 campaignId', xdm: 'web.webInteraction, _novamart.promotion.clicks',
  },
  bannerDismiss: {
    trigger: 'Dismissible banner closed', source: 'banner', attributes: ['campaignId', 'bannerName'], aa: 'event15', xdm: '_novamart.promotion.dismissals',
  },
  couponCopy: {
    trigger: '"Copy code" in a Banner', source: 'banner', attributes: ['couponCode', 'campaignId', 'bannerName'], aa: 'event16, eVar6 couponCode', xdm: '_novamart.promotion.couponCopies',
  },
  carouselClick: {
    trigger: 'Click on a slide link in a Carousel', source: 'carousel + tracking.js', attributes: click, aa: 'event17, eVar30 CTAName', xdm: 'web.webInteraction',
  },
  carouselNavigate: {
    trigger: 'Carousel / product carousel arrows, dots, keyboard or swipe', source: 'carousel, product-carousel', attributes: ['component', 'action', 'slideIndex', 'slideCount', 'listName'], aa: 'event18, eVar32 action', xdm: '_novamart.interaction.carousel',
  },
  productCarouselClick: {
    trigger: 'Product clicked in an authored Product Carousel', source: 'product-carousel', attributes: [...product, 'listName', 'position'], aa: 'event19 + s.products, eVar12 listName (merch), eVar13 position', xdm: 'productListItems, _novamart.list',
  },
  productListImpression: {
    trigger: 'Product grid/carousel 50 % visible', source: 'product-grid, product-carousel', attributes: ['listName', 'productIds', 'resultCount'], aa: 'event21 list impression, eVar12 listName', xdm: '_novamart.list.impressions',
  },
  productClick: {
    trigger: 'Product card clicked in a grid, cart or wishlist', source: 'product-card.js', attributes: [...product, 'listName', 'position'], aa: 'event22 + s.products (merchandising eVar12 listName, eVar13 position)', xdm: 'productListItems, web.webInteraction',
  },
  categoryView: {
    trigger: 'Category or product listing page load', source: 'index.js', attributes: ['category', 'pageType'], aa: 'event23 categoryView, eVar3 category', xdm: '_novamart.category',
  },
  filterApply: {
    trigger: 'Category/brand/price/sale filter changed', source: 'product-grid', attributes: ['filterType', 'filterValue', 'filterLabel', 'resultCount', 'listName'], aa: 'event24 filter, eVar41 "filterType:filterValue"', xdm: '_novamart.search.filters',
  },
  sortApply: {
    trigger: 'Sort order changed', source: 'product-grid', attributes: ['filterValue', 'resultCount'], aa: 'event25, eVar42 sort', xdm: '_novamart.search.sort',
  },
  filterClear: {
    trigger: 'Clear filters', source: 'product-grid', attributes: ['resultCount', 'listName'], aa: 'event26', xdm: '_novamart.search.filters',
  },
  searchSubmit: {
    trigger: 'Search submitted (header, Search block, grid keyword, FAQ, stores)', source: 'header-aep, search, product-grid, faq', attributes: ['SearchTerm', 'searchType', 'resultCount', 'trigger'], aa: 'event20 searches, eVar40/prop40 SearchTerm, eVar43 searchType, prop41 resultCount', xdm: 'siteSearch.query, siteSearch.numberOfResults',
  },
  searchNoResults: {
    trigger: 'Search returned zero results', source: 'search, product-grid', attributes: ['SearchTerm', 'searchType'], aa: 'event27 null search, eVar40 SearchTerm', xdm: 'siteSearch.numberOfResults = 0',
  },
  searchResultsView: {
    trigger: 'Product listing opened with ?q=', source: 'product-grid', attributes: ['SearchTerm', 'resultCount', 'listName'], aa: 'prop41 resultCount', xdm: 'siteSearch',
  },
  searchSuggestionClick: {
    trigger: 'Popular search chip clicked', source: 'search', attributes: ['SearchTerm', 'searchType'], aa: 'event28, eVar44 "suggestion"', xdm: 'siteSearch.query',
  },
  productView: {
    trigger: 'Product Info block rendered (PDP)', source: 'product-info', attributes: [...product, 'brand', 'rating', 'inStock'], aa: 'prodView + event29, s.products ";EL-1001;;;;eVar11=Nova Pro..."', xdm: 'commerce.productViews, productListItems[0]',
  },
  galleryInteraction: {
    trigger: 'Thumbnail click, zoom, swipe/arrows in a gallery', source: 'product-info, carousel (gallery)', attributes: ['action', 'imageIndex', 'productId'], aa: 'event30, eVar33 action', xdm: '_novamart.product.gallery',
  },
  productOptionSelect: {
    trigger: 'Colour option selected on PDP', source: 'product-info', attributes: ['productId', 'optionType', 'optionValue'], aa: 'event31, eVar34 optionValue', xdm: '_novamart.product.option',
  },
  reviewsClick: {
    trigger: 'Rating/reviews link on PDP', source: 'product-info + tracking.js', attributes: [...click, 'productId'], aa: 'event32', xdm: '_novamart.product.reviewsClick',
  },
  tabClick: {
    trigger: 'Tab selected (click or keyboard)', source: 'tabs', attributes: ['tabName', 'CTAName', 'tabPosition', 'tabsId'], aa: 'event33, eVar35 tabName', xdm: 'web.webInteraction.name',
  },
  accordionToggle: {
    trigger: 'Accordion item expanded/collapsed', source: 'accordion', attributes: ['itemTitle', 'itemPosition', 'action'], aa: 'event34, eVar36 itemTitle', xdm: '_novamart.interaction.accordion',
  },
  faqToggle: {
    trigger: 'FAQ question opened', source: 'faq', attributes: ['question', 'itemPosition'], aa: 'event35, eVar36 question', xdm: '_novamart.support.faq',
  },
  faqFeedback: {
    trigger: '"Was this helpful?" answered', source: 'faq', attributes: ['question', 'helpful'], aa: 'event36 (yes) / event37 (no)', xdm: '_novamart.support.feedback',
  },
  testimonialImpression: {
    trigger: 'Testimonials 50 % visible', source: 'testimonials', attributes: ['testimonialCount'], aa: 'event38', xdm: '_novamart.content.impressions',
  },
  cartOpen: {
    trigger: 'First item added to an empty cart', source: 'store.js', attributes: ['cartId'], aa: 'scOpen', xdm: 'commerce.productListOpens',
  },
  cartAdd: {
    trigger: 'Add to cart (grid, carousel, PDP, wishlist, quantity +)', source: 'store.js', attributes: [...product, 'quantity', 'source'], aa: 'scAdd, s.products, eVar14 add source', xdm: 'commerce.productListAdds, productListItems',
  },
  cartRemove: {
    trigger: 'Remove from cart or quantity -', source: 'store.js', attributes: ['productId', 'productName', 'price', 'quantity', 'source'], aa: 'scRemove, s.products', xdm: 'commerce.productListRemovals',
  },
  cartView: {
    trigger: 'Cart page rendered', source: 'cart', attributes: ['cartId', 'itemCount', 'cartSubtotal', 'couponCode'], aa: 'scView', xdm: 'commerce.productListViews',
  },
  couponApply: {
    trigger: 'Coupon submitted in cart', source: 'store.js', attributes: ['couponCode', 'couponStatus', 'discountAmount', 'message'], aa: 'event39 (success) / event40 (invalid), eVar6 couponCode', xdm: '_novamart.cart.coupon',
  },
  couponRemove: {
    trigger: 'Applied coupon removed', source: 'store.js', attributes: ['couponCode'], aa: 'event41', xdm: '_novamart.cart.coupon',
  },
  wishlistAdd: {
    trigger: 'Heart / "Add to wishlist"', source: 'store.js', attributes: [...product, 'source'], aa: 'event42, s.products', xdm: 'commerce.saveForLaters',
  },
  wishlistRemove: {
    trigger: 'Removed from wishlist', source: 'store.js', attributes: ['productId', 'productName', 'source'], aa: 'event43', xdm: '_novamart.wishlist.removals',
  },
  wishlistView: {
    trigger: 'Wishlist page rendered', source: 'wishlist', attributes: ['itemCount'], aa: 'event44', xdm: '_novamart.wishlist.views',
  },
  checkoutStart: {
    trigger: 'Checkout page with a non-empty cart', source: 'checkout', attributes: ['cartId', 'itemCount', 'cartTotal', 'products'], aa: 'scCheckout, s.products', xdm: 'commerce.checkouts',
  },
  checkoutStep: {
    trigger: 'First interaction with each checkout step', source: 'checkout', attributes: ['checkoutStep', 'checkoutStepNumber'], aa: 'event45, eVar45 checkoutStep', xdm: '_novamart.checkout.step',
  },
  shippingSelect: {
    trigger: 'Shipping method changed', source: 'checkout', attributes: ['shippingMethod', 'shippingCost', 'cartTotal'], aa: 'event46, eVar46 shippingMethod', xdm: 'commerce.shipping.shippingMethod',
  },
  paymentSelect: {
    trigger: 'Payment method changed', source: 'checkout', attributes: ['paymentMethod', 'cartTotal'], aa: 'event47, eVar47 paymentMethod', xdm: 'commerce.order.payments[0].paymentType',
  },
  checkoutError: {
    trigger: 'Place order with invalid form', source: 'checkout', attributes: ['errorType', 'field'], aa: 'event48, eVar48 field', xdm: '_novamart.checkout.error',
  },
  checkoutComplete: {
    trigger: 'Order placed (purchase)', source: 'store.js', attributes: ['orderId', 'revenue', 'tax', 'shipping', 'discount', 'couponCode', 'shippingMethod', 'paymentMethod', 'products'], aa: 'purchase, purchaseID = orderId, s.products with revenue, eVar6 couponCode', xdm: 'commerce.purchases, commerce.order (purchaseID, priceTotal), productListItems',
  },
  orderConfirmationView: {
    trigger: 'Order confirmation rendered', source: 'orders (confirmation)', attributes: ['orderId', 'revenue', 'itemCount'], aa: 'event49 (do NOT count purchase twice)', xdm: '_novamart.order.confirmationView',
  },
  orderHistoryView: {
    trigger: 'Order history rendered', source: 'orders', attributes: ['orderCount', 'authState'], aa: 'event50', xdm: '_novamart.account.orderHistory',
  },
  orderTrackClick: {
    trigger: '"Track" link in order history', source: 'orders + tracking.js', attributes: [...click, 'orderId'], aa: 'event51', xdm: 'web.webInteraction',
  },
  orderTrack: {
    trigger: 'Order lookup submitted or opened via link', source: 'orders (tracking)', attributes: ['orderId', 'orderFound', 'orderStatus', 'trigger'], aa: 'event52, eVar52 orderStatus', xdm: '_novamart.account.orderTracking',
  },
  articleView: {
    trigger: 'Blog article page load', source: 'index.js', attributes: ['articleId', 'articleTitle', 'author', 'articleCategory', 'publishedDate'], aa: 'event53, eVar53 articleTitle, eVar54 author', xdm: '_novamart.content.article',
  },
  readingTime: {
    trigger: '15/30/60/120/300 s of active reading and on exit', source: 'tracking.js', attributes: ['readingSeconds', 'estimatedMinutes', 'percentRead', 'milestone'], aa: 'event54 (numeric: readingSeconds), eVar55 milestone', xdm: '_novamart.content.readingTime',
  },
  propositionDisplay: {
    trigger: 'Personalized section (Target location) 25 % visible', source: 'personalization.js', attributes: ['location', 'activityId', 'activityType', 'experience', 'audience', 'personalizationVariant', 'source'], aa: 'event60, eVar21 personalizationVariant (A4T when using Target)', xdm: 'decisioning.propositionDisplay, _experience.decisioning.propositions',
  },
  navClick: {
    trigger: 'Header navigation click or submenu expand', source: 'header-aep + tracking.js', attributes: click, aa: 'event61, eVar37 "nav:CTAName"', xdm: 'web.webInteraction (type other)',
  },
  navToggle: {
    trigger: 'Mobile menu opened/closed', source: 'header-aep', attributes: ['action'], aa: 'event62', xdm: '_novamart.interaction.nav',
  },
  footerClick: {
    trigger: 'Footer link click', source: 'tracking.js', attributes: click, aa: 'event63, eVar37 "footer:CTAName"', xdm: 'web.webInteraction',
  },
  linkClick: {
    trigger: 'Any other link', source: 'tracking.js', attributes: click, aa: 's.tl() custom link', xdm: 'web.webInteraction (linkClicks)',
  },
  loginComplete: {
    trigger: 'Demo sign-in (#aep:sign-in)', source: 'tracking.js', attributes: ['loginMethod', 'customerId'], aa: 'event64, eVar60 customerId (hashed in production)', xdm: 'identityMap (CRM ID), _novamart.account.login',
  },
  logout: {
    trigger: 'Demo sign-out (#aep:sign-out)', source: 'tracking.js', attributes: [], aa: 'event65', xdm: '_novamart.account.logout',
  },
  membershipEnroll: {
    trigger: 'Join Rewards (#aep:enroll)', source: 'tracking.js', attributes: ['loyaltyTier'], aa: 'event66, eVar61 loyaltyTier', xdm: '_novamart.loyalty.enroll',
  },
  profileReset: {
    trigger: 'Reset profile (#aep:reset-profile or debug panel)', source: 'tracking.js', attributes: [], aa: '-', xdm: '-',
  },
  errorPageView: {
    trigger: '404 page load', source: 'index.js', attributes: ['errorCode', 'requestedUrl'], aa: 's.pageType = "errorPage", event67', xdm: 'web.webPageDetails.isErrorPage = true',
  },
};

/** Events every block can produce */
export const BLOCK_EVENTS = {
  hero: ['heroClick'],
  banner: ['bannerImpression', 'bannerClick', 'couponCopy'],
  cta: ['ctaClick'],
  cards: ['ctaClick'],
  columns: ['ctaClick'],
  teaser: ['ctaClick'],
  carousel: ['carouselClick', 'carouselNavigate'],
  'product-carousel': ['productListImpression', 'productCarouselClick', 'carouselNavigate', 'cartAdd', 'wishlistAdd'],
  'product-carousel.recommendations': ['recommendationImpression', 'recommendationClick', 'carouselNavigate', 'cartAdd', 'wishlistAdd'],
  'product-carousel.recently-viewed': ['recommendationImpression', 'recommendationClick', 'cartAdd', 'wishlistAdd'],
  'product-grid': ['productListImpression', 'productClick', 'cartAdd', 'wishlistAdd'],
  'product-grid.filters': ['filterApply', 'sortApply', 'filterClear', 'searchSubmit', 'searchNoResults'],
  tabs: ['tabClick'],
  accordion: ['accordionToggle'],
  faq: ['faqToggle', 'faqFeedback'],
  'faq.searchable': ['searchSubmit'],
  testimonials: ['testimonialImpression'],
  search: ['searchSubmit', 'searchNoResults', 'searchSuggestionClick'],
  'product-info': ['productView', 'galleryInteraction', 'productOptionSelect', 'cartAdd', 'wishlistAdd', 'reviewsClick'],
  cart: ['cartView', 'cartAdd', 'cartRemove', 'couponApply', 'couponRemove'],
  checkout: ['checkoutStart', 'checkoutStep', 'shippingSelect', 'paymentSelect', 'checkoutError', 'checkoutComplete'],
  wishlist: ['wishlistView', 'wishlistRemove', 'cartAdd'],
  orders: ['orderHistoryView', 'orderTrackClick'],
  'orders.confirmation': ['orderConfirmationView'],
  'orders.tracking': ['orderTrack'],
};

EVENTS.recommendationImpression = {
  trigger: 'Recommendation carousel 50 % visible', source: 'product-carousel (recommendations, recently-viewed)', attributes: ['listName', 'productIds', 'source'], aa: 'event68, eVar12 listName', xdm: '_novamart.recommendations.impressions',
};
EVENTS.recommendationClick = {
  trigger: 'Product clicked in a recommendations carousel', source: 'product-carousel', attributes: [...product, 'listName', 'position'], aa: 'event69 + s.products, eVar12 listName, eVar21 personalizationVariant', xdm: 'productListItems, _novamart.recommendations.clicks',
};

export const GLOBAL_EVENTS = ['pageView', 'scrollDepth', 'navClick', 'footerClick', 'linkClick'];
