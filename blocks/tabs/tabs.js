import { moveInstrumentation } from '../../scripts/scripts.js';
import { pushEvent } from '../../scripts/aep/datalayer.js';

let tabsCount = 0;

/**
 * Tabs block. Each row is one tab: label | content.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  tabsCount += 1;
  const id = `tabs-${tabsCount}`;
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');
  const tabs = [];
  const panels = [];

  [...block.children].forEach((row, i) => {
    const [labelCell, contentCell] = row.children;
    const label = (labelCell?.textContent || `Tab ${i + 1}`).trim();
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-tab';
    tab.id = `${id}-tab-${i}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel-${i}`);
    tab.textContent = label;
    tab.dataset.trackHandled = 'true';

    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `${id}-panel-${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    moveInstrumentation(row, panel);
    if (contentCell) panel.append(...contentCell.childNodes);

    tabs.push(tab);
    panels.push(panel);
    tablist.append(tab);
  });

  const select = (index, { focus = false, track = false } = {}) => {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', active);
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    });
    if (focus) tabs[index].focus();
    if (track) {
      pushEvent('tabClick', {
        tabName: tabs[index].textContent,
        CTAName: tabs[index].textContent,
        tabPosition: index + 1,
        component: 'tabs',
        tabsId: id,
      });
    }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i, { track: true }));
    tab.addEventListener('keydown', (e) => {
      const keys = {
        ArrowRight: (i + 1) % tabs.length,
        ArrowLeft: (i - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (e.key in keys) {
        e.preventDefault();
        select(keys[e.key], { focus: true, track: true });
      }
    });
  });

  block.textContent = '';
  block.append(tablist, ...panels);
  if (tabs.length) select(0);
}
