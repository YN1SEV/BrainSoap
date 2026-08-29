import { customStorage } from "../browser/storage.js";
import { defaultSettings, defaultBlacklist } from "../utils/defaults.js";
import { getCleanedIdentifier, isTrackableUrl } from "../utils/url.js";
import { toDateKey } from "../utils/time.js";
import { unmuteCurrentTab, getActiveTabId } from "../browser/tabs.js";
import { redirectTo } from "../browser/actions.js";
import { logActiveDay, accrueFocusTime, computeAndSaveStats } from "../services/stats-service.js";
import { startSession, flushSession, checkThresholds, publishTimerState, getBlacklist } from "../services/session-service.js";

// cross-browser compatibility
globalThis.browser ??= globalThis.chrome;

const debug = (...args) => console.log("[BrainSoap background]", ...args);

globalThis.addEventListener("error", (event) => {
  console.error("[BrainSoap background] uncaught error", event.error ?? event.message);
});

globalThis.addEventListener("unhandledrejection", (event) => {
  console.error("[BrainSoap background] unhandled rejection", event.reason);
});

const trackable = async (url) => (
  isTrackableUrl(url) ? getCleanedIdentifier(url, await getBlacklist()) : null
);


// catch silent fail
globalThis.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
});


// initialization
browser.runtime.onInstalled.addListener(async (details) => {
  debug("onInstalled", details);
  await customStorage.resetSettings(defaultSettings);
  if (details.reason === "install") {
    await customStorage.setSync('blacklist', defaultBlacklist);
    await customStorage.setLocal('installDate', toDateKey());
  }
  await customStorage.clearLocalStorage();
});

browser.runtime.onStartup.addListener(async () => {
  debug("onStartup");
  await customStorage.checkSettingsExists(defaultSettings);
  const blacklist = await customStorage.getSyncFresh('blacklist');
  if (!Array.isArray(blacklist)) {
    debug("restoring missing blacklist defaults");
    await customStorage.setSync('blacklist', defaultBlacklist);
  }
  await customStorage.clearLocalStorage();
});

// refreshes every minute, needs to be revised
browser.alarms.create("tick", { periodInMinutes: 1 });
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "tick") return;
  try {
    debug("tick alarm fired");
    if (await customStorage.getLocal('paused')) return;
    await flushSession();
    await accrueFocusTime();
    await logActiveDay();
    await checkThresholds(false);
    await publishTimerState();
    await computeAndSaveStats();
  } catch (e) { console.error("tick failed:", e); }
});

// track tab switching
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await browser.tabs.get(tabId);
    debug("tab activated", { tabId, url: tab?.url });
    await startSession(await trackable(tab.url), true, tabId);
  } catch (e) { console.error("onActivated failed:", e); }
});

// track url switching within tab and reload completion
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url && changeInfo.status !== "complete") return;

  debug("tab updated", {
    tabId,
    url: tab?.url,
    changedUrl: changeInfo.url,
    status: changeInfo.status,
  });

  await startSession(await trackable(tab.url), true, tabId);
});

// content script / popup messages
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debug("runtime message", message, { senderUrl: sender?.url });

  if (message.action === "BLOCKER_CONFIRMED") {
    if (message.url !== undefined) redirectTo(message.url);
    void unmuteCurrentTab();
    sendResponse({ ok: true });
    return false;
  }

  if (message.action === "RECHECK_TAB") {
    debug("handling RECHECK_TAB");
    void recheckActiveTab()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error("RECHECK_TAB failed:", error);
        sendResponse({ ok: false, error: String(error) });
      });
    return true;
  }

  sendResponse({ ok: false, ignored: true });
  return false;
});

async function recheckActiveTab() {
  try {
    const tabId = await getActiveTabId();
    debug("recheckActiveTab", { tabId });
    if (!tabId) return;
    const tab = await browser.tabs.get(tabId);
    debug("recheck tab url", tab?.url);
    await startSession(await trackable(tab.url), false, tabId);
  } catch (e) { console.error("RECHECK_TAB failed:", e); }
}
