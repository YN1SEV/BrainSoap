import { getActiveTabId, freezeTab, sendMessageWithRetry } from "./tabs.js";
import { debugLog, debugError } from "../utils/debug.js";

export async function redirectTo(url, tabId = null) {
  try {
    const target = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
    debugLog("redirect requested", { target, tabId });
    if (tabId == null) await browser.tabs.update({ url: target });
    else await browser.tabs.update(tabId, { url: target });
  } catch (e) {
    console.error("Error occurred while redirecting:", e);
  }
}

// fires a desktop notification
export async function sendMessage(title, content, name) {
  try {
    debugLog("notification requested", { name, title });
    await browser.notifications.create(name, {
      "type": "basic",
      "iconUrl": browser.runtime.getURL("assets/icons/icon128.png"),
      "title": title,
      "message": content
    });
  } catch (e) {
    debugError("notification failed", e, { name });
  }
}

// freezes tab and tells content script to show the overlay
export async function showBlocker(redirectUrl = null, tabId = null) {
  const targetTabId = tabId ?? await getActiveTabId();
  if (targetTabId == null) return;
  debugLog("blocker requested", { tabId: targetTabId, redirect: Boolean(redirectUrl) });
  await freezeTab(targetTabId);

  const msg = { action: "TRIGGER_BLOCK", seconds: redirectUrl ? 3 : 10 };
  if (redirectUrl) msg.redirectUrl = redirectUrl;

  try {
    await sendMessageWithRetry(targetTabId, msg, 8, 250);
  } catch (error) {
    debugError("blocker message failed", error, { tabId: targetTabId });
  }
}

// freezes tab and covers it with a full screen image instead
export async function showImage(imagePath, redirectUrl = null, tabId = null) {
  const targetTabId = tabId ?? await getActiveTabId();
  if (targetTabId == null) return;
  debugLog("image blocker requested", { tabId: targetTabId, imagePath });
  await freezeTab(targetTabId);
  const msg = { action: "TRIGGER_BLOCK", imagePath: imagePath };
  if (redirectUrl) msg.redirectUrl = redirectUrl;
  try {
    await sendMessageWithRetry(targetTabId, msg, 8, 250);
  } catch (error) {
    debugError("image blocker message failed", error, { tabId: targetTabId });
  }
}
