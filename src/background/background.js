import { customStorage } from "../browser/storage.js";
import { defaultSettings, defaultBlacklist } from "../utils/defaults.js";
import { getCleanedIdentifier, isTrackableUrl } from "../utils/url.js";
import { toDateKey } from "../utils/time.js";
import { getActiveTabId } from "../browser/tabs.js";
import { redirectTo } from "../browser/actions.js";
import { logActiveDay, accrueFocusTime, computeAndSaveStats } from "../services/stats-service.js";
import { startSession, flushSession, checkThresholds, publishTimerState, getBlacklist } from "../services/session-service.js";
import { debugLog, debugError } from "../utils/debug.js";

// cross-browser compatibility
globalThis.browser ??= globalThis.chrome;
debugLog("background loaded");

let trackingQueue = Promise.resolve();

function queueTracking(task) {
  const next = trackingQueue.then(task, task);
  trackingQueue = next.catch(() => {});
  return next;
}

function scheduleTrackingAlarm() {
  return browser.alarms.create("tick", { periodInMinutes: 1 });
}

const trackable = async (url) => (
  isTrackableUrl(url) ? getCleanedIdentifier(url, await getBlacklist()) : null
);


// catch silent fail
globalThis.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
});


// initialization
browser.runtime.onInstalled.addListener(async (details) => {
  await scheduleTrackingAlarm();
  await customStorage.resetSettings(defaultSettings);
  if (details.reason === "install") {
    await customStorage.setSync('blacklist', defaultBlacklist);
    await customStorage.setLocal('installDate', toDateKey());
  }
  await customStorage.clearLocalStorage();
});

browser.runtime.onStartup.addListener(async () => {
  await scheduleTrackingAlarm();
  await customStorage.checkSettingsExists(defaultSettings);
  await migrateMobileRules();
  await customStorage.clearLocalStorage();
});

async function migrateMobileRules() {
  const blacklist = await customStorage.getSync('blacklist');
  if (!Array.isArray(blacklist)) return;

  let changed = false;
  for (const category of blacklist) {
    for (const item of category.items ?? []) {
      if (item.name === 'YouTube' && item.url === 'youtube.com') {
        item.url = 'm.youtube.com';
        changed = true;
      }
    }
  }

  if (changed) await customStorage.setSync('blacklist', blacklist);
}

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "tick") return;
  debugLog("alarm", { name: alarm.name });
  return queueTracking(async () => {
    try {
      if (await customStorage.getLocal('paused')) return;
      await flushSession();
      await accrueFocusTime();
      await logActiveDay();
      await checkThresholds(false);
      await publishTimerState();
      await computeAndSaveStats();
    } catch (e) { debugError("tick failed", e); }
  });
});

// track tab switching
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  return queueTracking(async () => {
    try {
      const tab = await browser.tabs.get(tabId);
      debugLog("tab activated", { tabId, url: tab.url });
      await startSession(await trackable(tab.url), true, tabId);
    } catch (e) { debugError("onActivated failed", e, { tabId }); }
  });
});

// track url switching within tab
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    debugLog("tab URL changed", { tabId, url: tab.url });
    return queueTracking(async () => {
      await startSession(await trackable(tab.url), true, tabId);
    });
  }
});

// content script confirms the blocker was dismissed
browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === "BLOCKER_CONFIRMED") {
    if (message.url !== undefined) await redirectTo(message.url);
    return;
  }
  // focus mode was just turned on
  if (message.action === "RECHECK_TAB") {
    return queueTracking(recheckActiveTab);
  }
});

async function recheckActiveTab() {
  try {
    const tabId = await getActiveTabId();
    if (!tabId) return;
    const tab = await browser.tabs.get(tabId);
    debugLog("focus recheck", { tabId, url: tab.url });
    await startSession(await trackable(tab.url), false);
  } catch (e) { debugError("RECHECK_TAB failed", e); }
}
