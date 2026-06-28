import { custom_storage } from "../browser/storage.js";
import { defaultSettings, defaultBlacklist } from "../utils/defaults.js";
import { getCleanedIdentifier, isTrackableUrl } from "../utils/url.js";
import { unmuteCurrentTab } from "../browser/tabs.js";
import { redirectTo, sendMessage, showBlocker, showImage } from "../browser/actions.js";
import { matchingCategories, remainingMinutes } from "../services/timer-service.js";
import { logDomainTime, logFocusMinute, logBlock, logActiveDay, computeAndSaveStats } from "../services/stats-service.js";

// cross-browser compatibility
globalThis.browser ??= globalThis.chrome;

const today = () => new Date().toISOString().slice(0, 10);
const trackable = (url) => (isTrackableUrl(url) ? getCleanedIdentifier(url) : null);


// catch silent fail
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
});


// initialization
browser.runtime.onInstalled.addListener(async (details) => {
  await custom_storage.resetSettings(defaultSettings);
  if (details.reason === "install") {
    await custom_storage.setSync('blacklist', defaultBlacklist);
    await custom_storage.setLocal('installDate', today());
  }
  await custom_storage.clearLocalStorage();
});

browser.runtime.onStartup.addListener(async () => {
  await custom_storage.checkSettingsExists(defaultSettings);
  await custom_storage.clearLocalStorage();
});

// refreshes every minute, needs to be revised
browser.alarms.create("tick", { periodInMinutes: 1 });
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "tick") return;
  try {
    if (await custom_storage.getLocal('paused')) return;
    await flushSession();
    if (await custom_storage.getLocal('focusMode')) await logFocusMinute();
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
    await startSession(trackable(tab.url));
  } catch (e) { console.error("onActivated failed:", e); }
});

// track url switching within tab
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) await startSession(trackable(tab.url));
}, { properties: ["url"] });

// track idling
browser.idle.onStateChanged.addListener(async (state) => {
  if (state === "active") {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    await startSession(trackable(tab?.url));
  } else {
    await flushSession();
    await custom_storage.setLocal('session', null);
  }
});

// content script confirms the blocker was dismissed
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "BLOCKER_CONFIRMED") {
    if (message.url !== undefined) redirectTo(message.url);
    unmuteCurrentTab();
  }
});

async function startSession(domain) {
  await flushSession();
  await custom_storage.setLocal('session', domain ? { domain, since: Date.now() } : null);
  await checkThresholds(true);
}

// calculates time on session
async function flushSession() {
  if (await custom_storage.getLocal('paused')) return;
  
  const session = await custom_storage.getLocal('session');
  if (!session?.domain) return;
  
  const delta = Math.floor((Date.now() - session.since) / 1000);
  if (delta > 0) {
    const focusMode = !!(await custom_storage.getLocal('focusMode'));
    await logDomainTime(session.domain, delta, focusMode);
  }
  await custom_storage.setLocal('session', { domain: session.domain, since: Date.now() });
}

async function getBlacklist() {
  return (await custom_storage.getSync('blacklist')) ?? [];
}

// checks for exceeded time limits
async function checkThresholds(isVisit) {
  const session = await custom_storage.getLocal('session');
  const domain = session?.domain;
  if (!domain) return;
  
  const cats = matchingCategories(await getBlacklist(), domain);
  if (!cats.length) return;
  
  const focusMode = !!(await custom_storage.getLocal('focusMode'));
  const categoryLog = (await custom_storage.getLocal('categoryLog')) ?? {};
  const t = today();
  
  for (const cat of cats) {
    const used = categoryLog[cat.timerName]?.date === t ? categoryLog[cat.timerName].usedSeconds : 0;
    if (!focusMode && used < cat.maxTime * 60) continue;
    triggerBlock(cat, focusMode);
    if (isVisit) await logBlock();
    if (focusMode) break;
  }
}

// do what is requested
function triggerBlock(cat, focusMode) {
  const actions = focusMode ? ["popup"] : (cat.actions ?? ["popup"]);
  if (actions.includes("notify")) sendMessage("BrainSoap: Limit Reached", `Time's up on ${cat.timerName}!`, "limit-notify");
  if (actions.includes("image"))  showImage(cat.imagePath);
  
  const hasPopup    = actions.includes("popup")
  const hasRedirect = actions.includes("redirect")

  if (hasRedirect && hasPopup) showBlocker(cat.redirectUrl);
  else if (hasPopup)           showBlocker();
  else if (hasRedirect)        redirectTo(cat.redirectUrl);
}

// calcs remaining time ("calc" is short for calculator)
async function publishTimerState() {
  const blacklist   = await getBlacklist();
  const categoryLog = (await custom_storage.getLocal('categoryLog')) ?? {};
  const tday        = today();
  const timerState  = {};
  for (const cat of blacklist) {
    const usedSec = categoryLog[cat.timerName]?.date === tday
      ? categoryLog[cat.timerName].usedSeconds
      : 0;
    timerState[cat.timerName] = { remaining: remainingMinutes(cat.maxTime, usedSec), maxTime: cat.maxTime };
  }
  await custom_storage.setLocal('timerState', timerState);
}