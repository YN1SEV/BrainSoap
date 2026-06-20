let focusedCategoryIndex = null;

function applyRulesFocusState() {
  const categoryEls = document.querySelectorAll('#categories .category');
  categoryEls.forEach((categoryEl, idx) => {
    const isFocusedCategory = focusedCategoryIndex === idx;
    const itemButtons = categoryEl.querySelectorAll('.item-status');
    const itemList = categoryEl.querySelector('.items');

    if (itemList) {
      itemList.tabIndex = 0;
      itemList.dataset.focusMode = isFocusedCategory ? 'open' : 'closed';
    }

    itemButtons.forEach((btn) => {
      btn.tabIndex = isFocusedCategory ? 0 : -1;
    });
  });
}

function focusCategoryList(catIndex) {
  focusedCategoryIndex = catIndex;
  applyRulesFocusState();

  const list = document.querySelector(`#categories .items[data-cat-index="${catIndex}"]`);
  if (list) {
    list.focus();
  }
}

function focusNextCategoryList(currentIndex) {
  if (!Array.isArray(appData) || appData.length === 0) return;
  const nextIndex = currentIndex + 1;
  if (nextIndex < appData.length) {
    focusedCategoryIndex = nextIndex;
    applyRulesFocusState();

    const nextList = document.querySelector(`#categories .items[data-cat-index="${nextIndex}"]`);
    if (nextList) {
      nextList.focus();
    }
    return;
  }

  focusedCategoryIndex = null;
  applyRulesFocusState();
  const addCategoryInput = document.getElementById('add-category-input');
  if (addCategoryInput) {
    addCategoryInput.focus();
  }
}
