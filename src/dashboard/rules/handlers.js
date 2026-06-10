// Handlers for rules UI (delegated). Relies on global `appData` and `renderCategories` from render_rules.js

function attachRulesHandlers(){
  const container = document.getElementById('categories');
  if (!container) return;

  function addItemFromInputByIndex(idx){
    const input = container.querySelector(`.cat-add-item-input[data-cat-index="${idx}"]`);
    if (!input) return;

    const val = input.value && input.value.trim();
    if (!val) return;

    const newItem = {
      name: getCleanedIdentifier(val) || val,
      url: val,
      active: true
    };

    if (!appData[idx]) appData[idx] = { name: 'Unknown', minutesRemaining: 15, items: [] };
    if (!Array.isArray(appData[idx].items)) appData[idx].items = [];
    appData[idx].items.push(newItem);
    input.value = '';
    renderCategories();
  }

  // category menu UI lives in rules/menu.js (exposes window.showCategoryMenu)

  container.addEventListener('click', (e) => {
    const el = e.target;

    // add item
    if (el.matches('.cat-add-item-btn')){
      const idx = Number(el.dataset.catIndex);
      addItemFromInputByIndex(idx);
    }

    // open category menu
    if (el.matches('.cat-menu-btn')){
      const idx = Number(el.dataset.catIndex);
      showCategoryMenu(idx, el);
    }

    // toggle item status
    if (el.matches('.item-status')){
      const c = Number(el.dataset.catIndex);
      const i = Number(el.dataset.itemIndex);
      if (appData[c] && appData[c].items && appData[c].items[i]){
        appData[c].items[i].active = !appData[c].items[i].active;
        renderCategories();
      }
    }

    // toggle category status -> set all child items accordingly
    if (el.matches('.cat-status')){
      const c = Number(el.dataset.catIndex);
      if (appData[c] && Array.isArray(appData[c].items)){
        const items = appData[c].items;
        const hasActive = items.some(it => it && it.active);
        const newState = !hasActive; // if any active -> turn all off, else turn all on
        for (let j = 0; j < items.length; j++){
          if (items[j]) items[j].active = newState;
        }
        renderCategories();
      }
    }
  });

  // submit item when pressing Tab or Enter in the input
  container.addEventListener('keydown', (e) => {
    const el = e.target;
    if (!el || !el.matches) return;
    if (el.matches('.cat-add-item-input')){
      if (e.key === 'Tab' || e.key === 'Enter'){
        e.preventDefault();
        const idx = Number(el.dataset.catIndex);
        addItemFromInputByIndex(idx);
      }
    }
  });

  // add category button in page controls
  const addCatBtn = document.getElementById('add-category-btn');
  if (addCatBtn){
    const addCatInput = document.getElementById('add-category-input');

    function doAddCategory(){
      const name = addCatInput && addCatInput.value && addCatInput.value.trim();
      if (!name) return;
      const newCat = { name: name, minutesRemaining: 0, items: [] };
      appData.push(newCat);
      if (addCatInput) addCatInput.value = '';
      renderCategories();
    }

    addCatBtn.addEventListener('click', doAddCategory);

    if (addCatInput){
      addCatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' || e.key === 'Enter'){
          e.preventDefault();
          doAddCategory();
        }
      });
    }
  }
}


attachRulesHandlers();

