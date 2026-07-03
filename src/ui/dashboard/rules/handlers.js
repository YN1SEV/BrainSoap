import { appData, saveRules, saveAndRender, refreshTimers, loadAndRenderRules } from "./render_rules.js";
import { showCategoryMenu } from "./cat_menu.js";

// reflect on or off state on a toggle button
function paintStatus(button, active) {
  if (!button) return;
  button.classList.toggle('active', active);
  button.classList.toggle('inactive', !active);
  button.setAttribute('aria-pressed', String(active));
}

function attachRulesHandlers() {
  const container = document.getElementById('categories');
  if (!container) return;

  function addItemFromInputByIndex(idx) {
    const input = container.querySelector(`.cat-add-item-input[data-cat-index="${idx}"]`);
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    const newItem = { name: val, url: val, active: true };
    if (!appData[idx]) appData[idx] = { timerName: 'Unknown', maxTime: 60, actions: ['popup'], items: [] };
    appData[idx].items.push(newItem);
    saveAndRender();
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
      const category = appData[c];
      if (category && category.items[i]) {
        const active = !category.items[i].active;
        category.items[i].active = active;
        paintStatus(el, active);
        paintStatus(
          container.querySelector(`.cat-status[data-cat-index="${c}"]`),
          category.items.some(it => it.active)
        );
        saveRules();
      }
    }
    if (el.matches('.cat-status')) {
      const c = Number(el.dataset.catIndex);
      const category = appData[c];
      if (category && Array.isArray(category.items)) {
        const newState = !category.items.some(it => it.active);
        category.items.forEach(it => it.active = newState);
        paintStatus(el, newState);
        container
          .querySelectorAll(`.item-status[data-cat-index="${c}"]`)
          .forEach(btn => paintStatus(btn, newState));
        saveRules();
      }
    }
  });

  container.addEventListener('keydown', (e) => {
    if (e.target.matches('.cat-add-item-input') && e.key === 'Enter') {
      e.preventDefault();
      addItemFromInputByIndex(Number(e.target.dataset.catIndex));
    }
  });

  const addCatBtn = document.getElementById('add-category-btn');
  const addCatInput = document.getElementById('add-category-input');
  if (addCatBtn && addCatInput) {
    addCatBtn.addEventListener('click', () => {
      const name = addCatInput.value.trim();
      if (!name) return;
      appData.push({ timerName: name, maxTime: 60, actions: ['popup'], items: [] });
      addCatInput.value = '';
      saveAndRender();
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  attachRulesHandlers();
  await loadAndRenderRules();
  setInterval(async () => {
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.isContentEditable);
    if (!isTyping) {
      console.log("refreshing rules...");
      await loadAndRenderRules();
    }
  }, 10000);
});
