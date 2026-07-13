import { appData, saveAndRender } from "./render_rules.js";
import { escapeHtml } from "../../../utils/sanitize.js";
import { faviconUrl } from "../../../utils/url.js";

export function showCategoryMenu(catIndex, anchorEl) {
  let existing = document.querySelector('.cat-menu-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.className = 'cat-menu-popup';
  popup.popover = 'auto'; // browser handles top layer, Esc and click-outside
  popup.dataset.catIndex = catIndex;

  const rect = anchorEl.getBoundingClientRect();
  popup.style.left = `${rect.left}px`;
  popup.style.top = `${rect.bottom + 6}px`;

  const closePopup = () => popup.hidePopover();
  popup.addEventListener('toggle', (e) => {
    if (e.newState === 'closed') popup.remove();
  });

  renderMainMenu(popup, catIndex, closePopup);
  document.body.appendChild(popup);
  popup.showPopover();
}

function renderMainMenu(popup, catIndex, closePopup) {
  const category = appData[catIndex];
  if (!category) return;

  const menuOptions = [
    { label: 'Rename', action: 'rename' },
    { label: 'Change Timer', action: 'change-timer' },
    { label: 'Change Action', action: 'change-action', expandable: true },
    { label: 'Items', action: 'items', expandable: true },
    { label: 'Delete', action: 'delete', danger: true }
  ];

  popup.innerHTML = `
    <ul>
      ${menuOptions.map(({ label, action, danger, expandable }) =>
        `<li><button class="cat-menu-action${danger ? ' danger' : ''}" data-action="${action}">
          <span>${label}</span>${expandable ? '<span class="cat-menu-action-chevron" aria-hidden="true">›</span>' : ''}
        </button></li>`
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
      case 'change-action': {
        renderActionMenu(popup, catIndex, closePopup);
        break;
      }
    }
  };
}

const ACTION_OPTIONS = [
  { value: 'popup', label: 'Popup' },
  { value: 'redirect', label: 'Redirect' },
  { value: 'notify', label: 'Notify' },
];

function renderActionMenu(popup, catIndex, closePopup) {
  const category = appData[catIndex];
  if (!category) return;

  const actions = category.actions ?? ['popup'];
  const hasRedirect = actions.includes('redirect');

  popup.innerHTML = `
    <ul>
      <li><button class="cat-menu-action" data-action="back">← Back</button></li>
      ${ACTION_OPTIONS.map(({ value, label }) => `
        <li class="cat-menu-checkbox-row">
          <label>
            <input type="checkbox" class="cat-action-checkbox" value="${value}" ${actions.includes(value) ? 'checked' : ''}>
            ${label}
          </label>
        </li>
      `).join('')}
      <li class="cat-menu-redirect-row">
        <input type="url" class="cat-action-redirect-input" placeholder="https://example.com"
               value="${escapeHtml(category.redirectUrl || '')}" ${hasRedirect ? '' : 'hidden'}>
      </li>
    </ul>
  `;

  popup.onclick = (e) => {
    const actionButtonEl = e.target.closest('.cat-menu-action');
    if (actionButtonEl?.dataset.action === 'back') renderMainMenu(popup, catIndex, closePopup);
  };

  popup.querySelectorAll('.cat-action-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const selected = [...popup.querySelectorAll('.cat-action-checkbox')]
        .filter((c) => c.checked)
        .map((c) => c.value);

      // a category needs at least one action, fall back to popup rather than leaving it inert
      category.actions = selected.length ? selected : ['popup'];
      saveAndRender();
      renderActionMenu(popup, catIndex, closePopup);
    });
  });

  popup.querySelector('.cat-action-redirect-input')?.addEventListener('change', (e) => {
    category.redirectUrl = e.target.value.trim();
    saveAndRender();
  });
}

function renderItemsMenu(popup, catIndex, closePopup) {
  const category = appData[catIndex];
  if (!category) return;

  const items = category.items ?? [];

  const itemRows = items.map((item, index) => `
    <li class="cat-menu-item-row">
      <img class="cat-menu-item-icon" src="${faviconUrl(item.url)}" alt="" />
      <span class="cat-menu-item-name">${escapeHtml(item.name || item.url)}</span>
      <button class="cat-menu-action" data-action="item-rename" data-item-index="${index}">Rename</button>
      <button class="cat-menu-action danger" data-action="item-delete" data-item-index="${index}">Delete</button>
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