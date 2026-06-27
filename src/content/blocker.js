// not a background script so not there!
globalThis.browser ??= globalThis.chrome;

if (!window.hasBlockerListener) {
  window.hasBlockerListener = true;
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "TRIGGER_BLOCK") {
    if (message.imagePath)
    {
      renderImage(message.imagePath)
    }
    else{
      renderBlocker(message.seconds, message.redirectUrl);
    }
    
  }
});
}


function renderBlocker(seconds, redirectUrl = undefined) {
  // Prevent duplicate popups
  if (document.getElementById('doom-blocker-overlay')) return;

  // Add class to body to stop scrolling
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

  const timer = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      btn.innerText = `Wait (${timeLeft}s)`;
    } else {
      clearInterval(timer);
      btn.disabled = false;
      btn.innerText = "Continue to site";
      btn.style.background = "#28a745"; // Change to green when ready
      btn.focus(); // move keyboard focus to the now-actionable button
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

function renderImage(imagePath){
  try {
  // Prevent duplicate popups
  if (document.getElementById('doom-blocker-image')) return;

  // Add class to body to stop scrolling
  document.body.classList.add('blocked-scrolling');
  
  console.log("rendering image");
  const img = document.createElement('img');
  img.id = 'doom-blocker-image';
  img.src = browser.runtime.getURL(imagePath);
  img.alt = "Time is up — take a break from this site.";

  document.body.appendChild(img);

    
  } catch (e) {
    console.error(e)
  }
}