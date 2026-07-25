import { customStorage } from "../browser/storage.js";
import { toDateKey } from "../utils/time.js";
import { matchingCategories, remainingMinutes } from "./timer-service.js";
import { logDomainTime, logBlock } from "./stats-service.js";
import { redirectTo, sendMessage, showBlocker, showImage } from "../browser/actions.js";

export async function getBlacklist() {
  return (await customStorage.getSync('blacklist')) ?? [];
}

// start tracking a new domain, flushing whatever was being tracked before
export async function startSession(domain, isVisit = true) {
  await flushSession();
  await customStorage.setLocal('session', domain ? { domain, since: Date.now() } : null);
  await checkThresholds(isVisit);
}

// calculates time on session
export async function flushSession() {
  if (await customStorage.getLocal('paused')) return;

  const session = await customStorage.getLocal('session');
  if (!session?.domain) return;

  const delta = Math.floor((Date.now() - session.since) / 1000);
  if (delta > 0) {
    const focusMode = !!(await customStorage.getLocal('focusMode'));
    await logDomainTime(session.domain, delta, focusMode);
  }
  await customStorage.setLocal('session', { domain: session.domain, since: Date.now() });
}

// checks for exceeded time limits
export async function checkThresholds(isVisit) {
  if (await customStorage.getLocal('paused')) return;

  const session = await customStorage.getLocal('session');
  const domain = session?.domain;
  if (!domain) return;

  const cats = matchingCategories(await getBlacklist(), domain);
  if (!cats.length) return;

  const focusMode = !!(await customStorage.getLocal('focusMode'));
  const categoryLog = (await customStorage.getLocal('categoryLog')) ?? {};
  const allowNotify = (await customStorage.getSync('settings'))?.notificationsEnabled !== false;
  const today = toDateKey();

  for (const cat of cats) {
    const used = categoryLog[cat.timerName]?.date === today ? categoryLog[cat.timerName].usedSeconds : 0;
    if (!focusMode && used < cat.maxTime * 60) continue;
    triggerBlock(cat, focusMode, allowNotify);
    if (isVisit) await logBlock();
    if (focusMode) break;
  }
}

// do what is requested
function triggerBlock(cat, focusMode, allowNotify = true) {
  const actions = (cat.actions ?? ["popup"]);
  if (allowNotify && actions.includes("notify")) sendMessage("BrainSoap: Limit Reached", `Time's up on ${cat.timerName}!`, "limit-notify");

  const redirectUrl = actions.includes("redirect") ? cat.redirectUrl : null;

  if (actions.includes("image")) {
    showImage(cat.imagePath || "assets/visuals/Stopper_plain.svg", redirectUrl);
  } else if (actions.includes("popup")) {
    showBlocker(redirectUrl);
  } else if (redirectUrl) {
    redirectTo(redirectUrl);
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
