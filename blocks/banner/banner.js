import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, isSameOriginImage } from '../../scripts/scripts.js';
import { pushEvent } from '../../scripts/aep/datalayer.js';

/**
 * Promotional banner.
 * Rows (model order): image (optional) | text | coupon code (optional) | campaign id (optional)
 * Variants: alert, dark, dismissible
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [imageCell, textCell, couponCell, campaignCell] = rows.map((row) => row.firstElementChild);
  const couponCode = (couponCell?.textContent || '').trim();
  const campaignId = (campaignCell?.textContent || '').trim()
    || block.closest('[data-campaign-id]')?.dataset.campaignId || '';
  const bannerName = (textCell?.querySelector('h2, h3, h4, strong, p')?.textContent || 'banner').trim();
  const dismissKey = `aep:banner-dismissed:${campaignId || bannerName}`;

  if (block.classList.contains('dismissible') && sessionStorage.getItem(dismissKey)) {
    block.closest('.banner-wrapper')?.remove();
    return;
  }

  block.dataset.campaignId = campaignId;
  block.dataset.trackImpression = 'bannerImpression';
  block.dataset.trackCampaignId = campaignId;
  block.dataset.trackBannerName = bannerName;
  if (couponCode) block.dataset.trackCouponCode = couponCode;

  const picture = imageCell?.querySelector('picture');
  const media = document.createElement('div');
  media.className = 'banner-image';
  if (picture) {
    const img = picture.querySelector('img');
    if (isSameOriginImage(img.src)) {
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      media.append(optimized);
    } else {
      media.append(picture);
    }
  }

  const content = document.createElement('div');
  content.className = 'banner-content';
  if (textCell) content.append(...textCell.childNodes);

  if (couponCode) {
    const coupon = document.createElement('div');
    coupon.className = 'banner-coupon';
    coupon.innerHTML = '<span>Use code</span> <code></code> <button type="button" class="banner-copy">Copy code</button> <span class="banner-copy-status" role="status" aria-live="polite"></span>';
    coupon.querySelector('code').textContent = couponCode;
    const copy = coupon.querySelector('button');
    copy.dataset.trackHandled = 'true';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(couponCode);
      } catch (e) {
        // clipboard not available, still track the intent
      }
      coupon.querySelector('.banner-copy-status').textContent = 'Copied!';
      pushEvent('couponCopy', {
        couponCode, campaignId, component: 'banner', bannerName,
      });
    });
    content.append(coupon);
  }

  block.textContent = '';
  if (picture) {
    block.classList.add('banner-has-image');
    block.append(media);
  }
  block.append(content);

  if (block.classList.contains('dismissible')) {
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'banner-close';
    close.setAttribute('aria-label', 'Dismiss offer');
    close.dataset.trackHandled = 'true';
    close.addEventListener('click', () => {
      sessionStorage.setItem(dismissKey, 'true');
      pushEvent('bannerDismiss', { campaignId, bannerName, component: 'banner' });
      block.closest('.banner-wrapper')?.remove();
    });
    block.append(close);
  }
}
