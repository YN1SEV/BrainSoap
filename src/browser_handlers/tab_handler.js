
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