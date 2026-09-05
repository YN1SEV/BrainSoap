import { customStorage } from "../browser/storage.js";
import { toDateKey } from "../utils/time.js";
import { matchingCategories, remainingMinutes } from "./timer-service.js";
import { logDomainTime, logBlock } from "./stats-service.js";
import { redirectTo, sendMessage, showBlocker, showImage } from "../browser/actions.js";
import { debugLog } from "../utils/debug.js";

export async function getBlacklist() {
  return (await customStorage.getSync('blacklist')) ?? [];
}

// start tracking a new domain, flushing whatever was being tracked before
export async function startSession(domain, isVisit = true, tabId = null) {
  debugLog("start session", { domain, isVisit, tabId });
  await flushSession();
  await customStorage.setLocal('session', domain ? { domain, since: Date.now() } : null);
  await checkThresholds(isVisit, tabId);
}

// calculates time on session
export async function flushSession() {
  if (await customStorage.getLocal('paused')) return;

  const session = await customStorage.getLocal('session');
  if (!session?.domain) return;

  const delta = Math.floor((Date.now() - session.since) / 1000);
  debugLog("flush session", { domain: session.domain, delta });
  if (delta > 0) {
    const focusMode = !!(await customStorage.getLocal('focusMode'));
    await logDomainTime(session.domain, delta, focusMode);
  }
  await customStorage.setLocal('session', { domain: session.domain, since: Date.now() });
}

// checks for exceeded time limits
export async function checkThresholds(isVisit, tabId = null) {
  if (await customStorage.getLocal('paused')) return;

  const session = await customStorage.getLocal('session');
  const domain = session?.domain;
  if (!domain) return;

  const cats = matchingCategories(await getBlacklist(), domain);
  debugLog("threshold check", { domain, categories: cats.map((cat) => cat.timerName), isVisit });
  if (!cats.length) return;

  const focusMode = !!(await customStorage.getLocal('focusMode'));
  const categoryLog = (await customStorage.getLocal('categoryLog')) ?? {};
  const allowNotify = (await customStorage.getSync('settings'))?.notificationsEnabled !== false;
  const today = toDateKey();

  for (const cat of cats) {
    const used = categoryLog[cat.timerName]?.date === today ? categoryLog[cat.timerName].usedSeconds : 0;
    debugLog("category usage", { category: cat.timerName, used, limit: cat.maxTime * 60, focusMode });
    if (!focusMode && used < cat.maxTime * 60) continue;
    await triggerBlock(cat, focusMode, allowNotify, tabId);
    if (isVisit) await logBlock();
    if (focusMode) break;
  }
}

// do what is requested
async function triggerBlock(cat, focusMode, allowNotify = true, tabId = null) {
  const actions = (cat.actions ?? ["popup"]);
  if (allowNotify && actions.includes("notify")) {
    await sendMessage("BrainSoap: Limit Reached", `Time's up on ${cat.timerName}!`, "limit-notify");
  }

  const redirectUrl = actions.includes("redirect") ? cat.redirectUrl : null;

  if (actions.includes("image")) {
    await showImage(cat.imagePath || "assets/visuals/Stopper_plain.svg", redirectUrl, tabId);
  } else if (actions.includes("popup")) {
    await showBlocker(redirectUrl, tabId);
  } else if (redirectUrl) {
    await redirectTo(redirectUrl, tabId);
  }
  // notify-only: notification already sent above, nothing more to show
}

// calcs remaining time ("calc" is short for calculator)
export async function publishTimerState() {
  const blacklist   = await getBlacklist();
  const categoryLog = (await customStorage.getLocal('categoryLog')) ?? {};
  const today       = toDateKey();
  const timerState  = {};
  for (const cat of blacklist) {
    const usedSec = categoryLog[cat.timerName]?.date === today
      ? categoryLog[cat.timerName].usedSeconds
      : 0;
    timerState[cat.timerName] = { remaining: remainingMinutes(cat.maxTime, usedSec), maxTime: cat.maxTime };
  }
  await customStorage.setLocal('timerState', timerState);
}
