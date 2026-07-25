# the Firefox focus-anchor bug
a documentation, and a bit of a confession

## The Core Problem
we route `#rules` / `#stats` / `#settings` with plain `<a href="#stats">` links plus CSS `:target` without JS router.

when a URL hash changes, the browser silently moves its focus navigation starting point to the target element. It does this *even though that section has no `tabindex` and is not focusable itself*. the browser quietly remembers "the next `Tab` press starts searching from here" instead of from wherever focus actually is.

this only happens in Firefox, Chromium was always fine.

## The Fix
we reset the anchor ourselves, one frame later than the browser's own attempt.
lives in `src/ui/dashboard/nav/sidebar-toggle.js`:

```js
const sidebarNav = document.querySelector(".sidebar nav");
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

window.addEventListener("load", onRouteChange);
window.addEventListener("hashchange", onRouteChange);
```

better don't touch `requestAnimationFrame`. it is what lets our reset run *after* Firefox own async anchor shift instead of before it. `e.detail === 0` (a real mouse click reports `1`+, a keyboard-triggered activation reports `0`) is what keeps this scoped to mouse-driven navigation, so a keyboard user activating a sidebar link still gets to continue naturally into the section instead of getting bounced back to the toggle.

`onRouteChange` wraps `resetFocusAnchor` together with `markCurrentNavLink`, which puts `aria-current="page"` on the sidebar link of the section currently shown.

## Where the rest lives
the remaining global keyboard handlers — Escape to step back out of a category, arrow-key roving focus inside a control group, and the category-card Tab shortcuts — sit in `src/ui/dashboard/nav/keyboard-nav.js`.

both files are loaded with `type="module"`, so each keeps its own top-level scope. as plain `<script>`s they would share one global lexical scope and collide on `toggleButton`, which throws a `SyntaxError` and silently kills the second file.
