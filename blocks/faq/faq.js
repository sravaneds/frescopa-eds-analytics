import { moveInstrumentation } from '../../scripts/scripts.js';
import { pushEvent } from '../../scripts/aep/datalayer.js';
import { addJsonLd } from '../../scripts/aep/seo.js';

let faqCount = 0;

function feedback(question, position) {
  const wrap = document.createElement('div');
  wrap.className = 'faq-feedback';
  wrap.innerHTML = '<span>Was this helpful?</span> <button type="button" data-value="yes">Yes</button> <button type="button" data-value="no">No</button>';
  wrap.querySelectorAll('button').forEach((button) => {
    button.dataset.trackHandled = 'true';
    button.addEventListener('click', () => {
      pushEvent('faqFeedback', {
        component: 'faq', question, itemPosition: position, helpful: button.dataset.value,
      });
      wrap.textContent = 'Thanks for your feedback!';
      wrap.setAttribute('role', 'status');
    });
  });
  return wrap;
}

/**
 * FAQ block. Each row is a question | answer pair. Adds FAQPage structured data,
 * an optional search filter (variant "searchable") and helpfulness feedback.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  faqCount += 1;
  const items = [];
  const list = document.createElement('div');
  list.className = 'faq-list';
  [...block.children].forEach((row, i) => {
    const [qCell, aCell] = row.children;
    const question = (qCell?.textContent || '').trim();
    const details = document.createElement('details');
    details.className = 'faq-item';
    moveInstrumentation(row, details);
    const summary = document.createElement('summary');
    summary.innerHTML = '<h3 class="faq-question"></h3>';
    summary.firstElementChild.textContent = question;
    const answer = document.createElement('div');
    answer.className = 'faq-answer';
    if (aCell) answer.append(...aCell.childNodes);
    items.push({ question, answer: answer.textContent.trim(), details });
    answer.append(feedback(question, i + 1));
    details.append(summary, answer);
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      pushEvent('faqToggle', {
        component: 'faq', question, CTAName: question, itemPosition: i + 1,
      });
    });
    list.append(details);
  });

  block.textContent = '';
  if (block.classList.contains('searchable')) {
    const form = document.createElement('form');
    form.className = 'faq-search';
    form.setAttribute('role', 'search');
    form.innerHTML = `<label for="faq-search-${faqCount}">Search questions</label>
      <input id="faq-search-${faqCount}" type="search" placeholder="e.g. returns, shipping, points" autocomplete="off">
      <p class="faq-search-status" role="status" aria-live="polite"></p>`;
    const input = form.querySelector('input');
    const status = form.querySelector('.faq-search-status');
    let timer;
    const filter = (track) => {
      const term = input.value.trim().toLowerCase();
      let count = 0;
      items.forEach(({ question, answer, details }) => {
        const match = !term || `${question} ${answer}`.toLowerCase().includes(term);
        details.hidden = !match;
        if (match) count += 1;
      });
      status.textContent = term ? `${count} matching question${count === 1 ? '' : 's'}` : '';
      if (track && term) {
        pushEvent('searchSubmit', {
          SearchTerm: term, searchType: 'faq', resultCount: count, component: 'faq',
        });
      }
    };
    input.addEventListener('input', () => {
      filter(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => filter(true), 1000);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.clearTimeout(timer);
      filter(true);
    });
    block.append(form);
  }
  block.append(list);

  addJsonLd(`faq-${faqCount}`, {
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer.replace(/Was this helpful\?.*$/, '').trim() },
    })),
  });
}
