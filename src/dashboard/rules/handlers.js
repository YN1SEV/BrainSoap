import { appData, renderCategories, saveRules, loadAndRenderRules } from "./render_rules.js";
import { showCategoryMenu } from "./cat_menu.js";

function attachRulesHandlers() {
  const container = document.getElementById('categories');
  if (!container) return;

  function addItemFromInputByIndex(idx) {
    const input = container.querySelector(`.cat-add-item-input[data-cat-index="${idx}"]`);
    if (!input) return;

    const val = input.value.trim();
    if (!val) return;

    const newItem = { name: val, url: val, active: true };

    if (!appData[idx]) appData[idx] = { timerName: 'Unknown', maxTime: 60, minRemaining: 0, items: [] };
    appData[idx].items.push(newItem);
    
    saveRules(); 
  }

  container.addEventListener('click', (e) => {
    const el = e.target;

    if (el.matches('.cat-add-item-btn')) {
      addItemFromInputByIndex(Number(el.dataset.catIndex));
    }

    if (el.matches('.cat-menu-btn')) {
      showCategoryMenu(Number(el.dataset.catIndex), el);
    }

    if (el.matches('.item-status')) {
      const c = Number(el.dataset.catIndex);
      const i = Number(el.dataset.itemIndex);
      if (appData[c] && appData[c].items[i]) {
        appData[c].items[i].active = !appData[c].items[i].active;
        saveRules(); 
      }
    }

    if (el.matches('.cat-status')) {
      const c = Number(el.dataset.catIndex);
      if (appData[c] && Array.isArray(appData[c].items)) {
        const items = appData[c].items;
        const hasActive = items.some(it => it.active);
        const newState = !hasActive; 
        items.forEach(it => it.active = newState);
        saveRules(); 
      }
    }
  });

  // Enter in Input fangen
  container.addEventListener('keydown', (e) => {
    if (e.target.matches('.cat-add-item-input') && e.key === 'Enter') {
      e.preventDefault();
      addItemFromInputByIndex(Number(e.target.dataset.catIndex));
    }
  });

  // Neue Kategorie anlegen (Top-Level Button)
  const addCatBtn = document.getElementById('add-category-btn');
  const addCatInput = document.getElementById('add-category-input');
  if (addCatBtn && addCatInput) {
    addCatBtn.addEventListener('click', () => {
      const name = addCatInput.value.trim();
      if (!name) return;
      
      appData.push({ timerName: name, maxTime: 60, minRemaining: 0, items: [] });
      addCatInput.value = '';
      saveRules();
    });
  }
}

// Initialisieren & Lifecycle
document.addEventListener('DOMContentLoaded', async () => {
  attachRulesHandlers();
  await loadAndRenderRules();

  setInterval(async () => {
    const activeEl = document.activeElement;
   
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.isContentEditable);
    
    if (!isTyping) {
      console.log("Aktualisiere Rules...");
      await loadAndRenderRules();
    }
  }, 10000);
});