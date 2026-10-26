/**
 * Trainee debug panel. Enable with ?aep-debug=1 (persists for the session), disable with
 * ?aep-debug=0. Shows the data layer state, qualified audiences, rendered propositions and
 * a live event log, plus shortcuts to change the visitor profile.
 */
import { getState } from './datalayer.js';
import {
  AUDIENCES, CONDITIONS, getAudienceOverride, setAudienceOverride, resetProfile,
} from './profile.js';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function renderState(panel) {
  const page = getState('page') || {};
  const user = getState('user') || {};
  const props = window.aepTraining.propositions || [];
  panel.querySelector('.aep-debug-summary').innerHTML = `
    <dl>
      <dt>pageName</dt><dd>${esc(page.pageName)}</dd>
      <dt>pageType</dt><dd>${esc(page.pageType)}</dd>
      <dt>category</dt><dd>${esc(page.category) || '-'}</dd>
      <dt>authState</dt><dd>${esc(user.authState)}</dd>
      <dt>audienceType</dt><dd>${esc(user.audienceType)}</dd>
      <dt>cart</dt><dd>${esc(getState('cart.itemCount') || 0)} items / ${esc(getState('cart.subtotal') || 0)}</dd>
    </dl>
    <h3>Audiences</h3>
    <p class="aep-debug-tags">${(user.audiences || []).map((a) => `<span>${esc(a)}</span>`).join('') || '-'}</p>
    <h3>Propositions</h3>
    <ul>${props.map((p) => `<li><b>${esc(p.location)}</b> ${esc(p.activityType)} &rarr; ${esc(p.experience)}</li>`).join('') || '<li>None on this page</li>'}</ul>`;
}

function renderLog(panel) {
  panel.querySelector('.aep-debug-log').innerHTML = window.aepTraining.events.slice(0, 25).map((e) => `
    <details>
      <summary><code>${esc(e.event)}</code> ${esc(e.eventInfo.CTAName || e.eventInfo.productName || e.eventInfo.SearchTerm || '')}</summary>
      <pre>${esc(JSON.stringify(e.eventInfo, null, 2))}</pre>
    </details>`).join('');
}

function renderOverride(panel) {
  const current = getAudienceOverride() || [];
  const options = [...AUDIENCES.map((a) => a.id), ...Object.keys(CONDITIONS)];
  panel.querySelector('.aep-debug-override').innerHTML = `
    <legend>Simulate audiences (QA override)</legend>
    ${options.map((id) => `<label><input type="checkbox" value="${id}" ${current.includes(id) ? 'checked' : ''}> ${id}</label>`).join('')}
    <button type="button" data-cmd="apply">Apply &amp; reload</button>
    <button type="button" data-cmd="clear">Clear override</button>`;
}

export default function initDebugPanel() {
  const panel = document.createElement('aside');
  panel.className = 'aep-debug';
  panel.setAttribute('aria-label', 'AEP training debug panel');
  panel.innerHTML = `
    <button type="button" class="aep-debug-toggle" aria-expanded="false">AEP Debug</button>
    <div class="aep-debug-body" hidden>
      <div class="aep-debug-summary"></div>
      <fieldset class="aep-debug-override"></fieldset>
      <p class="aep-debug-actions">
        <button type="button" data-cmd="state">Log state to console</button>
        <button type="button" data-cmd="reset">Reset profile</button>
      </p>
      <h3>Event log</h3>
      <div class="aep-debug-log"></div>
    </div>`;
  document.body.append(panel);

  const body = panel.querySelector('.aep-debug-body');
  const toggle = panel.querySelector('.aep-debug-toggle');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    body.hidden = !open;
    if (open) {
      renderState(panel);
      renderLog(panel);
    }
  });

  panel.addEventListener('click', (e) => {
    const { cmd } = e.target.dataset;
    if (!cmd) return;
    if (cmd === 'apply') {
      const list = [...panel.querySelectorAll('.aep-debug-override input:checked')].map((i) => i.value);
      setAudienceOverride(list);
      window.location.reload();
    }
    if (cmd === 'clear') {
      setAudienceOverride(null);
      window.location.reload();
    }
    if (cmd === 'reset') {
      resetProfile();
      window.location.reload();
    }
    if (cmd === 'state') {
      // eslint-disable-next-line no-console
      console.info('adobeDataLayer state', getState());
    }
  });

  renderOverride(panel);
  document.addEventListener('aep:event', () => {
    if (body.hidden) return;
    renderState(panel);
    renderLog(panel);
  });
}
