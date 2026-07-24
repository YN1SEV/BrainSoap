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

const trackable = async (url) => (
  isTrackableUrl(url) ? getCleanedIdentifier(url, await getBlacklist()) : null
);


// catch silent fail
globalThis.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
});


// initialization
browser.runtime.onInstalled.addListener(async (details) => {
  await customStorage.resetSettings(defaultSettings);
  if (details.reason === "install") {
    await customStorage.setSync('blacklist', defaultBlacklist);
    await customStorage.setLocal('installDate', toDateKey());
  }
  await customStorage.clearLocalStorage();
});

browser.runtime.onStartup.addListener(async () => {
  await customStorage.checkSettingsExists(defaultSettings);
  await customStorage.clearLocalStorage();
});

// refreshes every minute, needs to be revised
browser.alarms.create("tick", { periodInMinutes: 1 });
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "tick") return;
  try {
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
    await startSession(await trackable(tab.url));
  } catch (e) { console.error("onActivated failed:", e); }
});

// track url switching within tab
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) await startSession(await trackable(tab.url));
}, { properties: ["url"] });

// content script confirms the blocker was dismissed
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "BLOCKER_CONFIRMED") {
    if (message.url !== undefined) redirectTo(message.url);
    unmuteCurrentTab();
  }
  // focus mode was just turned on
  if (message.action === "RECHECK_TAB") {
    recheckActiveTab();
  }
});

async function recheckActiveTab() {
  try {
    const tabId = await getActiveTabId();
    if (!tabId) return;
    const tab = await browser.tabs.get(tabId);
    await startSession(await trackable(tab.url), false);
  } catch (e) { console.error("RECHECK_TAB failed:", e); }
}
