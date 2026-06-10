// Simple category popup menu for rules dashboard.
// Provides Rename, Change Timer, Delete for a category.

function showCategoryMenu(catIndex, anchorEl) {
  var existing = document.querySelector('.cat-menu-popup');
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }

  var popup = document.createElement('div');
  popup.className = 'cat-menu-popup';
  popup.setAttribute('data-cat-index', String(catIndex));

  var list = document.createElement('ul');

  function addAction(label, actionName) {
    var li = document.createElement('li');
    var button = document.createElement('button');
    button.className = 'cat-menu-action';
    button.setAttribute('data-action', actionName);
    button.textContent = label;
    li.appendChild(button);
    list.appendChild(li);
  }

  addAction('Rename', 'rename');
  addAction('Change Timer', 'change-timer');
  addAction('Delete', 'delete');

  popup.appendChild(list);

  var rect = anchorEl.getBoundingClientRect();
  popup.style.position = 'fixed';
  popup.style.zIndex = '9999';
  popup.style.left = rect.left + 'px';
  popup.style.top = rect.bottom + 6 + 'px';

  document.body.appendChild(popup);

  function closePopup() {
    if (popup && popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKeyDown);
  }

  function onPopupClick(event) {
    var target = event.target;
    while (target && target !== popup) {
      if (target.tagName === 'BUTTON' && target.classList.contains('cat-menu-action')) {
        break;
      }
      target = target.parentNode;
    }
    if (!target || target === popup) {
      return;
    }

    var action = target.getAttribute('data-action');
    var idx = Number(popup.getAttribute('data-cat-index'));

    if (action === 'rename') {
      var currentName = '';
      if (appData && appData[idx] && appData[idx].name) {
        currentName = appData[idx].name;
      }
      var newName = prompt('New category name:', currentName);
      if (newName !== null) {
        if (!appData[idx]) {
          appData[idx] = { name: newName, minutesRemaining: 0, items: [] };
        } else {
          appData[idx].name = newName.trim() || appData[idx].name;
        }
        if (typeof renderCategories === 'function') {
          renderCategories();
        }
      }
    }

    if (action === 'change-timer') {
      var currentTimer = 0;
      if (appData && appData[idx] && typeof appData[idx].minutesRemaining === 'number') {
        currentTimer = appData[idx].minutesRemaining;
      }
      var value = prompt('Time limit in minutes:', String(currentTimer));
      if (value !== null) {
        var numberValue = Number(value);
        if (!Number.isNaN(numberValue)) {
          if (!appData[idx]) {
            appData[idx] = { name: 'Unknown', minutesRemaining: numberValue, items: [] };
          } else {
            appData[idx].minutesRemaining = numberValue;
          }
          if (typeof renderCategories === 'function') {
            renderCategories();
          }
        } else {
          alert('Please enter a valid number.');
        }
      }
    }

    if (action === 'delete') {
      var confirmDelete = confirm('Delete this category?');
      if (confirmDelete) {
        if (Array.isArray(appData)) {
          appData.splice(idx, 1);
          if (typeof renderCategories === 'function') {
            renderCategories();
          }
        }
      }
    }

    closePopup();
  }

  function onDocumentClick(event) {
    if (!popup.contains(event.target) && event.target !== anchorEl) {
      closePopup();
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      closePopup();
    }
  }

  popup.addEventListener('click', onPopupClick);
  setTimeout(function () {
    document.addEventListener('click', onDocumentClick);
  }, 0);
  document.addEventListener('keydown', onKeyDown);
}

window.showCategoryMenu = showCategoryMenu;
