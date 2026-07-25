# Responsive design — supported spectrum & boundaries

The dashboard (`src/ui/dashboard/`) is **desktop-first** but built to hold from ancient screens to ultrawide panels. 
This document records how the scaling works and what range it was designed for.

---

## Scaling

The root font size is the scaling knob:

```css
/* src/ui/dashboard/dashboard.css */
html {
  font-size: clamp(0.875rem, min(0.833vw, 1.5vh), 2rem);
}
```

`0.833vw` = `16px` at 1920px-wide viewport, so this anchor is set to "100%" at 1920px. About every spacing, radius, and type token in `theme.css` is a **plain `rem` value**, so the whole UI scales together.

### Exceptions to the rem/vw system

**Popup** and **Blocker Overlay** are not entirely effected, because they don't use the full width and injections seem to get the `rem` from Host.

---

## Supported viewport ranges _(Size matters)_

| Band | Width | What happens |
|------|-------|--------------|
| **Unsupported** | w: `<250px`, h:`<350px` | _"not supported"_ notice |
| **tiny** | `250 – 599px` | sidebar **xor** `main` |
| **Standard** | `>600` | continuous scaling |
| **Ultrawide 21:9 / 32:9** | any | Anchor keys `vh`, so text/controls don't oversize |
