async function redirectTo(url) {
  try {
    await browser.tabs.update({url: url, loadReplace: false});
  } catch (e) {
    console.error("Error occurred while redirecting:", e);
  }
}

async function sendMessage(title, content, name) {
    try {
        browser.notifications.create(name, {
        "type": "basic",
        "iconUrl": browser.runtime.getURL("icons/icon128.png"),
        "title": title,
        "message": content
        });
    }catch (e) {
    console.error("Error occurred while sending message:", e);
    }
}

async function showBlocker(redirectUrl = null) {
  const tabID = await getActiveTabId();
  freezeTab(tabID);
  if(redirectUrl)
  {
    browser.tabs.sendMessage(tabID, {
      action: "TRIGGER_BLOCK",
      seconds: 1,
      redirectUrl: redirectUrl
    });
  }else{
    browser.tabs.sendMessage(tabID, {
      action: "TRIGGER_BLOCK",
      seconds: 10 
    });
  }
  return;

  const overlay = document.createElement('div');
  overlay.className = 'ext-popup-overlay';

  overlay.innerHTML = `
    <div class="ext-popup-content">
      <h3>Extension Alert</h3>
      <p>${message}</p>
      <button class="ext-popup-close">Close</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close logic
  overlay.querySelector('.ext-popup-close').addEventListener('click', () => {
    overlay.remove();
  });

  console.warn("not implemented yet: showBlocker");
}

async function getActiveTabId() {
  try {
    // Query for the tab that is active and in the current window
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length > 0) {
      return tabs[0].id;
    }
  } catch (error) {
    console.error("Error finding active tab:", error);
  }
  return null;
}

async function freezeTab(tabId) {
  try {
    // 1. Mute the tab (Still via the tabs API)
    await browser.tabs.update(tabId, { muted: true });

    // 2. Pause media (Using the new scripting API)
    await browser.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        console.log("Freezing media...");
        const media = document.querySelectorAll('video, audio');
        media.forEach(m => m.pause());
      }
    });
    
    console.log(`Tab ${tabId} frozen.`);
  } catch (error) {
    console.error("MV3 Freeze Error:", error);
  }
}

async function unmuteCurrentTab() {
  try {
    const tabId = await getActiveTabId();
    await browser.tabs.update(tabId, { muted: false });
    console.log(`Tab ${tabId} has been unmuted.`);
  } catch (error) {
    console.error("Failed to unfreeze tab:", error);
  }
}