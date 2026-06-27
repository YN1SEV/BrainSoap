import { custom_storage } from "../browser_handlers/storage_manager.js";
import { defaultSettings, defaultBlacklist } from "../utils/defaults.js";
import { getCleanedIdentifier, isTrackableUrl } from "../utils/utils.js";
import { unmuteCurrentTab } from "../browser_handlers/tab_handler.js";
import { redirectTo, sendMessage, showBlocker, showImage } from "../browser_handlers/actions_handler.js";
import { matchingCategories, remainingMinutes } from "../services/timer-service.js";
import { logDomainTime, logFocusMinute, logBlock, logActiveDay, computeAndSaveStats } from "../services/stats-service.js";

// =================================================
// EVENT LISTENERS - maybe make they'r own file?
// =================================================
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
});

globalThis.browser ??= globalThis.chrome;

const today = () => new Date().toISOString().slice(0, 10);
const trackable = (url) => (isTrackableUrl(url) ? getCleanedIdentifier(url) : null);

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

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await browser.tabs.get(tabId);
    await startSession(trackable(tab.url));
  } catch (e) { console.error("onActivated failed:", e); }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) await startSession(trackable(tab.url));
}, { properties: ["url"] });

browser.idle.onStateChanged.addListener(async (state) => {
  if (state === "active") {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    await startSession(trackable(tab?.url));
  } else {
    await flushSession();
    await custom_storage.setLocal('session', null);
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "BLOCKER_CONFIRMED") {
    if(message.url !== undefined)redirectTo(message.url);
    unmuteCurrentTab();
  }
});

async function startSession(domain) {
  await flushSession();
  await custom_storage.setLocal('session', domain ? { domain, since: Date.now() } : null);
  await checkThresholds(true);
}

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

function triggerBlock(cat, focusMode) {
  const actions = focusMode ? ["popup"] : (cat.actions ?? ["popup"]);
  if (actions.includes("notify")) sendMessage("BrainSoap: Limit Reached", `Time's up on ${cat.timerName}!`, "limit-notify");
  if (actions.includes("image")) 
  {
    showImage(cat.imagePath);
  }
  if (actions.includes("popup") && actions.includes("redirect")) {
    showBlocker(cat.redirectUrl);
  } else if (actions.includes("popup"))  {
    showBlocker();
  } else if (actions.includes("redirect")) {
    redirectTo(cat.redirectUrl);
  }
}

async function publishTimerState() {
  const blacklist = await getBlacklist();
  const categoryLog = (await custom_storage.getLocal('categoryLog')) ?? {};
  const t = today();
  const state = {};
  for (const cat of blacklist) {
    const used = categoryLog[cat.timerName]?.date === t ? categoryLog[cat.timerName].usedSeconds : 0;
    state[cat.timerName] = { remaining: remainingMinutes(cat.maxTime, used), maxTime: cat.maxTime };
  }
  await custom_storage.setLocal('timerState', state);
}