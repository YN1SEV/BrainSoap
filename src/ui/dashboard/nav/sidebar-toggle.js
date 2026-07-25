const toggleButton = document.getElementById("toggle-sidebar");
const sidebarNav = document.querySelector(".sidebar nav");

toggleButton?.addEventListener("click", () => {
  const isHidden = document.body.classList.toggle("hide-sidebar");
  toggleButton.setAttribute("aria-expanded", String(!isHidden));
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
