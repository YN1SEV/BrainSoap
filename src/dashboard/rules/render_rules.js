import { custom_storage } from "../../browser_handlers/storage_manager.js";
let appData = []

function transformBlacklistToUI(blacklist) {
  return blacklist.map(timer => ({
    name: timer.timerName,
    minutesRemaining: 0, // Will be updated by timerState from Backend
    maxTime: timer.maxTime,
    items: timer.items.map(item => ({
      name: item.name,
      url: item.url,
      active: item.active
    }))
  }));
}

function addCategory(category, catIndex){
  if (!Array.isArray(category.items)) category.items = [];
 
  const timerText = `${category.minutesRemaining ?? 0} min left`;
  let itemsHTML = '';
  for (let i = 0; i < category.items.length; i++)
    itemsHTML += addItem(category.items[i], catIndex, i);


  const hasActiveItem = category.items.some(i => i && i.active);
  const statusClass = hasActiveItem ? 'active' : 'inactive';

  return `
    <li class="category">
      <header>
        <h2>${category.name}</h2>
        <div class="cat-controls">
          <span class="cat-timer">${timerText}</span>
          <button class="cat-status ${statusClass}" data-cat-index="${catIndex}"></button>
          <button class="cat-menu-btn" data-cat-index="${catIndex}">⋯</button>
        </div>
      </header>

      <ul class="items" data-cat-index="${catIndex}" tabindex="0" aria-label="${category.name} items">${itemsHTML}</ul>

      <div class="cat-add-item">
        
        <input 
          class="cat-add-item-input" 
          data-cat-index="${catIndex}" 
          placeholder="Add a new URL or name..."
        >
        
        <button class="cat-add-item-btn" data-cat-index="${catIndex}">Add</button>
      </div>
    </li>
  `
}

function addItem(item, catIndex, itemIndex) {
  return `
    <li class="item">
      <div class="item-left-content">
        
        <img 
          class="item-icon" 
          src="https://www.google.com/s2/favicons?sz=64&domain=${item.url}" 
          alt="" 
        />

        <div class="item-title">
          <div class="item-name">${item.name}</div>
          <div class="item-url">${item.url}</div>
        </div>
      </div>

      <div class="item-right-content">
        
        <button 
          class="item-status ${item.active ? 'active' : 'inactive'}" 
          data-cat-index="${catIndex}" 
          data-item-index="${itemIndex}"
        ></button>
      
        </div>
    </li>
  `;
}


async function init() {
  try {

  
    const res = await fetch('rules/blacklist.json');
    if (!res.ok) throw new Error('Failed to fetch rules: ' + res.status);
    const blacklist = await res.json();
    appData = transformBlacklistToUI(blacklist);
  } catch (err) {
    console.error('Could not load blacklist.json', err);
    appData = transformBlacklistToUI(sampleBlacklist);
  }

  renderCategories();
}

function renderCategories() {

  const container = document.getElementById('categories');
  if (!container) return;
  container.innerHTML = '';
  
  let cat_name = Object.keys(groups);
  cat_name.forEach(cat, idx => {
    container.insertAdjacentHTML('beforeend', addCategory(cat, groups[cat], idx));
  });
  /* 
  if (!Array.isArray(appData)) return;
  
  appData.forEach((cat, idx) => {
    container.insertAdjacentHTML('beforeend', addCategory(cat, idx));
  });
  */
}


document.addEventListener('DOMContentLoaded', init);