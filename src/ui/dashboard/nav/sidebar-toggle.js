const toggleButton = document.getElementById("toggle-sidebar");
const scrim = document.querySelector(".sidebar-scrim");
const sidebarNav = document.querySelector(".sidebar nav");

function setSidebarHidden(isHidden) {
  document.body.classList.toggle("hide-sidebar", isHidden);
  toggleButton.setAttribute("aria-expanded", String(!isHidden));
}

toggleButton?.addEventListener("click", () => {
  setSidebarHidden(!document.body.classList.contains("hide-sidebar"));
});

scrim?.addEventListener("click", () => setSidebarHidden(true));

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setSidebarHidden(true);
});

let linkActivatedByKeyboard = false;

sidebarNav?.addEventListener("click", (e) => {
  linkActivatedByKeyboard = e.detail === 0 && !!e.target.closest("a");
});

function resetFocusAnchor() {
  requestAnimationFrame(() => {
    if (!linkActivatedByKeyboard) toggleButton?.focus();
    linkActivatedByKeyboard = false;
  });
}

function markCurrentNavLink() {
  const currentHash = window.location.hash || "#rules";

  sidebarNav?.querySelectorAll("a").forEach((link) => {
    if (link.getAttribute("href") === currentHash) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function onRouteChange() {
  resetFocusAnchor();
  markCurrentNavLink();
}

window.addEventListener("load", onRouteChange);
window.addEventListener("hashchange", onRouteChange);
