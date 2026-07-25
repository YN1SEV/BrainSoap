import { customStorage } from "../../../browser/storage.js";
import { faviconUrl } from "../../../utils/url.js";

export let appData = [];

// Minimal DOM element builder to satisfy web-ext linting
function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') element.className = value;
    else if (key === 'textContent') element.textContent = value;
    else element.setAttribute(key, value);
  });
  element.append(...[children].flat().filter(Boolean));
  return element;
}

export async function loadAndRenderRules() {
  const stored = await customStorage.getSync('blacklist');

  if (stored && Array.isArray(stored)) {
    appData = stored;
  }

  await renderCategories();
}

export async function saveRules() {
  await customStorage.setSync('blacklist', appData);
}

export async function saveAndRender() {
  await saveRules();
  await renderCategories();
}

// "x / y min left" label
function categoryTimerText(category, timerState) {
  if (!category.maxTime) return 'No limit';

  const remaining = timerState[category.timerName]?.remaining ?? category.maxTime;

  return `${remaining} / ${category.maxTime} min left`;
}

export async function renderCategories() {
  const container = document.getElementById('categories');
  if (!container) return;

  const timerState = (await customStorage.getLocal('timerState')) ?? {};
  container.replaceChildren(...appData.map((cat, i) => createCategoryNode(cat, i, timerState)));
}

function createCategoryNode(category, catIndex, timerState = {}) {
  if (!Array.isArray(category.items)) category.items = [];

  const name = category.timerName || 'Unnamed Category';
  const hasActive = category.items.some(i => i?.active);
  const timerText = categoryTimerText(category, timerState);

  return el('li', { className: 'category', tabindex: '0', role: 'group', 'aria-label': name }, [
    el('header', {}, [
      el('h2', { textContent: name }),
      el('div', { className: 'cat-controls' }, [
        el('span', { className: 'cat-timer', textContent: timerText }),
        el('button', {
          className: `cat-status rules-control ${hasActive ? 'active' : 'inactive'}`,
          'data-cat-index': catIndex,
          'aria-pressed': hasActive,
          'aria-label': `Toggle all sites in ${name}`
        }),
        el('button', {
          className: 'cat-menu-btn rules-control',
          'data-cat-index': catIndex,
          'aria-label': `Options for ${name}`,
          'aria-haspopup': 'menu',
          'aria-expanded': 'false',
          textContent: '⋯'
        })
      ])
    ]),
    el('ul', { className: 'items', 'data-cat-index': catIndex },
      category.items.filter(Boolean).map((item, i) => createItemNode(item, catIndex, i))
    ),
    el('form', { className: 'cat-add-item', 'data-cat-index': catIndex }, [
      el('input', {
        className: 'cat-add-item-input rules-control',
        'data-cat-index': catIndex,
        'aria-label': `Add a site to ${name}`,
        placeholder: 'Add a new URL or name...'
      }),
      el('button', { className: 'cat-add-item-btn', 'data-cat-index': catIndex, textContent: 'Add' })
    ])
  ]);
}

function createItemNode(item, catIndex, itemIndex) {
  const isPressed = !!item.active;

  return el('li', { className: 'item' }, [
    el('div', { className: 'item-left-content' }, [
      el('img', { className: 'item-icon', src: faviconUrl(item.url), alt: '' }),
      el('div', { className: 'item-title' }, [
        el('div', { className: 'item-name', textContent: item.name }),
        el('div', { className: 'item-url', textContent: item.url })
      ])
    ]),
    el('div', { className: 'item-right-content' }, [
      el('button', {
        className: `item-status rules-control ${isPressed ? 'active' : 'inactive'}`,
        'data-cat-index': catIndex,
        'data-item-index': itemIndex,
        'aria-pressed': isPressed,
        'aria-label': `Toggle ${item.url}`
      })
    ])
  ]);
}

// update just the timer labels without rebuilding the list
export async function refreshTimers() {
  const container = document.getElementById('categories');

  if (!container) return;

  const timerState = (await customStorage.getLocal('timerState')) ?? {};

  container.querySelectorAll('.category').forEach((li, index) => {
    const category = appData[index];
    const span = li.querySelector('.cat-timer');

    if (category && span) {
      span.textContent = categoryTimerText(category, timerState);
    }
  });
}
