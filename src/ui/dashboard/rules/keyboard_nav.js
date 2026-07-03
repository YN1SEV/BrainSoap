function setupNavRoving() {
  const nav = document.querySelector('.sidebar nav');
  const links = nav ? [...nav.querySelectorAll('a')] : [];

  if (!links.length) return;

  links.forEach((link, i) => {
    link.tabIndex = i === 0 ? 0 : -1;
  });

  nav.addEventListener('keydown', (e) => {
    const current = links.indexOf(document.activeElement);

    if (current === -1) return;

    let target = null;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      target = (current + 1) % links.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      target = (current - 1 + links.length) % links.length;
    } else if (e.key === 'Home') {
      target = 0;
    } else if (e.key === 'End') {
      target = links.length - 1;
    }

    if (target === null) return;

    e.preventDefault();
    links[current].tabIndex = -1;
    links[target].tabIndex = 0;
    links[target].focus();
  });
}

const INNER_CONTROLS = '.cat-status, .cat-menu-btn, .items, .item-status, .cat-add-item-input, .cat-add-item-btn';
const OPENED_CONTROLS = '.cat-status, .cat-menu-btn, .item-status, .cat-add-item-input, .cat-add-item-btn';

// collapse every category and drop its controls out of the tab order
const resetTabindex = (container) => {
  container.querySelectorAll('.category').forEach(cat => {
    cat.tabIndex = 0;
    cat.classList.remove('kbd-open');
    
    cat.querySelectorAll(INNER_CONTROLS).forEach(el => {
      el.tabIndex = -1;
    });
  });
};

// expand one category and close any others
const openCategory = (category, container) => {
  container.querySelectorAll('.category.kbd-open').forEach(other => {
    if (other !== category) {
      closeCategory(other);
    }
  });

  category.classList.add('kbd-open');
  
  category.querySelectorAll(OPENED_CONTROLS).forEach(el => {
    el.tabIndex = 0;
  });
};

const closeCategory = (category) => {
  category.classList.remove('kbd-open');
  
  category.querySelectorAll(INNER_CONTROLS).forEach(el => {
    el.tabIndex = -1;
  });
};

function setupRulesNav() {
  const container = document.getElementById('categories');

  if (!container) return;

  resetTabindex(container);

  new MutationObserver(() => {
    resetTabindex(container);
  }).observe(container, { childList: true });

  container.addEventListener('keydown', (e) => {
    const category = e.target.closest('.category');

    if (!category) return;

    if (e.target === category) {
      const cards = [...container.querySelectorAll('.category')];
      const index = cards.indexOf(category);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        cards[Math.min(index + 1, cards.length - 1)]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        cards[Math.max(index - 1, 0)]?.focus();
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        openCategory(category, container);
        category.querySelector(OPENED_CONTROLS)?.focus();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        category.querySelector('.cat-status')?.click();
      }
      
      return;
    }

    if (e.key === 'Escape' || e.key === 'ArrowLeft') {
      e.preventDefault();
      closeCategory(category);
      category.focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupNavRoving();
  setupRulesNav();
});