import { appData, saveAndRender } from "./rules.js";
import { faviconUrl } from "../../../utils/url.js";
import { customStorage } from "../../../browser/storage.js";

async function syncTimerState(category) {
  const timerState = (await customStorage.getLocal('timerState')) ?? {};
  const entry = timerState[category.timerName];
  if (!entry) return;

  entry.maxTime = category.maxTime;
  entry.remaining = Math.min(entry.remaining, category.maxTime);
  await customStorage.setLocal('timerState', timerState);
}

function focusFirstAction(popup) {
  popup.querySelector('.cat-menu-action')?.focus();
}

function releaseTrigger(catIndex) {
  const trigger = document.querySelector(`.cat-menu-btn[data-cat-index="${catIndex}"]`);
  trigger?.setAttribute('aria-expanded', 'false');
  trigger?.focus();
}

export function showCategoryMenu(catIndex, anchorEl) {
  const superseded = document.querySelector('.cat-menu-popup');
  if (superseded) {
    superseded.dataset.superseded = 'true';
    superseded.remove();
  }

  const popup = document.createElement('div');
  popup.className = 'cat-menu-popup';
  popup.popover = 'auto'; // browser handles top layer, Esc and click-outside
  popup.dataset.catIndex = catIndex;
  popup.setAttribute('role', 'group');
  popup.setAttribute('aria-label', `Options for ${appData[catIndex]?.timerName ?? 'category'}`);

  const rect = anchorEl.getBoundingClientRect();
  const popupWidth = 250;
  popup.style.left = `${Math.max(12, rect.right - popupWidth)}px`;
  popup.style.top = `${rect.bottom + 6}px`;

  const closePopup = () => popup.hidePopover();
  popup.addEventListener('toggle', (e) => {
    if (e.newState === 'open') {
      focusFirstAction(popup);
      return;
    }
    popup.remove();
    if (!popup.dataset.superseded) releaseTrigger(catIndex);
  });

  renderMainMenu(popup, catIndex, closePopup);
  document.body.appendChild(popup);
  anchorEl.setAttribute('aria-expanded', 'true');
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

  const ul = document.createElement('ul');

  menuOptions.forEach(({ label, action, danger, expandable }) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    
    button.className = `cat-menu-action${danger ? ' danger' : ''}`;
    button.dataset.action = action;

    const spanLabel = document.createElement('span');
    spanLabel.textContent = label;
    button.appendChild(spanLabel);

    if (expandable) {
      const chevron = document.createElement('span');
      chevron.className = 'cat-menu-action-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = '›';
      button.appendChild(chevron);
    }

    li.appendChild(button);
    ul.appendChild(li);
  });

  popup.replaceChildren(ul);
  focusFirstAction(popup);

  popup.onclick = async (e) => {
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
          category.maxTime = Math.max(0, Number(newTime));
          await syncTimerState(category);
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

const MODE_OPTIONS = [
  { value: 'popup', label: 'Popup' },
  { value: 'image', label: 'Image' },
  { value: 'neither', label: 'Neither' },
];

const EXTRA_OPTIONS = [
  { value: 'notify', label: 'Notify' },
  { value: 'redirect', label: 'Redirect' },
];

function buildFieldsetGroup(legendText) {
  const li = document.createElement('li');
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'cat-menu-fieldset';

  const legend = document.createElement('legend');
  legend.className = 'cat-menu-subheading';
  legend.textContent = legendText;
  fieldset.appendChild(legend);

  const innerUl = document.createElement('ul');
  innerUl.className = 'cat-menu-fieldset-list';
  fieldset.appendChild(innerUl);

  li.appendChild(fieldset);
  return { li, innerUl };
}

function renderActionMenu(popup, catIndex, closePopup) {
  const category = appData[catIndex];
  if (!category) return;

  const actions = category.actions ?? ['popup'];
  const mode = actions.includes('image') ? 'image' : actions.includes('popup') ? 'popup' : 'neither';
  const hasRedirect = actions.includes('redirect');

  const ul = document.createElement('ul');

  // Back button
  const backLi = document.createElement('li');
  const backBtn = document.createElement('button');
  backBtn.className = 'cat-menu-action';
  backBtn.dataset.action = 'back';
  backBtn.textContent = '← Back';
  backLi.appendChild(backBtn);
  ul.appendChild(backLi);

  const { li: modeLi, innerUl: modeUl } = buildFieldsetGroup('Block with');
  MODE_OPTIONS.forEach(({ value, label }) => {
    const li = document.createElement('li');
    li.className = 'cat-menu-checkbox-row';

    const labelEl = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `cat-mode-${catIndex}`;
    input.className = 'cat-mode-radio';
    input.value = value;
    input.checked = mode === value;

    labelEl.append(input, ` ${label}`);
    li.appendChild(labelEl);
    modeUl.appendChild(li);
  });
  ul.appendChild(modeLi);

  const { li: extraLi, innerUl: extraUl } = buildFieldsetGroup('Also');
  EXTRA_OPTIONS.forEach(({ value, label }) => {
    const li = document.createElement('li');
    li.className = 'cat-menu-checkbox-row';

    const labelEl = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'cat-extra-checkbox';
    input.value = value;
    input.checked = actions.includes(value);

    labelEl.append(input, ` ${label}`);
    li.appendChild(labelEl);
    extraUl.appendChild(li);
  });
  ul.appendChild(extraLi);

  // Redirect Input Row
  const redirectLi = document.createElement('li');
  redirectLi.className = 'cat-menu-redirect-row';

  const redirectInput = document.createElement('input');
  redirectInput.type = 'url';
  redirectInput.className = 'cat-action-redirect-input';
  redirectInput.placeholder = 'https://example.com';
  redirectInput.setAttribute('aria-label', 'Redirect URL');
  redirectInput.value = category.redirectUrl || '';
  if (!hasRedirect) redirectInput.hidden = true;

  redirectLi.appendChild(redirectInput);
  ul.appendChild(redirectLi);

  popup.replaceChildren(ul);
  focusFirstAction(popup);

  popup.onclick = (e) => {
    const actionButtonEl = e.target.closest('.cat-menu-action');
    if (actionButtonEl?.dataset.action === 'back') renderMainMenu(popup, catIndex, closePopup);
  };

  const applySelection = () => {
    const selectedMode = popup.querySelector('.cat-mode-radio:checked')?.value ?? 'neither';
    const extras = [...popup.querySelectorAll('.cat-extra-checkbox')]
      .filter((c) => c.checked)
      .map((c) => c.value);

    category.actions = selectedMode === 'neither' ? extras : [selectedMode, ...extras];
    redirectInput.hidden = !extras.includes('redirect');
    saveAndRender();
  };

  popup.querySelectorAll('.cat-mode-radio').forEach((radio) => {
    radio.addEventListener('change', applySelection);
  });

  popup.querySelectorAll('.cat-extra-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', applySelection);
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
  const ul = document.createElement('ul');

  // Back Button
  const backLi = document.createElement('li');
  const backBtn = document.createElement('button');
  backBtn.className = 'cat-menu-action';
  backBtn.dataset.action = 'back';
  backBtn.textContent = '← Back';
  backLi.appendChild(backBtn);
  ul.appendChild(backLi);

  // Empty state fallback
  if (items.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'cat-menu-empty';
    emptyLi.textContent = 'No sites yet';
    ul.appendChild(emptyLi);
  } else {
    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'cat-menu-item-row';

      const img = document.createElement('img');
      img.className = 'cat-menu-item-icon';
      img.src = faviconUrl(item.url);
      img.alt = '';

      const siteLabel = item.name || item.url;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'cat-menu-item-name';
      nameSpan.textContent = siteLabel;

      const renameBtn = document.createElement('button');
      renameBtn.className = 'cat-menu-action';
      renameBtn.dataset.action = 'item-rename';
      renameBtn.dataset.itemIndex = index;
      renameBtn.setAttribute('aria-label', `Rename ${siteLabel}`);
      renameBtn.textContent = 'Rename';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'cat-menu-action danger';
      deleteBtn.dataset.action = 'item-delete';
      deleteBtn.dataset.itemIndex = index;
      deleteBtn.setAttribute('aria-label', `Delete ${siteLabel}`);
      deleteBtn.textContent = 'Delete';

      li.append(img, nameSpan, renameBtn, deleteBtn);
      ul.appendChild(li);
    });
  }

  popup.replaceChildren(ul);
  focusFirstAction(popup);

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
        renderItemsMenu(popup, catIndex, closePopup);
      }
    } 
    else if (action === 'item-delete') {
      if (confirm(`Delete "${item.name || item.url}"?`)) { 
        category.items.splice(itemIndex, 1); 
        saveAndRender(); 
        renderItemsMenu(popup, catIndex, closePopup);
      }
    }
  };
}