const debug = (...args) => console.log("[BrainSoap tabs]", ...args);

export async function getActiveTabId() {
  try {
    const queryOptions = [
      { active: true, lastFocusedWindow: true },
      { active: true, currentWindow: true },
    ];

    for (const options of queryOptions) {
      const tabs = await browser.tabs.query(options);
      if (tabs.length > 0) {
        debug("getActiveTabId", { options, tabId: tabs[0].id, url: tabs[0].url });
        return tabs[0].id;
      }
    }

  } catch (error) {
    console.error("Error finding active tab:", error);
  }
  return null;
}

export async function freezeTab(tabId) {
  try {
    debug("freezeTab", { tabId });
    // mute tab via tabs API
    await browser.tabs.update(tabId, { muted: true });

    // pause media via manifest V3 scripting API
    await browser.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        const media = document.querySelectorAll('video, audio');
        media.forEach(m => m.pause());
      }
    });

  } catch (error) {
    console.error("MV3 Freeze Error:", error);
  }
}

export async function unmuteCurrentTab() {
  try {
    const tabId = await getActiveTabId();
    await browser.tabs.update(tabId, { muted: false });
  } catch (error) {
    console.error("Failed to unfreeze tab:", error);
  }
}

// message sender with retry
export async function sendMessageWithRetry(tabId, message, retries = 3, delay = 100) {
  for (let i = 0; i < retries; i++) {
    try {
      debug("sendMessageWithRetry attempt", { tabId, attempt: i + 1, retries, message });
      return await browser.tabs.sendMessage(tabId, message);
    } catch (err) {
      debug("sendMessageWithRetry failed", { tabId, attempt: i + 1, error: String(err) });
      if (i === retries - 1) throw err; // Out of retries, propagate error
      await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
    }
  }
}
