//file needs rework


//cross browser compatibility
globalThis.browser ??= globalThis.chrome;

//prevent duplicates
if (!window.hasBlockerListener) {
  window.hasBlockerListener = true;

  const listener = browser.runtime.onMessage.addListener((message) => {
    if (message.action === "TRIGGER_BLOCK") {   
      console.log("rendering something")
      if (message.imagePath) renderImage(message.imagePath, message.redirectUrl)
      else renderBlocker(message.seconds, message.redirectUrl);
    }
  });
  console.log(listener)
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

function renderBlocker(seconds, redirectUrl = undefined) {
  // Prevent duplicate popups
  if (document.getElementById('doom-blocker-overlay')) return;

  // Sanitize input to a non-negative integer
  const safeSeconds = Math.max(0, parseInt(seconds, 10) || 0);

  document.body.classList.add('blocked-scrolling');

  const overlay = document.createElement('div');
  overlay.id = 'doom-blocker-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Focus reminder');

  if (typeof cachedTheme !== 'undefined' && cachedTheme !== 'system') {
    overlay.dataset.theme = cachedTheme;
  }

  // Static structure avoids innerHTML linting triggers
  overlay.innerHTML = `
    <div class="blocker-card">
      <h2>Focus Mode</h2>
      <p>Reality check: Is this how you want to spend your time?</p>
      <button id="close-blocker" disabled></button>
    </div>
  `;

  document.body.appendChild(overlay);

  const btn = overlay.querySelector('#close-blocker');
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
    document.body.classList.remove('blocked-scrolling');
    overlay.remove();
    browser.runtime.sendMessage({
      action: 'BLOCKER_CONFIRMED',
      url: redirectUrl,
    });
  };
}

// covers whole page with single image
function renderImage(imagePath, redirectUrl = undefined) {
  console.log("attempting image render");
  const seconds = 3;

  try {
    // Prevent duplicate popups
    if (document.getElementById('doom-blocker-image')) return;

    const resolvedPath = browser.runtime.getURL(imagePath);

    document.body.classList.add('blocked-scrolling');

    const overlay = document.createElement('div');
    overlay.id = 'doom-blocker-image';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Focus reminder');

    if (typeof cachedTheme !== 'undefined' && cachedTheme !== 'system') {
      overlay.dataset.theme = cachedTheme;
    }

    // Static HTML without template variables to satisfy web-ext lint
    overlay.innerHTML = `
      <div class="blocker-card">
        <img id="blocker-img" alt="Focus reminder image">
        <button id="close-blocker" disabled></button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Safely assign image source and dynamic button text
    const img = overlay.querySelector('#blocker-img');
    const btn = overlay.querySelector('#close-blocker');

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
      document.body.classList.remove('blocked-scrolling');
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