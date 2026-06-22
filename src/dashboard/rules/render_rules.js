import { custom_storage } from "../../browser_handlers/storage_manager.js";
let appData = []

let timerMap
let timers 

function addCategory(catName, catIndex){
  
  //if (!Array.isArray(category.items)) category.items = [];

  //catagory name v
  // timertext v
  // statusclass
  // itemsHTML
  // min remaining
  
  const timerText = `${custom_storage.getVariable(catName) ?? 0} min left`;
  let itemsHTML = '';
  url_list = getUrlsForTimer(catName)

  for (let i = 0; i < url_list.length; i++){
    const item = {
      url: url_list[i],
      name: url_list[i],
      active: true // TODO change this
      //timer: timers[catName]
    }
    itemsHTML += addItem(category.items[i], catIndex, i);
  }
  const hasActiveItem = category.items.some(i => i && i.active);
  const statusClass = hasActiveItem ? 'active' : 'inactive';

  return `
    <li class="category">
      <header>
        <h2>${catName}</h2>
        <div class="cat-controls">
          <span class="cat-timer">${timerText}</span>
          <button class="cat-status ${statusClass}" data-cat-index="${catIndex}"></button>
          <button class="cat-menu-btn" data-cat-index="${catIndex}">⋯</button>
        </div>
      </header>

      <ul class="items">${itemsHTML}</ul>

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

function getUrlsForTimer(timerKey) {
    return Object.entries(timerMap)
        .filter(([url, timers]) => timers.includes(timerKey))
        .map(([url]) => url);
}

async function init() {
  try {

    timerMap = custom_storage.getSetting("timerMap")
    timers = custom_storage.getSetting("timers") 

    const res = await fetch('rules/blacklist.json');
    if (!res.ok) throw new Error('Failed to fetch rules: ' + res.status);
    appData = await res.json();
  } catch (err) {
    console.error('Could not load blacklist', err);
    appData = [];
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