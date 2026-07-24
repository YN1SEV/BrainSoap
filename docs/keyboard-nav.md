# the Firefox focus-anchor bug
a documentation, and a bit of a confession

## The Core Problem
we route `#rules` / `#stats` / `#settings` with plain `<a href="#stats">` links plus CSS `:target` without JS router.

when a URL hash changes, the browser silently moves its focus navigation starting point to the target element. It does this *even though that section has no `tabindex` and is not focusable itself*. the browser quietly remembers "the next `Tab` press starts searching from here" instead of from wherever focus actually is.

this only happens in Firefox, Chromium was always fine.

## The Fix
we reset the anchor ourselves, one frame later than the browser's own attempt:

```js
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
```

better don't touch `requestAnimationFrame`. it is what lets our reset run *after* Firefox own async anchor shift instead of before it. `e.detail === 0` (a real mouse click reports `1`+, a keyboard-triggered activation reports `0`) is what keeps this scoped to mouse-driven navigation, so a keyboard user activating a sidebar link still gets to continue naturally into the section instead of getting bounced back to the toggle.