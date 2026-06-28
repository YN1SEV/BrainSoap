import { appData, saveAndRender } from "./render_rules.js";
import { escapeHtml } from "../../../utils/sanitize.js";

export function showCategoryMenu(catIndex, anchorEl) {
  let existing = document.querySelector('.cat-menu-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.className = 'cat-menu-popup';
  popup.dataset.catIndex = catIndex;

  const rect = anchorEl.getBoundingClientRect();
  popup.style.position = 'fixed';
  popup.style.zIndex = '9999';
  popup.style.left = `${rect.left}px`;
  popup.style.top = `${rect.bottom + 6}px`;

  function closePopup() {
    if (popup.parentNode) popup.remove();
    document.removeEventListener('click', onDocumentClick);
  }
  function onDocumentClick(e) {
    if (!popup.contains(e.target) && e.target !== anchorEl) closePopup();
  }

  renderMainMenu(popup, catIndex, closePopup);
  document.body.appendChild(popup);

  setTimeout(() => document.addEventListener('click', onDocumentClick), 0);
}

function renderMainMenu(popup, catIndex, closePopup) {
  const category = appData[catIndex];
  if (!category) return;

  const menuOptions = [
    { label: 'Rename', action: 'rename' },
    { label: 'Change Timer', action: 'change-timer' },
    { label: 'Items', action: 'items' },
    { label: 'Delete', action: 'delete' }
  ];

  popup.innerHTML = `
    <ul>
      ${menuOptions.map(({ label, action }) =>
        `<li><button class="cat-menu-action" data-action="${action}">${label}</button></li>`
      ).join('')}
    </ul>
  `;

  popup.onclick = (e) => {
    const actionButtonEl = e.target.closest('.cat-menu-action');
    if (!actionButtonEl) return;
    
    const action = actionButtonEl.dataset.action;

    switch (action) {
      case 'rename': {
        const newName = prompt('New category name:', category.timerName);
        if (newName?.trim()) { 
          category.timerName = newName.trim(); 
          saveAndRender(); 
        }
        closePopup();
        break;
      }
      case 'change-timer': {
        const newTime = prompt('Time limit in minutes:', category.maxTime);
        if (newTime !== null && !isNaN(Number(newTime))) { 
          category.maxTime = Number(newTime); 
          saveAndRender(); 
        }
        closePopup();
        break;
      }
      case 'delete': {
        if (confirm(`Delete the category "${category.timerName}"?`)) { 
          appData.splice(catIndex, 1); 
          saveAndRender(); 
        }
        closePopup();
        break;
      }
      case 'items': {
        renderItemsMenu(popup, catIndex, closePopup);
        break;
      }
    }
  };
}

function renderItemsMenu(popup, catIndex, closePopup) {
  const category = appData[catIndex];
  if (!category) return;

  const items = category.items ?? [];

  const itemRows = items.map((item, index) => `
    <li class="cat-menu-item-row">
      <span class="cat-menu-item-name">${escapeHtml(item.name || item.url)}</span>
      <button class="cat-menu-action" data-action="item-rename" data-item-index="${index}">Rename</button>
      <button class="cat-menu-action" data-action="item-delete" data-item-index="${index}">Delete</button>
    </li>
  `).join('');

  const emptyRow = items.length === 0
    ? `<li class="cat-menu-empty">No sites yet</li>`
    : '';

  popup.innerHTML = `
    <ul>
      <li><button class="cat-menu-action" data-action="back">← Back</button></li>
      ${emptyRow}
      ${itemRows}
    </ul>
  `;

  popup.onclick = (e) => {
    const buttonEl = e.target.closest('.cat-menu-action');
    if (!buttonEl) return;

    const action = buttonEl.dataset.action;

    if (action === 'back') { 
      renderMainMenu(popup, catIndex, closePopup); 
      return; 
    }

    const itemIndex = Number(buttonEl.dataset.itemIndex);
    const item = category.items[itemIndex];
    if (!item) return;

    if (action === 'item-rename') {
      const newName = prompt('New site name:', item.name);
      if (newName?.trim()) { 
        item.name = newName.trim(); 
        saveAndRender(); 
        renderItemsMenu(popup, catIndex, closePopup); // Re-render the items list
      }
    } 
    else if (action === 'item-delete') {
      if (confirm(`Delete "${item.name || item.url}"?`)) { 
        category.items.splice(itemIndex, 1); 
        saveAndRender(); 
        renderItemsMenu(popup, catIndex, closePopup); // Re-render the items list
      }
    }
  };
}