import { appData, saveAndRender } from "./render_rules.js";

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

function actionButton(label, action) {
  const button = document.createElement('button');
  button.className = 'cat-menu-action';
  button.dataset.action = action;
  button.textContent = label;
  return button;
}

function renderMainMenu(popup, catIndex, closePopup) {
  const category = appData[catIndex];
  const list = document.createElement('ul');
  for (const [label, action] of [['Rename', 'rename'], ['Change Timer', 'change-timer'], ['Items', 'items'], ['Delete', 'delete']]) {
    const li = document.createElement('li');
    li.appendChild(actionButton(label, action));
    list.appendChild(li);
  }
  popup.replaceChildren(list);
  list.onclick = (e) => {
    const action = e.target.closest('.cat-menu-action')?.dataset.action;
    if (!action || !category) return;
    if (action === 'rename') {
      const newName = prompt('New category name:', category.timerName);
      if (newName?.trim()) { category.timerName = newName.trim(); saveAndRender(); }
      closePopup();
    } else if (action === 'change-timer') {
      const newTime = prompt('Time limit in minutes:', category.maxTime);
      if (newTime !== null && !isNaN(Number(newTime))) { category.maxTime = Number(newTime); saveAndRender(); }
      closePopup();
    } else if (action === 'delete') {
      if (confirm(`Delete the category "${category.timerName}"?`)) { appData.splice(catIndex, 1); saveAndRender(); }
      closePopup();
    } else if (action === 'items') {
      renderItemsMenu(popup, catIndex, closePopup);
    }
  };
}

function renderItemsMenu(popup, catIndex, closePopup) {
  const category = appData[catIndex];
  const items = category?.items ?? [];
  const list = document.createElement('ul');
  const back = document.createElement('li');
  back.appendChild(actionButton('← Back', 'back'));
  list.appendChild(back);
  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'cat-menu-empty';
    empty.textContent = 'No sites yet';
    list.appendChild(empty);
  }
  items.forEach((item, index) => {
    const row = document.createElement('li');
    row.className = 'cat-menu-item-row';
    const name = document.createElement('span');
    name.className = 'cat-menu-item-name';
    name.textContent = item.name || item.url;
    const rename = actionButton('Rename', 'item-rename');
    const remove = actionButton('Delete', 'item-delete');
    rename.dataset.itemIndex = index;
    remove.dataset.itemIndex = index;
    row.append(name, rename, remove);
    list.appendChild(row);
  });
  popup.replaceChildren(list);
  list.onclick = (e) => {
    const button = e.target.closest('.cat-menu-action');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'back') { renderMainMenu(popup, catIndex, closePopup); return; }
    const index = Number(button.dataset.itemIndex);
    const item = category?.items[index];
    if (!item) return;
    if (action === 'item-rename') {
      const newName = prompt('New site name:', item.name);
      if (newName?.trim()) { item.name = newName.trim(); saveAndRender(); renderItemsMenu(popup, catIndex, closePopup); }
    } else if (action === 'item-delete') {
      if (confirm(`Delete "${item.name || item.url}"?`)) { category.items.splice(index, 1); saveAndRender(); renderItemsMenu(popup, catIndex, closePopup); }
    }
  };
}
