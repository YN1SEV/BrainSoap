
// show or hide the sidebar when the button is clicked
const toggleBtn = document.getElementById("toggle-sidebar");

toggleBtn?.addEventListener("click", () => {
  const isHidden = document.body.classList.toggle("hide-sidebar");
  toggleBtn.setAttribute("aria-expanded", String(!isHidden));
});

// jumping to #rules/#stats/#settings section can silently move focus
const sidebarNav = document.querySelector(".sidebar nav");
let keyboardActivatedLink = false;

sidebarNav?.addEventListener("click", (e) => {
  keyboardActivatedLink = e.detail === 0 && !!e.target.closest("a");
});

function resetFocusAnchor() {
  requestAnimationFrame(() => {
    if (!keyboardActivatedLink) toggleBtn?.focus();
    keyboardActivatedLink = false;
  });
}

window.addEventListener("load", resetFocusAnchor);
window.addEventListener("hashchange", resetFocusAnchor);

let mouseUsedInContent = false;

document.addEventListener("mousedown", (e) => {
  mouseUsedInContent = !e.target.closest(".sidebar, #toggle-sidebar");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && mouseUsedInContent) {
    mouseUsedInContent = false;
    e.preventDefault();
    toggleBtn?.focus();
  } else if (e.key === "Escape") {
    mouseUsedInContent = false;

    const category = document.activeElement.closest(".category");
    const onCardAlready = document.activeElement.matches(".category");

    if (category && !onCardAlready) {
      category.focus();
    } else {
      toggleBtn?.focus();
    }
  }
});

// Enter and Space activate do stuff the same way
document.addEventListener("keydown", (e) => {
  const el = document.activeElement;

  if (e.key === "Enter" && el.matches('input[type="checkbox"]')) {
    e.preventDefault();
    el.click();
  } else if (e.key === " " && el.matches("a, button")) {
    e.preventDefault();
    el.click();
  }
});

const ARROW_KEYS = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
const GROUP_SELECTOR = "nav, form, .items, .setting-action-checkboxes";

document.addEventListener("keydown", (e) => {
  if (!ARROW_KEYS.includes(e.key)) return;

  const el = document.activeElement;
  const isTextInput = el.tagName === "INPUT" && el.type === "text";

  if (el.tagName === "TEXTAREA" || el.tagName === "SELECT") return;
  if (isTextInput && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return;

  const group = el.closest(".category") ?? el.closest(GROUP_SELECTOR);
  if (!group) return;

  const focusable = [...group.querySelectorAll("a, button, input, select, textarea")]
    .filter((node) => !node.disabled);
  const index = focusable.indexOf(el);
  if (index === -1) return;

  const forward = e.key === "ArrowDown" || e.key === "ArrowRight";
  const next = focusable[(index + (forward ? 1 : -1) + focusable.length) % focusable.length];

  e.preventDefault();
  next.focus();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== "ArrowDown") return;

  const card = document.activeElement;
  if (!card.matches(".category")) return;

  const firstControl = card.querySelector("a, button, input, select, textarea");
  if (!firstControl) return;

  e.preventDefault();
  firstControl.focus();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Tab" || e.shiftKey) return;

  const card = document.activeElement;
  if (!card.matches(".category")) return;

  const nextCategory = card.nextElementSibling;
  const target = nextCategory?.matches(".category")
    ? nextCategory
    : document.getElementById("add-category-input");
  if (!target) return;

  e.preventDefault();
  target.focus();
});
