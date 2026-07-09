import { custom_storage } from "../../../browser/storage.js";
import { escapeHtml } from "../../../utils/sanitize.js";
import { faviconUrl } from "../../../utils/url.js";

export let appData = [];

export async function loadAndRenderRules() {
  const stored = await custom_storage.getSync('blacklist');

  if (stored && Array.isArray(stored)) {
    appData = stored;
  }

  await renderCategories();
}

export async function saveRules() {
  await custom_storage.setSync('blacklist', appData);
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

  container.innerHTML = '';

  const timerState = (await custom_storage.getLocal('timerState')) ?? {};

  appData.forEach((cat, index) => {
    const html = createCategoryHTML(cat, index, timerState);
    container.insertAdjacentHTML('beforeend', html);
  });
}

// update just the timer labels without rebuilding the list
export async function refreshTimers() {
  const container = document.getElementById('categories');

  if (!container) return;

  const timerState = (await custom_storage.getLocal('timerState')) ?? {};

  container.querySelectorAll('.category').forEach((li, index) => {
    const category = appData[index];
    const span = li.querySelector('.cat-timer');

    if (category && span) {
      span.textContent = categoryTimerText(category, timerState);
    }
  });
}

function createCategoryHTML(category, catIndex, timerState = {}) {
  if (!Array.isArray(category.items)) {
    category.items = [];
  }

  const timerText = categoryTimerText(category, timerState);
  
  const itemsHTML = category.items.map((item, i) => {
    return createItemHTML(item, catIndex, i);
  }).join('');

  const hasActiveItem = category.items.some(i => i && i.active);
  const statusClass = hasActiveItem ? 'active' : 'inactive';
  const name = escapeHtml(category.timerName || 'Unnamed Category');

  return `
    <li class="category">
      <header>
        <h2>${name}</h2>
        <div class="cat-controls">
          <span class="cat-timer">${timerText}</span>
          <button class="cat-status ${statusClass}" data-cat-index="${catIndex}" aria-pressed="${hasActiveItem}" aria-label="Toggle all sites in ${name}"></button>
          <button class="cat-menu-btn" data-cat-index="${catIndex}" aria-label="Options for ${name}">⋯</button>
        </div>
      </header>
      <ul class="items" data-cat-index="${catIndex}">
        ${itemsHTML}
      </ul>
      <form class="cat-add-item" data-cat-index="${catIndex}">
        <input class="cat-add-item-input" data-cat-index="${catIndex}" aria-label="Add a site to ${name}" placeholder="Add a new URL or name...">
        <button class="cat-add-item-btn" data-cat-index="${catIndex}">Add</button>
      </form>
    </li>
  `;
}

function createItemHTML(item, catIndex, itemIndex) {
  const urlEscaped = escapeHtml(item.url);
  const nameEscaped = escapeHtml(item.name);
  const statusClass = item.active ? 'active' : 'inactive';
  const isPressed = !!item.active;

  return `
    <li class="item">
      <div class="item-left-content">
        <img class="item-icon" src="${faviconUrl(item.url)}" alt="" />
        <div class="item-title">
          <div class="item-name">${nameEscaped}</div>
          <div class="item-url">${urlEscaped}</div>
        </div>
      </div>
      <div class="item-right-content">
        <button class="item-status ${statusClass}" data-cat-index="${catIndex}" data-item-index="${itemIndex}" aria-pressed="${isPressed}" aria-label="Toggle ${urlEscaped}"></button>
      </div>
    </li>
  `;
}