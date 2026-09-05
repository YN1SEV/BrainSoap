import { debugLog, debugError } from "../utils/debug.js";

export async function getActiveTabId() {
  try {
    const queries = [
      { active: true, lastFocusedWindow: true },
      { active: true, currentWindow: true },
      { active: true }
    ];

    for (const query of queries) {
      try {
        const tabs = await browser.tabs.query(query);
        const tabId = tabs.find((tab) => tab?.id != null)?.id;
        if (tabId != null) {
          debugLog("active tab selected", { query, tabId });
          return tabId;
        }
      } catch {
        // Try the next query shape for Firefox Android compatibility.
      }
    }
  } catch (error) {
    debugError("active tab lookup failed", error);
  }
  return null;
}

export async function freezeTab(tabId) {
  if (tabId == null) return;

  try {
    await browser.tabs.sendMessage(tabId, { action: "PAUSE_MEDIA" });
    return;
  } catch (error) {
    // The content script may not be ready on a newly loaded page.
  }

  try {
    await browser.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        const media = document.querySelectorAll('video, audio');
        media.forEach(m => m.pause());
      }
    });
  } catch (error) {
    console.error("Media pause failed:", error);
  }
}

// message sender with retry
export async function sendMessageWithRetry(tabId, message, retries = 8, delay = 250) {
  debugLog("sending tab message", { tabId, action: message.action });
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      return await browser.tabs.sendMessage(tabId, message);
    } catch (error) {
      lastError = error;

      if (i === 0) {
        try {
          await browser.scripting.executeScript({
            target: { tabId },
            files: ["src/content/blocker.js"],
            injectImmediately: true,
          });
        } catch (injectionError) {
          debugError("content script injection unavailable", injectionError, { tabId });
        }
      }

      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
