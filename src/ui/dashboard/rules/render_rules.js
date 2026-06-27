import { custom_storage } from "../../../browser/storage.js";
import { escapeHtml } from "../../../utils/sanitize.js";

export let appData = [];

export async function loadAndRenderRules() {
  const stored = await custom_storage.getSync('blacklist');
  if (stored && Array.isArray(stored)) appData = stored;
  await renderCategories();
}

export async function saveRules() {
  await custom_storage.setSync('blacklist', appData);
}

export async function saveAndRender() {
  await saveRules();
  await renderCategories();
}

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
    container.insertAdjacentHTML('beforeend', createCategoryHTML(cat, index, timerState));
  });
}

export async function refreshTimers() {
  const container = document.getElementById('categories');
  if (!container) return;
  const timerState = (await custom_storage.getLocal('timerState')) ?? {};
  container.querySelectorAll('.category').forEach((li, index) => {
    const category = appData[index];
    const span = li.querySelector('.cat-timer');
    if (category && span) span.textContent = categoryTimerText(category, timerState);
  });
}

function createCategoryHTML(category, catIndex, timerState = {}) {
  if (!Array.isArray(category.items)) category.items = [];
  const timerText = categoryTimerText(category, timerState);
  const itemsHTML = category.items.map((item, i) => createItemHTML(item, catIndex, i)).join('');
  const hasActiveItem = category.items.some(i => i && i.active);
  const statusClass = hasActiveItem ? 'active' : 'inactive';
  const name = escapeHtml(category.timerName || 'Unnamed Category');
  return `<li class="category">
      <header><h2>${name}</h2><div class="cat-controls">
        <span class="cat-timer">${timerText}</span>
        <button class="cat-status ${statusClass}" data-cat-index="${catIndex}" aria-pressed="${hasActiveItem}" aria-label="Toggle all sites in ${name}"></button>
        <button class="cat-menu-btn" data-cat-index="${catIndex}" aria-label="Options for ${name}">⋯</button>
      </div></header>
      <ul class="items" data-cat-index="${catIndex}">${itemsHTML}</ul>
      <div class="cat-add-item">
        <input class="cat-add-item-input" data-cat-index="${catIndex}" aria-label="Add a site to ${name}" placeholder="Add a new URL or name...">
        <button class="cat-add-item-btn" data-cat-index="${catIndex}">Add</button>
      </div></li>`;
}

function createItemHTML(item, catIndex, itemIndex) {
  return `<li class="item"><div class="item-left-content">
      <img class="item-icon" src="https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(item.url)}" alt="" />
      <div class="item-title"><div class="item-name">${escapeHtml(item.name)}</div><div class="item-url">${escapeHtml(item.url)}</div></div>
    </div><div class="item-right-content">
      <button class="item-status ${item.active ? 'active' : 'inactive'}" data-cat-index="${catIndex}" data-item-index="${itemIndex}" aria-pressed="${!!item.active}" aria-label="Toggle ${escapeHtml(item.url)}"></button>
    </div></li>`;
}
