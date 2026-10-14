//timer map is slightly faster in background

import { ruleTarget } from "../utils/url.js";

export const LIMIT_RESET_MODES = Object.freeze({
  AFTER_BLOCK: "after-block",
  LOCAL_MIDNIGHT: "local-midnight",
});

export function normalizeLimitResetMode(mode) {
  return mode === LIMIT_RESET_MODES.AFTER_BLOCK
    ? LIMIT_RESET_MODES.AFTER_BLOCK
    : LIMIT_RESET_MODES.LOCAL_MIDNIGHT;
}

export function categoryUsedSeconds(categoryLog, timerName, dateKey) {
  const entry = categoryLog[timerName];
  return entry?.date === dateKey ? entry.usedSeconds : 0;
}

export function shouldResetAfterBlock(category, focusMode = false) {
  return !focusMode && normalizeLimitResetMode(category.resetMode) === LIMIT_RESET_MODES.AFTER_BLOCK;
}

export function resetCategoryUsage(categoryLog, timerName) {
  const nextLog = { ...categoryLog };
  delete nextLog[timerName];
  return nextLog;
}

export function buildTimerMap(blacklist = []) {
  const map = {};
  for (const category of blacklist) {
    for (const item of category.items ?? []) {
      const target = ruleTarget(item.url);
      if (item.active && target) (map[target] ??= []).push(category.timerName);
    }
  }
  return map;
}

export function categoriesForDomain(domain, timerMap = {}) {
  const haystack = (domain ?? "").toLowerCase();
  const names = new Set();
  for (const [url, categoryNames] of Object.entries(timerMap)) {
    if (haystack.includes(url)) categoryNames.forEach((name) => names.add(name));
  }
  return [...names];
}

export function matchingCategories(blacklist = [], domain) {
  if (!domain) return [];
  const haystack = domain.toLowerCase();
  return blacklist.filter((category) =>
    (category.items ?? []).some((item) => {
      const target = ruleTarget(item.url);
      return item.active && target && haystack.includes(target);
    })
  );
}

export function remainingMinutes(maxTimeMinutes, usedSeconds) {
  return Math.max(0, maxTimeMinutes - Math.floor(usedSeconds / 60));
}
