import { custom_storage } from "../browser_handlers/storage_manager.js";
import { toDateKey, last7DateKeys, calcStreak } from "../utils/time.js";
import { buildTimerMap, categoriesForDomain, remainingMinutes } from "./timer-service.js";

const getDayLog      = () => custom_storage.getLocal("dayLog").then(v => v ?? {});
const getDomainLog   = () => custom_storage.getLocal("domainLog").then(v => v ?? {});
const getCategoryLog = () => custom_storage.getLocal("categoryLog").then(v => v ?? {});
const getActiveDates = () => custom_storage.getLocal("activeDates").then(v => v ?? []);
const getBlacklist   = () => custom_storage.getSync("blacklist").then(v => v ?? []);
const emptyDay = () => ({ focusSeconds: 0, scrollSeconds: 0, focusSessions: 0, blockedCount: 0 });
const usedToday = (log, name, today) => log[name]?.date === today ? log[name].usedSeconds : 0;

export async function logDomainTime(domain, seconds, focusMode = false) {
  if (!domain || seconds <= 0) return;
  const today = toDateKey();
  const [blacklist, dayLog, domainLog, categoryLog] = await Promise.all([getBlacklist(), getDayLog(), getDomainLog(), getCategoryLog()]);
  const previous = domainLog[domain] ?? { totalSeconds: 0 };
  domainLog[domain] = { totalSeconds: previous.totalSeconds + seconds, lastVisit: Date.now() };
  const writes = [custom_storage.setLocal("domainLog", domainLog)];
  const categories = focusMode ? [] : categoriesForDomain(domain, buildTimerMap(blacklist));
  if (categories.length) {
    const day = dayLog[today] ?? emptyDay(); day.scrollSeconds += seconds; dayLog[today] = day;
    writes.push(custom_storage.setLocal("dayLog", dayLog));
    for (const name of categories) categoryLog[name] = { usedSeconds: usedToday(categoryLog, name, today) + seconds, date: today };
    writes.push(custom_storage.setLocal("categoryLog", categoryLog));
  }
  await Promise.all(writes);
}

export async function logFocusMinute()     { await bumpToday(day => (day.focusSeconds += 60)); }
export async function logFocusSessionEnd() { await bumpToday(day => day.focusSessions++); }
export async function logBlock()           { await bumpToday(day => day.blockedCount++); }

async function bumpToday(mutate) {
  const today = toDateKey(); const dayLog = await getDayLog();
  const day = dayLog[today] ?? emptyDay(); mutate(day); dayLog[today] = day;
  await custom_storage.setLocal("dayLog", dayLog);
}

export async function logActiveDay() {
  const today = toDateKey(); const dates = await getActiveDates();
  if (!dates.includes(today)) await custom_storage.setLocal("activeDates", [...dates, today].sort());
}

export async function shortestTimer(domain) {
  if (!domain) return null;
  const [blacklist, categoryLog] = await Promise.all([getBlacklist(), getCategoryLog()]);
  const today = toDateKey(); let best = null;
  for (const category of blacklist) {
    const isActive = (category.items ?? []).some(item => item.active && domain.includes(item.url));
    if (!isActive) continue;
    const remaining = remainingMinutes(category.maxTime, usedToday(categoryLog, category.timerName, today));
    if (!best || remaining < best.remaining) best = { remaining, maxTime: category.maxTime, name: category.timerName };
  }
  return best;
}

export async function computeAndSaveStats() {
  const [dayLog, domainLog, activeDates, blacklist, installDate] = await Promise.all([
    getDayLog(), getDomainLog(), getActiveDates(), getBlacklist(),
    custom_storage.getLocal("installDate"),
  ]);
  const sum = f => Object.values(dayLog).reduce((t, d) => t + (d[f] ?? 0), 0);
  const streak = calcStreak(activeDates); const days = last7DateKeys();
  const uniqueUrls = new Set(blacklist.flatMap(c => (c.items ?? []).map(i => i.url)));
  const usageStats = {
    focusHours:    +(sum("focusSeconds")  / 3600).toFixed(1),
    focusSessions:  sum("focusSessions"),
    scrollHours:   +(sum("scrollSeconds") / 3600).toFixed(1),
    scrollAttempts: sum("blockedCount"),
    currentStreak: streak.current, bestStreak: streak.best,
    blockedSites:  uniqueUrls.size,
    activeDays: installDate ? Math.floor((Date.now() - new Date(installDate)) / 86400000) + 1 : activeDates.length,
    chart: {
      focus:  days.map(d => +((dayLog[d]?.focusSeconds  ?? 0) / 3600).toFixed(2)),
      scroll: days.map(d => +((dayLog[d]?.scrollSeconds ?? 0) / 3600).toFixed(2)),
    },
  };
  const tracked = Object.entries(domainLog).filter(([u]) => u.includes("."));
  await Promise.all([
    custom_storage.setLocal("usageStats", usageStats),
    custom_storage.setLocal("recentStats", tracked.map(([u,v]) => ({ url: u, durationSeconds: v.totalSeconds, lastVisit: v.lastVisit ?? 0 })).sort((a, b) => b.lastVisit - a.lastVisit).slice(0, 10)),
    custom_storage.setLocal("topSites", tracked.map(([u,v]) => ({ url: u, durationSeconds: v.totalSeconds })).sort((a, b) => b.durationSeconds - a.durationSeconds).slice(0, 10)),
  ]);
  return usageStats;
}

export async function removeDomain(url) {
  const domainLog = await getDomainLog();
  if (!(url in domainLog)) return;
  delete domainLog[url];
  await custom_storage.setLocal("domainLog", domainLog);
  await computeAndSaveStats();
}
