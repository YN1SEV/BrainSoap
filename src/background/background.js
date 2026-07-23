import { custom_storage } from "../browser/storage.js";
import { defaultSettings, defaultBlacklist } from "../utils/defaults.js";
import { getCleanedIdentifier, isTrackableUrl } from "../utils/url.js";
import { unmuteCurrentTab, getActiveTabId } from "../browser/tabs.js";
import { redirectTo, sendMessage, showBlocker, showImage } from "../browser/actions.js";
import { matchingCategories, remainingMinutes } from "../services/timer-service.js";
import { logDomainTime, accrueFocusTime, logBlock, logActiveDay, computeAndSaveStats } from "../services/stats-service.js";

// cross-browser compatibility
globalThis.browser ??= globalThis.chrome;

const today = () => new Date().toISOString().slice(0, 10);
const trackable = async (url) => (
  isTrackableUrl(url) ? getCleanedIdentifier(url, await getBlacklist()) : null
);


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
    if(message.url !== undefined){
      console.log(`redirecting to ${message.url}`)
      redirectTo(message.url); 
    }
    unmuteCurrentTab();
    storage.saveVariable(BlockedDomain, 0) // reset currently blocked domain
    console.log(`${BlockedDomain} timer reset to 0`)
  }
});

// =================================================
// FUNCTIONS
// =================================================
const checkIfTracked = async (url) => {
  if (!url) return false;
  const timerMap = await storage.getSetting("timerMap");
  const trackedUrls = Object.keys(timerMap);
  console.log(`Checking if ${url} is tracked among:`, trackedUrls);
  return trackedUrls.some(trackedUrl => url.includes(trackedUrl));
}

// save logic
async function updateTime() {
  if (!currentDomain) return;

  const now = Date.now();
  const delta = Math.floor((now - startTime) / 1000);
  
  // Storage usage with Promises
  const data = await storage.getVariable(currentDomain);
  const total = (data || 0) + delta;

  await storage.saveVariable(currentDomain, total);

  startTime = now; 
}

// checks for exceeded time limits
async function checkThresholds(isVisit) {
  if (await custom_storage.getLocal('paused')) return;

  const timeSpent = await storage.getVariable(currentDomain);
  console.log(`Time spent on ${currentDomain}: ${timeSpent} seconds`);

  const timerMap = await storage.getSetting("timerMap");
  const timersList = await storage.getSetting("timers");
  const activeTimerKeys = timerMap[currentDomain] || ["default"];

  // performe actions
  for (const t of activeTimerKeys) {
    const timerObject = timersList[t];
    
    if (!timerObject) continue;

    const limit = timerObject.limit;
    
    if (timeSpent >= limit) 
    {
      // dont need to wait on result
      actionOnLimit(timeSpent, timerObject);
    }
  }
}

// do what is requested
function triggerBlock(cat, focusMode, allowNotify = true) {
  console.log("blocking now")
  console.log(cat)
  const actions = (cat.actions ?? ["popup"]);
  if (allowNotify && actions.includes("notify")) sendMessage("BrainSoap: Limit Reached", `Time's up on ${cat.timerName}!`, "limit-notify");
  
  const hasPopup    = actions.includes("popup");
  const hasRedirect = actions.includes("redirect");
  const hasImage = actions.includes("image");
  
  if (actions.includes("notify")) {
    sendMessage("BrainSoap: Limit Reached", `Time's up on ${currentDomain}!`, "limit-notify");
  }

  if (hasImage)
  {
    showImage(timerObject.imagePath);
  }
  
  if (hasPopup && hasRedirect) {
    showBlocker(timerObject.redirectUrl); 
  } else if (hasPopup) {
    showBlocker();
  } else if (hasRedirect) {
    redirectTo(timerObject.redirectUrl);
  }
  
  BlockedDomain = currentDomain;
  //reset current domain
  storage.saveVariable(currentDomain,0);
  return;
}