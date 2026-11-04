/**
 * Page engagement tracking.
 *
 * pageScrollDepth     once per milestone (25, 50, 75, 100 %) per page view
 * pageEngagementTime  active time milestones (10s, 30s, 60s, 120s, 300s, 600s) and an
 *                     "exit" summary when the page is hidden or unloaded
 *
 * Active time only counts while the tab is visible and the visitor interacted (scroll,
 * pointer, key, touch) within the last 30 seconds, so idle open tabs are not counted.
 * `incrementalSeconds` is the active time since the previous pageEngagementTime push:
 * summing it over all pushes of a page view gives the total active time, which suits an
 * Adobe Analytics numeric event.
 */
import { pushDataLayerEvent, whenActivated } from './adobe-data-layer.js';

export const SCROLL_EVENT = 'pageScrollDepth';
export const ENGAGEMENT_EVENT = 'pageEngagementTime';

const SCROLL_MILESTONES = [25, 50, 75, 100];
const TIME_MILESTONES = [10, 30, 60, 120, 300, 600];
const IDLE_TIMEOUT_MS = 30 * 1000;
const ACTIVITY_EVENTS = ['scroll', 'pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'];

let started = false;
let maxScrollDepth = 0;

/** Share of the page seen so far: bottom of the viewport relative to the page height. */
function getScrollPercent() {
  const doc = document.documentElement;
  const height = Math.max(doc.scrollHeight, document.body?.scrollHeight || 0);
  if (!height) return 0;
  const seen = window.scrollY + window.innerHeight;
  // a few pixels of rounding or a fixed footer must not block the 100 % milestone
  if (height - seen <= 2) return 100;
  return Math.min(100, Math.round((seen / height) * 100));
}

function initScrollDepth() {
  const reached = new Set();
  let ticking = false;
  const check = () => {
    ticking = false;
    const percent = getScrollPercent();
    maxScrollDepth = Math.max(maxScrollDepth, percent);
    SCROLL_MILESTONES.forEach((milestone) => {
      if (percent < milestone || reached.has(milestone)) return;
      reached.add(milestone);
      pushDataLayerEvent(SCROLL_EVENT, {
        engagement: {
          type: 'scroll-depth',
          scrollDepth: milestone,
          milestone: `${milestone}%`,
          pageHeight: document.documentElement.scrollHeight,
        },
      }, { dedupe: false });
    });
    if (reached.size === SCROLL_MILESTONES.length) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }
  };
  // rAF throttling: at most one measurement per frame
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(check);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // short pages may already be fully visible without scrolling
  onScroll();
}

function initEngagementTime() {
  let activeSeconds = 0;
  let reportedSeconds = 0;
  let lastActivity = Date.now();
  const reached = new Set();

  const report = (milestone, trigger) => {
    pushDataLayerEvent(ENGAGEMENT_EVENT, {
      engagement: {
        type: 'engagement-time',
        activeSeconds,
        incrementalSeconds: activeSeconds - reportedSeconds,
        milestone,
        trigger,
        maxScrollDepth,
      },
    }, { dedupe: false });
    reportedSeconds = activeSeconds;
  };

  const onActivity = () => { lastActivity = Date.now(); };
  ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, onActivity, { passive: true }));

  window.setInterval(() => {
    if (document.visibilityState !== 'visible' || Date.now() - lastActivity > IDLE_TIMEOUT_MS) return;
    activeSeconds += 1;
    if (TIME_MILESTONES.includes(activeSeconds) && !reached.has(activeSeconds)) {
      reached.add(activeSeconds);
      report(`${activeSeconds}s`, 'milestone');
    }
  }, 1000);

  // exit summary: visibilitychange is the reliable signal on mobile, pagehide on desktop.
  // Only sent when there is new active time, so tab switches do not create duplicates.
  const onExit = (trigger) => {
    if (activeSeconds > reportedSeconds) report('exit', trigger);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onExit('hidden');
    else lastActivity = Date.now();
  });
  window.addEventListener('pagehide', () => onExit('pagehide'));
}

/**
 * Starts scroll depth and engagement time tracking once per page view.
 * Prerendered pages start when they are shown.
 */
export default function initPageEngagement() {
  if (started) return;
  started = true;
  whenActivated(() => {
    initScrollDepth();
    initEngagementTime();
  });
}
