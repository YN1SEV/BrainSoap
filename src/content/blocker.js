//file needs rework


//cross browser compatibility
globalThis.browser ??= globalThis.chrome;

//prevent duplicates
if (!window.hasBlockerListener) {
  window.hasBlockerListener = true;

  const listener = browser.runtime.onMessage.addListener((message) => {
    if (message.action === "TRIGGER_BLOCK") {   
      console.log("rendering something")
      if (message.imagePath) renderImage(message.imagePath)
      else renderBlocker(message.seconds, message.redirectUrl);
    }
  });
  console.log(listener)
}

function renderBlocker(seconds, redirectUrl = undefined) {
  // Prevent duplicate popups
  if (document.getElementById('doom-blocker-overlay')) return;

  // Build body, needs rework
  document.body.classList.add('blocked-scrolling');

  const overlay = document.createElement('div');
  overlay.id = 'doom-blocker-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Focus reminder');

  // not worth it rn to make a html file
  overlay.innerHTML = `
    <div class="blocker-card">
      <h2>Focus Mode</h2>
      <p>Reality check: Is this how you want to spend your time?</p>
      <button id="close-blocker" disabled>Wait (${seconds}s)</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const btn = document.getElementById('close-blocker');
  let timeLeft = seconds;

  // wait before ignoring limit
  const timer = setInterval(() => {
    timeLeft--;      //cnt down every second
    if (timeLeft > 0) btn.innerText = `Wait (${timeLeft}s)`;
    else {
      clearInterval(timer);
      btn.disabled = false;
      btn.innerText = "Continue to site";
      btn.style.background = "#28a745"; 
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
}

// covers whole page with single image
function renderImage(imagePath, redirectUrl = undefined) {
  console.log("attemting image render")
  let seconds = 3
  let resolvedPath = browser.runtime.getURL(imagePath)
  try {
    // Prevent duplicate popups
    if (document.getElementById('doom-blocker-image')) return;

    // Build body, needs rework
    document.body.classList.add('blocked-scrolling');

    const overlay = document.createElement('div');
    overlay.id = 'doom-blocker-image';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Focus reminder');

    // not worth it rn to make a html file
    overlay.innerHTML = `
      <div class="blocker-card">
        <img src="${resolvedPath}">
        <button id="close-blocker" disabled>Wait (${seconds}s)</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const btn = document.getElementById('close-blocker');
    let timeLeft = seconds;

    // wait before ignoring limit
    const timer = setInterval(() => {
      timeLeft--;      //cnt down every second
      if (timeLeft > 0) btn.innerText = `Wait (${timeLeft}s)`;
      else {
        clearInterval(timer);
        btn.disabled = false;
        btn.innerText = "Continue to site";
        btn.style.background = "#28a745"; 
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
  } catch (e) {console.error(e)}
}