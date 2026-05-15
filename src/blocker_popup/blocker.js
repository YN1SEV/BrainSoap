browser.runtime.onMessage.addListener((message) => {
  if (message.action === "TRIGGER_BLOCK") {
    renderBlocker(message.seconds, message.redirectUrl);
  }
});

function renderBlocker(seconds, redirectUrl = null) {
  // Prevent duplicate popups
  if (document.getElementById('doom-blocker-overlay')) return;

  // Add class to body to stop scrolling
  document.body.classList.add('blocked-scrolling');

  const overlay = document.createElement('div');
  overlay.id = 'doom-blocker-overlay';

  overlay.innerHTML = `
    <div class="blocker-card">
      <h2>Focus Mode</h2>
      <p>Muscle memory check: Is this how you want to spend your time?</p>
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