/**
 * Global keyboard navigation for the dashboard: Escape to step back out of a
 * category, arrow keys to move inside a control group, and Tab shortcuts
 * between category cards.
 */

const toggleButton = document.getElementById("toggle-sidebar");
const ARROW_KEYS = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
const GROUP_SELECTOR = "nav, form, .items, .setting-action-checkboxes";
const FOCUSABLE_SELECTOR = "a, button, input, select, textarea";

function focusedElement() {
  const active = document.activeElement;
  return active instanceof HTMLElement ? active : null;
}

let mouseUsedInContent = false;

document.addEventListener("mousedown", (e) => {
  mouseUsedInContent = !e.target.closest(".sidebar, #toggle-sidebar");
});


function handleFocusEscapeHatch(e) {
  if (e.key === "Tab" && mouseUsedInContent) {
    mouseUsedInContent = false;
    e.preventDefault();
    toggleButton?.focus();
    return;
  }

  if (e.key !== "Escape") return;
  mouseUsedInContent = false;

  const active = focusedElement();
  if (!active) return;

  const category = active.closest(".category");
  const alreadyOnCard = active.matches(".category");

  if (category && !alreadyOnCard) {
    category.focus();
  } else {
    toggleButton?.focus();
  }
}

function handleActivationKeys(e) {
  const active = focusedElement();
  if (!active) return;

  if (e.key === "Enter" && active.matches('input[type="checkbox"]')) {
    e.preventDefault();
    active.click();
  } else if (e.key === " " && active.matches("a, button")) {
    e.preventDefault();
    active.click();
  }
}

function handleArrowNavigation(e) {
  if (!ARROW_KEYS.includes(e.key)) return;

  const active = focusedElement();
  if (!active) return;

  const isTextInput = active.tagName === "INPUT" && active.type === "text";
  if (active.tagName === "TEXTAREA" || active.tagName === "SELECT") return;
  if (isTextInput && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return;

  const group = active.closest(".category") ?? active.closest(GROUP_SELECTOR);
  if (!group) return;

  const focusable = [...group.querySelectorAll(FOCUSABLE_SELECTOR)]
    .filter((node) => !node.disabled);
  const index = focusable.indexOf(active);
  if (index === -1) return;

  const forward = e.key === "ArrowDown" || e.key === "ArrowRight";
  const next = focusable[(index + (forward ? 1 : -1) + focusable.length) % focusable.length];

  e.preventDefault();
  next.focus();
}

function handleEnterCategory(e) {
  if (e.key !== "Enter" && e.key !== "ArrowDown") return;

  const card = focusedElement();
  if (!card?.matches(".category")) return;

  const firstControl = card.querySelector(FOCUSABLE_SELECTOR);
  if (!firstControl) return;

  e.preventDefault();
  firstControl.focus();
}

function handleSkipToNextCategory(e) {
  if (e.key !== "Tab" || e.shiftKey) return;

  const card = focusedElement();
  if (!card?.matches(".category")) return;

  const nextCategory = card.nextElementSibling;
  const target = nextCategory?.matches(".category")
    ? nextCategory
    : document.getElementById("add-category-input");
  if (!target) return;

  e.preventDefault();
  target.focus();
}

document.addEventListener("keydown", handleFocusEscapeHatch);
document.addEventListener("keydown", handleActivationKeys);
document.addEventListener("keydown", handleArrowNavigation);
document.addEventListener("keydown", handleEnterCategory);
document.addEventListener("keydown", handleSkipToNextCategory);
