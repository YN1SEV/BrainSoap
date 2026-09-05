//file needs rework


//cross browser compatibility
globalThis.browser ??= globalThis.chrome;

console.log(`[BrainSoap] content script loaded ${location.href}`);

//prevent duplicates
if (!window.hasBlockerListener) {
  window.hasBlockerListener = true;

  browser.runtime.onMessage.addListener((message) => {
    console.log(`[BrainSoap] content message received ${message.action}`);
    if (message.action === "PAUSE_MEDIA") {
      document.querySelectorAll('video, audio').forEach((media) => media.pause());
    } else if (message.action === "TRIGGER_BLOCK") {
      if (message.imagePath) renderImage(message.imagePath, message.redirectUrl)
      else renderBlocker(message.seconds, message.redirectUrl);
    }
  });
}

let cachedTheme = 'system';
browser.storage.sync.get('settings')
  .then(({ settings }) => { cachedTheme = settings?.theme ?? 'system'; })
  .catch(() => {});
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings) {
    cachedTheme = changes.settings.newValue?.theme ?? 'system';
  }
});

function fetchExtensionText(path) {
  return fetch(browser.runtime.getURL(path)).then((r) => r.text()).catch(() => '');
}

const blockerCssPromise = fetchExtensionText('src/content/blocker.css');
const overlayHtmlPromise = fetchExtensionText('src/content/blocker-overlay.html');
const imageHtmlPromise = fetchExtensionText('src/content/blocker-image.html');

function lockPageScroll() {
  document.documentElement.style.setProperty('overflow', 'hidden', 'important');
  document.body?.style.setProperty('overflow', 'hidden', 'important');
}
function unlockPageScroll() {
  document.documentElement.style.removeProperty('overflow');
  document.body?.style.removeProperty('overflow');
}

function waitForBody() {
  if (document.body) return Promise.resolve(document.body);

  return new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve(document.body), { once: true });
  });
}

// "closed" so page scripts can't reach in via host.shadowRoot either.
function createShadowHost(id) {
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Focus reminder');

  if (typeof cachedTheme !== 'undefined' && cachedTheme !== 'system') {
    overlay.dataset.theme = cachedTheme;
  }

  const shadow = overlay.attachShadow({ mode: 'closed' });
  return { overlay, shadow };
}

function populateShadow(shadow, css, html) {
  const style = document.createElement('style');
  style.textContent = css;
  shadow.appendChild(style);

  // reworked to comply with firefox safety standards
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  Array.from(doc.body.childNodes).forEach((node) => {
    shadow.appendChild(document.importNode(node, true));
  });
}

async function renderBlocker(seconds, redirectUrl = undefined) {
  try {
    // Prevent duplicate popups
    if (document.getElementById('doom-blocker-overlay')) return;

    await waitForBody();

  // Sanitize input to a non-negative integer
  const safeSeconds = Math.max(0, parseInt(seconds, 10) || 0);

  lockPageScroll();

  const { overlay, shadow } = createShadowHost('doom-blocker-overlay');
  const [css, html] = await Promise.all([blockerCssPromise, overlayHtmlPromise]);
  populateShadow(shadow, css, html);

  document.body.appendChild(overlay);

  const btn = shadow.querySelector('#close-blocker');
  let timeLeft = safeSeconds;

  // Handle immediate state if timer is 0
  if (timeLeft === 0) {
    btn.disabled = false;
    btn.textContent = 'Continue to site';
    btn.classList.add('ready');
    btn.focus();
  } else {
    btn.textContent = `Wait (${timeLeft}s)`;

    const timer = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        btn.textContent = `Wait (${timeLeft}s)`;
      } else {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = 'Continue to site';
        btn.classList.add('ready');
        btn.focus();
      }
    }, 1000);
  }

    btn.onclick = () => {
      unlockPageScroll();
      overlay.remove();
      browser.runtime.sendMessage({
        action: 'BLOCKER_CONFIRMED',
        url: redirectUrl,
      });
    };
  } catch (error) {
    console.error("Error rendering blocker:", error);
  }
}

// covers whole page with single image
async function renderImage(imagePath, redirectUrl = undefined) {
  const seconds = 3;

  try {
    // Prevent duplicate popups
    if (document.getElementById('doom-blocker-image')) return;

    await waitForBody();

    const resolvedPath = browser.runtime.getURL(imagePath);

    lockPageScroll();

    const { overlay, shadow } = createShadowHost('doom-blocker-image');
    const [css, html] = await Promise.all([blockerCssPromise, imageHtmlPromise]);
    populateShadow(shadow, css, html);

    document.body.appendChild(overlay);

    // Safely assign image source and dynamic button text
    const img = shadow.querySelector('#blocker-img');
    const btn = shadow.querySelector('#close-blocker');

    if (img) img.src = resolvedPath;

    let timeLeft = seconds;
    btn.textContent = `Wait (${timeLeft}s)`;

    const timer = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        btn.textContent = `Wait (${timeLeft}s)`;
      } else {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = "Continue to site";
        btn.classList.add('ready');
        btn.focus();
      }
    }, 1000);

    btn.onclick = () => {
      unlockPageScroll();
      overlay.remove();
      browser.runtime.sendMessage({ 
        action: "BLOCKER_CONFIRMED", 
        url: redirectUrl
      });
    };
  } catch (e) {
    console.error("Error rendering blocker image:", e);
  }
}