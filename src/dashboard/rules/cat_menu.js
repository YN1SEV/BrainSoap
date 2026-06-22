import { appData, saveRules } from "./render_rules.js";

export function showCategoryMenu(catIndex, anchorEl) {
  let existing = document.querySelector('.cat-menu-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.className = 'cat-menu-popup';
  popup.dataset.catIndex = catIndex;

  const list = document.createElement('ul');

  ['Rename', 'Change Timer', 'Delete'].forEach(label => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'cat-menu-action';
    btn.dataset.action = label.toLowerCase().replace(' ', '-');
    btn.textContent = label;
    li.appendChild(btn);
    list.appendChild(li);
  });

  popup.appendChild(list);

  const rect = anchorEl.getBoundingClientRect();
  popup.style.position = 'fixed';
  popup.style.zIndex = '9999';
  popup.style.left = `${rect.left}px`;
  popup.style.top = `${rect.bottom + 6}px`;

  document.body.appendChild(popup);

  function closePopup() {
    if (popup.parentNode) popup.remove();
    document.removeEventListener('click', onDocumentClick);
  }

  function onDocumentClick(e) {
    if (!popup.contains(e.target) && e.target !== anchorEl) {
      closePopup();
    }
  }

  popup.addEventListener('click', (e) => {
    if (!e.target.matches('.cat-menu-action')) return;
    
    const action = e.target.dataset.action;
    const cat = appData[catIndex];

    if (action === 'rename') {
      const newName = prompt('New category name:', cat ? cat.timerName : '');
      if (newName !== null) {
        if (!cat) appData[catIndex] = { timerName: newName, maxTime: 60, minRemaining: 0, items: [] };
        else cat.timerName = newName.trim() || cat.timerName;
        saveRules();
      }
    }

    if (action === 'change-timer') {
      const newTime = prompt('Time limit in minutes:', cat ? cat.maxTime : '60');
      if (newTime !== null && !isNaN(Number(newTime))) {
        if (!cat) appData[catIndex] = { timerName: 'Unknown', maxTime: Number(newTime), minRemaining: Number(newTime), items: [] };
        else {
          cat.maxTime = Number(newTime);
          cat.minRemaining = Number(newTime); // Reset timer upon change
        }
        saveRules();
      }
    }

    if (action === 'delete') {
      if (confirm('Delete this category?')) {
        appData.splice(catIndex, 1);
        saveRules();
      }
    }

    closePopup();
  });

  setTimeout(() => document.addEventListener('click', onDocumentClick), 0);
}