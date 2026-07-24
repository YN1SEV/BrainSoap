import { getActiveTabId, freezeTab, sendMessageWithRetry } from "./tabs.js";

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
export async function showBlocker(redirectUrl = null) {
  const tabID = await getActiveTabId();
  freezeTab(tabID);

  const msg = { action: "TRIGGER_BLOCK", seconds: redirectUrl ? 3 : 10 };
  if (redirectUrl) msg.redirectUrl = redirectUrl;

  sendMessageWithRetry(tabID, msg);
}

// freezes tab and covers it with a full screen image instead
export async function showImage(imagePath, redirectUrl = null) {
  console.log("showing image")
  const tabID = await getActiveTabId();
  freezeTab(tabID);
  const msg = { action: "TRIGGER_BLOCK", imagePath: imagePath };
  if (redirectUrl) msg.redirectUrl = redirectUrl;
  try {
    await sendMessageWithRetry(tabID, msg);
  } catch (error) {
    console.error("Message failed after multiple attempts:", error);
  }
}
