// needs rework 

import { custom_storage } from "../browser/storage.js";
import { toDateKey, last7DateKeys, calcStreak } from "../utils/time.js";
import { buildTimerMap, categoriesForDomain, remainingMinutes } from "./timer-service.js";

const getDayLog      = () => custom_storage.getLocal("dayLog")     .then(v => v ?? {});
const getDomainLog   = () => custom_storage.getLocal("domainLog")  .then(v => v ?? {});
const getCategoryLog = () => custom_storage.getLocal("categoryLog").then(v => v ?? {});
const getActiveDates = () => custom_storage.getLocal("activeDates").then(v => v ?? []);
const getBlacklist   = () => custom_storage.getSync("blacklist")   .then(v => v ?? []);

const emptyDay       = () => ({ 
  focusSeconds: 0, 
  scrollSeconds: 0, 
  focusSessions: 0, 
  blockedCount: 0 
});

const usedToday = (log, name, today) => {
  return log[name]?.date === today ? log[name].usedSeconds : 0;
};

// core stats logging
export async function logDomainTime(domain, seconds, focusMode = false) {
  if (!domain || seconds <= 0) return;

  const today = toDateKey();
  const [blacklist, dayLog, domainLog, categoryLog] = await Promise.all([
    getBlacklist(), 
    getDayLog(), 
    getDomainLog(), 
    getCategoryLog()
  ]);

  const previous = domainLog[domain] ?? { totalSeconds: 0 };
  domainLog[domain] = { 
    totalSeconds: previous.totalSeconds + seconds, 
    lastVisit: Date.now() 
  };

  const writes = [custom_storage.setLocal("domainLog", domainLog)];

  const categories = focusMode ? [] : categoriesForDomain(domain, buildTimerMap(blacklist));
  if (categories.length) {
    const day = dayLog[today] ?? emptyDay(); 
    day.scrollSeconds += seconds; 
    dayLog[today] = day;
    writes.push(custom_storage.setLocal("dayLog", dayLog));

    for (const name of categories) {
      categoryLog[name] = { 
        usedSeconds: usedToday(categoryLog, name, today) + seconds, 
        date: today 
      };
    }
    writes.push(custom_storage.setLocal("categoryLog", categoryLog));
  }
  
  await Promise.all(writes);
}

// tweak todays entry and save it back
async function bumpToday(mutate) {
  const today = toDateKey();
  const dayLog = await getDayLog();
  const day = dayLog[today] ?? emptyDay();
  mutate(day);
  dayLog[today] = day;
  await custom_storage.setLocal("dayLog", dayLog);
}

export async function logFocusMinute()     { await bumpToday(day => (day.focusSeconds += 60)); }
export async function logFocusSessionEnd() { await bumpToday(day => day.focusSessions++); }
export async function logBlock()           { await bumpToday(day => day.blockedCount++); }

// remember that the user showed up today
export async function logActiveDay() {
  const today = toDateKey(); 
  const dates = await getActiveDates();
  if (!dates.includes(today)) {
    const updatedDates = [...dates, today].sort();
    await custom_storage.setLocal("activeDates", updatedDates);
  }
}

export async function shortestTimer(domain) {
  if (!domain) return null;

  const [blacklist, categoryLog] = await Promise.all([
    getBlacklist(),
    getCategoryLog()
  ]);

  const today = toDateKey();
  let bestTimer = null;

  for (const category of blacklist) {
    const categoryItems = category.items ?? [];
    const isActive = categoryItems.some(item => item.active && domain.includes(item.url));
    
    if (!isActive) continue;

    const timeUsedToday = usedToday(categoryLog, category.timerName, today);
    const remaining = remainingMinutes(category.maxTime, timeUsedToday);
    
    if (!bestTimer || remaining < bestTimer.remaining) {
      bestTimer = { 
        remaining: remaining, 
        maxTime: category.maxTime, 
        name: category.timerName 
      };
    }   
  }

  return bestTimer;
}

export async function computeAndSaveStats() {
  const [dayLog, domainLog, activeDates, blacklist, installDate] = await Promise.all([
    getDayLog(), 
    getDomainLog(), 
    getActiveDates(), 
    getBlacklist(),
    custom_storage.getLocal("installDate"),
  ]);

  const sum = f => Object.values(dayLog).reduce((t, d) => t + (d[f] ?? 0), 0);

  const streak = calcStreak(activeDates);
  const days = last7DateKeys();

  const allBlockedItems = blacklist.flatMap(category => category.items ?? []);
  const uniqueUrls = new Set(allBlockedItems.map(item => item.url));

  let totalActiveDays = activeDates.length;
  if (installDate) {
    const msSinceInstall = Date.now() - new Date(installDate);
    totalActiveDays = Math.floor(msSinceInstall / 86400000) + 1; // 86400000ms = 1 day
  }

  const usageStats = {
    focusHours:    +(sum("focusSeconds")  / 3600).toFixed(1),
    focusSessions:  sum("focusSessions"),
    scrollHours:   +(sum("scrollSeconds") / 3600).toFixed(1),
    scrollAttempts: sum("blockedCount"),
    currentStreak: streak.current, bestStreak: streak.best,
    blockedSites:  uniqueUrls.size,
    activeDays:    totalActiveDays,
    chart: {
      focus:  days.map(d => +((dayLog[d]?.focusSeconds  ?? 0) / 3600).toFixed(2)),
      scroll: days.map(d => +((dayLog[d]?.scrollSeconds ?? 0) / 3600).toFixed(2)),
    },
  };

  const trackedDomains = Object.entries(domainLog)
    .filter(([url]) => url.includes("."))
    .map(([url, data]) => ({ 
      url: url, 
      durationSeconds: data.totalSeconds, 
      lastVisit: data.lastVisit ?? 0 
    }));

  const recentStats = [...trackedDomains]
    .sort((a, b) => b.lastVisit - a.lastVisit)
    .slice(0, 10);

  const topSites = [...trackedDomains]
    .sort((a, b) => b.durationSeconds - a.durationSeconds)
    .slice(0, 10);

  // Save all processed stats
  await Promise.all([
    custom_storage.setLocal("usageStats", usageStats),
    custom_storage.setLocal("recentStats", recentStats),
    custom_storage.setLocal("topSites", topSites)
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
