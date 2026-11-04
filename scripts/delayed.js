/* eslint-disable import/no-cycle */
import { getConfigValue } from './configs.js';
import { getUserTokenCookie } from './initializers/index.js';
import { getConsent } from './scripts.js';
import { loadScript } from './aem.js';

async function initAnalytics() {
  try {
    // Load Commerce events SDK and collector
    // only if "analytics" has been added to the config.
    const config = getConfigValue('analytics');

    if (config && getConsent('commerce-collection')) {
      const csHeaders = getConfigValue('headers.cs');

      window.adobeDataLayer.push(
        {
          storefrontInstanceContext: {
            baseCurrencyCode: config['base-currency-code'],
            environment: config.environment,
            environmentId: csHeaders['Magento-Environment-Id'],
            storeCode: csHeaders['Magento-Store-Code'],
            storefrontTemplate: 'EDS',
            storeId: parseInt(config['store-id'], 10),
            storeName: config['store-name'],
            storeUrl: config['store-url'],
            storeViewCode: csHeaders['Magento-Store-View-Code'],
            storeViewCurrencyCode: config['base-currency-code'],
            storeViewId: parseInt(config['store-view-id'], 10),
            storeViewName: config['store-view-name'],
            websiteCode: csHeaders['Magento-Website-Code'],
            websiteId: parseInt(config['website-id'], 10),
            websiteName: config['website-name'],
          },
        },
        { eventForwardingContext: { commerce: true, aep: false } },
        {
          shopperContext: {
            shopperId: getUserTokenCookie() ? 'logged-in' : 'guest',
          },
        },
      );

      // Load events SDK and collector
      import('./commerce-events-sdk.js');
      import('./commerce-events-collector.js');
    }
  } catch (error) {
    console.warn('Error initializing analytics', error);
  }
}

if (document.prerendering) {
  document.addEventListener('prerenderingchange', initAnalytics, {
    once: true,
  });
  document.addEventListener('prerenderingchange', initAnalytics, { once: true });
} else {
  initAnalytics();
}

// add delayed functionality here
// add more delayed functionality here
const map = document.querySelector('#locator-map');
if (map) {
  loadScript('/blocks/store-locator/location-init.js', { defer: true });
}

if (document.body.classList.contains('aep-training')) {
  import('./aep/index.js').then(({ initDelayed }) => initDelayed(document.querySelector('main')));
}

// Adobe Client Data Layer: page scroll depth (pageScrollDepth). Each milestone is reported
// once per page view: share of the page seen = bottom of the viewport / page height.
window.adobeDataLayer = window.adobeDataLayer || [];
const scrollMilestones = [25, 50, 75, 100];
const scrollReached = new Set();
let scrollTicking = false;
let maxScrollDepth = 0;
const onScroll = () => {
  if (scrollTicking) return;
  scrollTicking = true;
  // measured at most once per frame
  window.requestAnimationFrame(() => {
    scrollTicking = false;
    const height = document.documentElement.scrollHeight;
    const seen = window.scrollY + window.innerHeight;
    const percent = height - seen <= 2 ? 100 : Math.round((seen / height) * 100);
    maxScrollDepth = Math.max(maxScrollDepth, percent);
    scrollMilestones.forEach((milestone) => {
      if (percent < milestone || scrollReached.has(milestone)) return;
      scrollReached.add(milestone);
      // scroll milestone reached
      window.adobeDataLayer.push({
        event: 'pageScrollDepth',
        engagement: {
          type: 'scroll-depth', scrollDepth: milestone, milestone: `${milestone}%`, pageHeight: height,
        },
      });
    });
    if (scrollReached.size === scrollMilestones.length) window.removeEventListener('scroll', onScroll);
  });
};
window.addEventListener('scroll', onScroll, { passive: true });
// short pages can be fully visible without scrolling
onScroll();

// Adobe Client Data Layer: active engagement time (pageEngagementTime). A second counts when
// the tab is visible and the visitor scrolled, moved the pointer, typed or touched within the
// last 30 seconds. Counting starts in this delayed phase (about 3 s after the page loads).
// incrementalSeconds = active seconds since the previous push; their sum is the total.
const engagementMilestones = [10, 30, 60, 120, 300, 600];
let activeSeconds = 0;
let reportedSeconds = 0;
let lastActivity = Date.now();
['scroll', 'pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'].forEach((type) => {
  window.addEventListener(type, () => { lastActivity = Date.now(); }, { passive: true });
});
window.setInterval(() => {
  if (document.visibilityState !== 'visible' || Date.now() - lastActivity > 30000) return;
  activeSeconds += 1;
  if (!engagementMilestones.includes(activeSeconds)) return;
  // active time milestone reached
  window.adobeDataLayer.push({
    event: 'pageEngagementTime',
    engagement: {
      type: 'engagement-time',
      activeSeconds,
      incrementalSeconds: activeSeconds - reportedSeconds,
      milestone: `${activeSeconds}s`,
      trigger: 'milestone',
      maxScrollDepth,
    },
  });
  reportedSeconds = activeSeconds;
}, 1000);
// exit summary: the tab is hidden or the page unloads. Sent only when there is new active
// time, so switching tabs back and forth does not create duplicates.
['visibilitychange', 'pagehide'].forEach((type) => {
  window.addEventListener(type, () => {
    if (type === 'visibilitychange' && document.visibilityState !== 'hidden') {
      lastActivity = Date.now();
      return;
    }
    if (activeSeconds <= reportedSeconds) return;
    window.adobeDataLayer.push({
      event: 'pageEngagementTime',
      engagement: {
        type: 'engagement-time',
        activeSeconds,
        incrementalSeconds: activeSeconds - reportedSeconds,
        milestone: 'exit',
        trigger: type === 'pagehide' ? 'pagehide' : 'hidden',
        maxScrollDepth,
      },
    });
    reportedSeconds = activeSeconds;
  });
});

document.dispatchEvent(new Event('delayed-phase'));
Window.DELAYED_PHASE = true;
