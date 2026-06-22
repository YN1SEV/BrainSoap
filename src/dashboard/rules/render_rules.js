import { custom_storage } from "../../browser_handlers/storage_manager.js";

export let appData = [];

export async function loadAndRenderRules() {
  const stored = await custom_storage.getSync('blacklist');
  if (stored && Array.isArray(stored)) {
    appData = stored;
  }
  renderCategories();
}

export async function saveRules() {
  await custom_storage.setSync('blacklist', appData);
  renderCategories();
}

export function renderCategories() {
  const container = document.getElementById('categories');
  if (!container) return;
  container.innerHTML = '';
  
  appData.forEach((cat, index) => {
    container.insertAdjacentHTML('beforeend', createCategoryHTML(cat, index));
  });
}

function createCategoryHTML(category, catIndex) {
  if (!Array.isArray(category.items)) category.items = [];
 
  const timerText = `${category.minRemaining ?? 0} min left`;
  const itemsHTML = category.items.map((item, i) => createItemHTML(item, catIndex, i)).join('');

  const hasActiveItem = category.items.some(i => i && i.active);
  const statusClass = hasActiveItem ? 'active' : 'inactive';

  return `
    <li class="category">
      <header>
        <h2>${category.timerName || 'Unnamed Category'}</h2>
        <div class="cat-controls">
          <span class="cat-timer">${timerText}</span>
          <button class="cat-status ${statusClass}" data-cat-index="${catIndex}"></button>
          <button class="cat-menu-btn" data-cat-index="${catIndex}">⋯</button>
        </div>
      </header>

      <ul class="items" data-cat-index="${catIndex}" tabindex="0">${itemsHTML}</ul>

      <div class="cat-add-item">
        <input class="cat-add-item-input" data-cat-index="${catIndex}" placeholder="Add a new URL or name...">
        <button class="cat-add-item-btn" data-cat-index="${catIndex}">Add</button>
      </div>
    </li>
  `;
}

function createItemHTML(item, catIndex, itemIndex) {
  return `
    <li class="item">
      <div class="item-left-content">
        <img class="item-icon" src="https://www.google.com/s2/favicons?sz=64&domain=${item.url}" alt="" />
        <div class="item-title">
          <div class="item-name">${item.name}</div>
          <div class="item-url">${item.url}</div>
        </div>
      </div>
      <div class="item-right-content">
        <button class="item-status ${item.active ? 'active' : 'inactive'}" data-cat-index="${catIndex}" data-item-index="${itemIndex}"></button>
      </div>
    </li>
  `;
}