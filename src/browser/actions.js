import { getActiveTabId, freezeTab, sendMessageWithRetry } from "./tabs.js";

const debug = (...args) => console.log("[BrainSoap actions]", ...args);

async function ensureBlockerListener(tabId) {
  debug("ensureBlockerListener:start", { tabId });
  await browser.scripting.executeScript({
    target: { tabId },
    files: ["src/content/blocker.js"],
  });
}

export async function redirectTo(url) {
  try {
    const target = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
    await browser.tabs.update({ url: target, loadReplace: false });
  } catch (e) {
    console.error("Error occurred while redirecting:", e);
  }
}

// fires a desktop notification
export async function sendMessage(title, content, name) {
  try {
    browser.notifications.create(name, {
      "type": "basic",
      "iconUrl": browser.runtime.getURL("icons/icon128.png"),
      "title": title,
      "message": content
    });
  } catch (e) {
    console.error("Error occurred while sending message:", e);
  }
}

// freezes tab and tells content script to show the overlay
export async function showBlocker(redirectUrl = null, tabId = null) {
  try {
    const tabID = tabId ?? await getActiveTabId();
    if (!tabID) throw new Error("No active tab found for blocker");

    debug("showBlocker", { tabID, redirectUrl });
    await freezeTab(tabID);

    const msg = { action: "TRIGGER_BLOCK", seconds: redirectUrl ? 3 : 10 };
    if (redirectUrl) msg.redirectUrl = redirectUrl;

    try {
      await sendMessageWithRetry(tabID, msg, 10, 150);
    } catch (error) {
      debug("showBlocker first send failed, reinjecting blocker listener", { tabID, error: String(error) });
      await ensureBlockerListener(tabID);
      await sendMessageWithRetry(tabID, msg, 10, 150);
    }
  } catch (error) {
    console.error("Message failed after multiple attempts:", error);
  }
}

// freezes tab and covers it with a full screen image instead
export async function showImage(imagePath, redirectUrl = null, tabId = null) {
  try {
    const tabID = tabId ?? await getActiveTabId();
    if (!tabID) throw new Error("No active tab found for blocker image");

    debug("showImage", { tabID, imagePath, redirectUrl });
    await freezeTab(tabID);

    const msg = { action: "TRIGGER_BLOCK", imagePath: imagePath };
    if (redirectUrl) msg.redirectUrl = redirectUrl;

    try {
      await sendMessageWithRetry(tabID, msg);
    } catch (error) {
      debug("showImage first send failed, reinjecting blocker listener", { tabID, error: String(error) });
      await ensureBlockerListener(tabID);
      await sendMessageWithRetry(tabID, msg);
    }
  } catch (error) {
    console.error("Message failed after multiple attempts:", error);
  }
}
