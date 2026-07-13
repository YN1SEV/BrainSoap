import { appData, saveRules, saveAndRender, refreshTimers, loadAndRenderRules } from "./render_rules.js";
import { showCategoryMenu } from "./cat_menu.js";
import { getNewCategoryDefaults, getRefreshMs } from "../../../utils/settings.js";
import { hasOptOutPrefix, domainOf } from "../../../utils/url.js";

// build a fresh category from the user's configured defaults
async function makeCategory(name) {
  const d = await getNewCategoryDefaults();
  const useRedirect = d.action === "redirect" && d.redirectUrl;
  const category = {
    timerName: name,
    maxTime: Number(d.maxTime) || 60,
    actions: useRedirect ? ["redirect"] : ["popup"],
    items: [],
  };
  if (useRedirect) category.redirectUrl = d.redirectUrl;
  return category;
}

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

  async function addItemFromInputByIndex(idx) {
    const input = container.querySelector(`.cat-add-item-input[data-cat-index="${idx}"]`);
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    const cleaned = hasOptOutPrefix(val)
      ? val.replace(/^[^a-z0-9]+/i, "")
      : (domainOf(val) || val);
    
      const newItem = { name: cleaned, url: cleaned, active: true };
    if (!appData[idx]) appData[idx] = await makeCategory('Unknown');
    appData[idx].items.push(newItem);
    saveAndRender();
  }

  // the add-site rows are <form>s, so Enter and the Add button both submit natively
  container.addEventListener('submit', (e) => {
    if (e.target.matches('.cat-add-item')) {
      e.preventDefault();
      addItemFromInputByIndex(Number(e.target.dataset.catIndex));
    }
  });

  container.addEventListener('click', (e) => {
    const el = e.target;
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

  const addCatForm = document.getElementById('add-category-form');
  const addCatInput = document.getElementById('add-category-input');
  if (addCatForm && addCatInput) {
    addCatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = addCatInput.value.trim();
      if (!name) return;
      appData.push(await makeCategory(name));
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
      await refreshTimers();
    }
  }, await getRefreshMs());
});
