/**
 * Personalization for the AEP training site.
 *
 * Authors mark sections as personalization variants with section metadata:
 *   Target Location  - decision scope / mbox name shared by all variants (e.g. home-hero)
 *   Audience         - audience ids that qualify for the variant (comma separated,
 *                      "default" for the fallback experience)
 *   Activity         - activity name reported in the data layer
 *   Activity Type    - xt | ab | mvt | recs
 *   Experience       - experience name (A, B, "Returning Visitor Hero", ...)
 *
 * In "simulator" mode (default) the variant is chosen locally from the visitor profile,
 * which mirrors how an Adobe Target XT / A/B activity would deliver it. In "target" mode
 * only the default experience renders and Adobe Target (Web SDK) replaces the content of
 * each [data-target-location] element with the delivered offer.
 */
import { getMetadata } from '../aem.js';
import { pushEvent, getState } from './datalayer.js';

const DEFAULT_AUDIENCES = ['default', 'all', 'everyone', ''];

function hash(value) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = Math.imul(31, h) + value.charCodeAt(i) || 0;
  }
  return Math.abs(h);
}

function audienceList(section) {
  return (section.dataset.audience || '').split(',').map((a) => a.trim().toLowerCase());
}

function isDefault(section) {
  return audienceList(section).some((a) => DEFAULT_AUDIENCES.includes(a));
}

function getPreviewOverrides() {
  const param = new URLSearchParams(window.location.search).get('aep-preview') || '';
  return Object.fromEntries(param.split(',').filter((p) => p.includes(':')).map((p) => p.split(':')));
}

export function getPersonalizationMode() {
  const param = new URLSearchParams(window.location.search).get('aep-mode');
  return param || getMetadata('personalization-mode') || 'simulator';
}

export function isAuthoring() {
  return Boolean(document.querySelector('[data-aue-resource]'));
}

function experienceName(section, index) {
  return section.dataset.experience
    || (isDefault(section) ? 'default' : audienceList(section)[0])
    || `experience-${String.fromCharCode(65 + index)}`;
}

/**
 * Selects one section per target location and removes the others.
 * @param {Element} main main element (sections decorated)
 * @param {Object} context { audiences: string[], visitorId: string }
 * @returns {Object[]} propositions describing what was rendered
 */
export function applyPersonalization(main, { audiences, visitorId }) {
  const mode = getPersonalizationMode();
  const authoring = isAuthoring();
  const overrides = getPreviewOverrides();
  const groups = new Map();
  main.querySelectorAll(':scope > .section[data-target-location]').forEach((section) => {
    const location = section.dataset.targetLocation;
    if (!groups.has(location)) groups.set(location, []);
    groups.get(location).push(section);
  });

  const propositions = [];
  groups.forEach((sections, location) => {
    const lead = sections[0];
    const activityId = sections.find((s) => s.dataset.activity)?.dataset.activity || `${location}-activity`;
    const hasAudiences = sections.some((s) => s.dataset.audience);
    const activityType = (sections.find((s) => s.dataset.activityType)?.dataset.activityType
      || (hasAudiences ? 'xt' : 'ab')).toLowerCase();

    let chosen = null;
    let matchedAudience = 'default';
    const override = overrides[location];
    if (override) {
      const wanted = override.toLowerCase();
      chosen = sections.find((s, i) => experienceName(s, i).toLowerCase() === wanted);
    }
    if (!chosen && mode === 'target') {
      chosen = sections.find(isDefault) || lead;
    }
    if (!chosen && (activityType === 'ab' || activityType === 'mvt')) {
      chosen = sections[hash(`${visitorId}:${activityId}:${location}`) % sections.length];
    }
    if (!chosen) {
      chosen = sections.find((s) => {
        const match = audienceList(s).find((a) => audiences.includes(a));
        if (match) matchedAudience = match;
        return Boolean(match);
      }) || sections.find(isDefault) || null;
    }

    sections.forEach((section, i) => {
      section.dataset.aepExperience = experienceName(section, i);
      if (authoring) section.classList.add('aep-variant');
      else if (section !== chosen) section.remove();
    });
    if (!chosen) return;

    const experience = chosen.dataset.aepExperience;
    const personalizationVariant = `${activityId}:${experience}`;
    chosen.dataset.aepVariant = personalizationVariant;
    propositions.push({
      location,
      activityId,
      activityType,
      experience,
      audience: matchedAudience,
      personalizationVariant,
      source: override ? 'qa-preview' : mode,
    });
  });

  window.aepTraining.propositions = propositions;
  return propositions;
}

/**
 * Builds the `personalization` data layer object.
 */
export function buildPersonalizationContext(propositions) {
  return {
    mode: getPersonalizationMode(),
    activities: propositions,
    personalizationVariant: propositions.map((p) => p.personalizationVariant).join('|'),
    targetLocations: propositions.map((p) => p.location),
  };
}

/**
 * Reports rendered propositions once each location becomes visible.
 */
export function trackPropositions(main) {
  const pending = new Map((window.aepTraining.propositions || []).map((p) => [p.location, p]));
  if (!pending.size) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const location = entry.target.dataset.targetLocation;
      const proposition = pending.get(location);
      if (proposition) {
        pushEvent('propositionDisplay', proposition);
        pending.delete(location);
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.25 });
  main.querySelectorAll('.section[data-target-location]').forEach((s) => observer.observe(s));
}

/**
 * Adobe Target via Web SDK: requests the target locations as decision scopes and renders
 * HTML offers into the matching [data-target-location] element. Only runs when the page
 * is in "target" mode and alloy is available (loaded by Adobe Tags).
 */
export async function requestTargetDecisions(main) {
  if (getPersonalizationMode() !== 'target' || typeof window.alloy !== 'function') return;
  const scopes = [...new Set([...main.querySelectorAll('[data-target-location]')]
    .map((el) => el.dataset.targetLocation))];
  if (!scopes.length) return;
  const user = getState('user') || {};
  const page = getState('page') || {};
  try {
    const result = await window.alloy('sendEvent', {
      renderDecisions: true,
      decisionScopes: scopes,
      data: {
        __adobe: {
          target: {
            'profile.audienceType': user.audienceType,
            'profile.visitCount': user.visitCount,
            'profile.loyaltyTier': user.loyaltyTier,
            'profile.authState': user.authState,
            pageType: page.pageType,
            category: page.category,
            'entity.id': getState('product.productId'),
          },
        },
      },
    });
    const rendered = [];
    (result?.propositions || []).forEach((proposition) => {
      const target = main.querySelector(`[data-target-location="${proposition.scope}"]`);
      const items = (proposition.items || []).filter((i) => i.schema?.includes('html-content'));
      if (!target || !items.length) return;
      const wrapper = target.querySelector('.default-content-wrapper') || target;
      wrapper.innerHTML = items.map((i) => i.data.content).join('');
      rendered.push(proposition);
      const activity = proposition.scopeDetails?.activity || {};
      const experience = proposition.scopeDetails?.experience || {};
      pushEvent('propositionDisplay', {
        location: proposition.scope,
        activityId: activity.id,
        experience: experience.id,
        personalizationVariant: `${activity.id}:${experience.id}`,
        source: 'adobe-target',
      });
    });
    if (rendered.length) {
      window.alloy('sendEvent', {
        xdm: {
          eventType: 'decisioning.propositionDisplay',
          _experience: {
            decisioning: {
              propositions: rendered.map(({ id, scope, scopeDetails }) => ({
                id, scope, scopeDetails,
              })),
            },
          },
        },
      });
    }
  } catch (e) {
    console.warn('Adobe Target decision request failed', e);
  }
}
