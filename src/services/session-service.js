import { customStorage } from "../browser/storage.js";
import { toDateKey } from "../utils/time.js";
import { matchingCategories, remainingMinutes, usedSecondsToday } from "./timer-service.js";
import { logDomainTime, logBlock } from "./stats-service.js";
import { redirectTo, sendMessage, showBlocker, showImage } from "../browser/actions.js";
import { defaultBlacklist } from "../utils/defaults.js";

const debug = (...args) => console.log("[BrainSoap session]", ...args);

export async function getBlacklist() {
  const blacklist = await customStorage.getSyncFresh('blacklist', defaultBlacklist);
  return Array.isArray(blacklist) ? blacklist : defaultBlacklist;
}

// start tracking a new domain, flushing whatever was being tracked before
export async function startSession(domain, isVisit = true, tabId = null) {
  debug("startSession", { domain, isVisit, tabId });
  await flushSession();
  await customStorage.setLocal('session', domain ? { domain, since: Date.now(), tabId } : null);
  await checkThresholds(isVisit);
}

// calculates time on session
export async function flushSession() {
  if (await customStorage.getLocalFresh('paused')) return;

  const session = await customStorage.getLocalFresh('session');
  if (!session?.domain) return;

  const delta = Math.floor((Date.now() - session.since) / 1000);
  if (delta > 0) {
    const focusMode = !!(await customStorage.getLocalFresh('focusMode'));
    await logDomainTime(session.domain, delta, focusMode);
  }
  await customStorage.setLocal('session', { domain: session.domain, since: Date.now() });
}

// checks for exceeded time limits
export async function checkThresholds(isVisit) {
  if (await customStorage.getLocalFresh('paused')) return;

  const session = await customStorage.getLocalFresh('session');
  const domain = session?.domain;
  if (!domain) return;
  const tabId = session?.tabId ?? null;

  const cats = matchingCategories(await getBlacklist(), domain);
  debug("checkThresholds", { domain, isVisit, tabId, focusMode: !!(await customStorage.getLocalFresh('focusMode')), matches: cats.map((cat) => cat.timerName) });

  const focusMode = !!(await customStorage.getLocalFresh('focusMode'));
  const categoryLog = (await customStorage.getLocalFresh('categoryLog')) ?? {};
  const allowNotify = (await customStorage.getSyncFresh('settings'))?.notificationsEnabled !== false;
  const today = toDateKey();

  if (!cats.length) {
    if (!focusMode) return;

    debug("focus fallback block for unmatched domain", domain);
    await triggerBlock({ timerName: domain, actions: ["popup"], maxTime: 0 }, true, allowNotify, tabId);
    if (isVisit) await logBlock();
    return;
  }

  for (const cat of cats) {
    const used = usedSecondsToday(categoryLog, cat.timerName, today, session, domain);
    debug("category check", { category: cat.timerName, used, maxTime: cat.maxTime, focusMode, tabId });
    if (!focusMode && used < cat.maxTime * 60) continue;
    await triggerBlock(cat, focusMode, allowNotify, tabId);
    if (isVisit) await logBlock();
    if (focusMode) break;
  }
}

// do what is requested
async function triggerBlock(cat, focusMode, allowNotify = true, tabId = null) {
  const actions = (cat.actions ?? ["popup"]);
  debug("triggerBlock", { category: cat.timerName, focusMode, actions, allowNotify, tabId });
  if (allowNotify && actions.includes("notify")) sendMessage("BrainSoap: Limit Reached", `Time's up on ${cat.timerName}!`, "limit-notify");

  const redirectUrl = actions.includes("redirect") ? cat.redirectUrl : null;

  if (actions.includes("image")) {
    await showImage(cat.imagePath || "assets/visuals/Stopper_plain.svg", redirectUrl, tabId);
  } else if (actions.includes("popup")) {
    await showBlocker(redirectUrl, tabId);
  } else if (redirectUrl) {
    await redirectTo(redirectUrl);
  }
  // notify-only: notification already sent above, nothing more to show
}

// calcs remaining time ("calc" is short for calculator)
export async function publishTimerState() {
  const blacklist   = await getBlacklist();
  const categoryLog = (await customStorage.getLocalFresh('categoryLog')) ?? {};
  const session     = await customStorage.getLocalFresh('session');
  const focusMode   = !!(await customStorage.getLocalFresh('focusMode'));
  const today       = toDateKey();
  const timerState  = {};
  for (const cat of blacklist) {
    const usedSec = focusMode ? cat.maxTime * 60 : usedSecondsToday(categoryLog, cat.timerName, today, session, session?.domain);
    timerState[cat.timerName] = { remaining: remainingMinutes(cat.maxTime, usedSec), maxTime: cat.maxTime };
  }
  debug("publishTimerState", { focusMode, categories: Object.keys(timerState), session: session?.domain });
  await customStorage.setLocal('timerState', timerState);
}
