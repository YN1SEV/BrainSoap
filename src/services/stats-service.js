// needs rework 

import { customStorage } from "../browser/storage.js";
import { toDateKey, last7DateKeys, prev7DateKeys, calcStreak } from "../utils/time.js";
import { buildTimerMap, categoriesForDomain, matchingCategories, remainingMinutes, usedSecondsToday } from "./timer-service.js";
import { ruleTarget, domainOf } from "../utils/url.js";
import { defaultBlacklist } from "../utils/defaults.js";

const RECENT_RESUME_MS = 5 * 60 * 1000; // revisits within this window resume the same entry
const RECENT_MAX       = 30;

const getDayLog      = () => customStorage.getLocal("dayLog")      .then(v => v ?? {});
const getRecentVisits= () => customStorage.getLocal("recentVisits").then(v => v ?? []);
const getDomainLog   = () => customStorage.getLocal("domainLog")   .then(v => v ?? {});
const getCategoryLog = () => customStorage.getLocal("categoryLog").then(v => v ?? {});
const getActiveDates = () => customStorage.getLocal("activeDates").then(v => v ?? []);
const getBlacklist   = () => customStorage.getSyncFresh("blacklist", defaultBlacklist).then(v => Array.isArray(v) ? v : defaultBlacklist);
const getTopExcluded = () => customStorage.getLocal("topExcluded") .then(v => v ?? []);

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
  const [blacklist, dayLog, domainLog, categoryLog, recent] = await Promise.all([
    getBlacklist(),
    getDayLog(),
    getDomainLog(),
    getCategoryLog(),
    getRecentVisits()
  ]);

  const now = Date.now();

  const site = domainOf(domain) || domain;

  const previous = domainLog[site] ?? { totalSeconds: 0 };
  domainLog[site] = {
    totalSeconds: previous.totalSeconds + seconds,
    lastVisit: now
  };

  // resume latest entry if revisited within 5 min
  const latest = recent.find(v => v.url === site);
  if (latest && now - latest.lastVisit < RECENT_RESUME_MS) {
    recent.splice(recent.indexOf(latest), 1);
    recent.unshift({ url: site, durationSeconds: latest.durationSeconds + seconds, lastVisit: now });
  } else {
    recent.unshift({ url: site, durationSeconds: seconds, lastVisit: now });
  }
  recent.splice(RECENT_MAX);

  const writes = [
    customStorage.setLocal("domainLog", domainLog),
    customStorage.setLocal("recentVisits", recent),
  ];

  const categories = focusMode ? [] : categoriesForDomain(domain, buildTimerMap(blacklist));
  if (categories.length) {
    const day = dayLog[today] ?? emptyDay(); 
    day.scrollSeconds += seconds; 
    dayLog[today] = day;
    writes.push(customStorage.setLocal("dayLog", dayLog));

    for (const name of categories) {
      categoryLog[name] = { 
        usedSeconds: usedToday(categoryLog, name, today) + seconds, 
        date: today 
      };
    }
    writes.push(customStorage.setLocal("categoryLog", categoryLog));
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
  await customStorage.setLocal("dayLog", dayLog);
}

export async function logFocusSessionEnd() { await bumpToday(day => day.focusSessions++); }
export async function logBlock()           { await bumpToday(day => day.blockedCount++); }

// start counting focus time from now
export async function startFocusTracking() {
  await customStorage.setLocal("focusSince", Date.now());
}

export async function accrueFocusTime() {
  const since = await customStorage.getLocal("focusSince");
  if (!since) return;

  const delta = Math.floor((Date.now() - since) / 1000);
  if (delta > 0) await bumpToday(day => (day.focusSeconds += delta));

  const focusMode = await customStorage.getLocalFresh("focusMode");
  await customStorage.setLocal("focusSince", focusMode ? Date.now() : null);
}

// remember that the user showed up today
export async function logActiveDay() {
  const today = toDateKey(); 
  const dates = await getActiveDates();
  if (!dates.includes(today)) {
    const updatedDates = [...dates, today].sort();
    await customStorage.setLocal("activeDates", updatedDates);
  }
}

export async function shortestTimer(domain) {
  if (!domain) return null;

  const [blacklist, categoryLog] = await Promise.all([
    getBlacklist(),
    getCategoryLog()
  ]);
  const focusMode = !!(await customStorage.getLocalFresh("focusMode"));
  const session = await customStorage.getLocalFresh("session");
  const activeCategoryNames = new Set(session?.domain ? matchingCategories(blacklist, session.domain).map((category) => category.timerName) : []);

  const today = toDateKey();
  let bestTimer = null;

  for (const category of blacklist) {
    const categoryItems = category.items ?? [];
    const haystack = domain.toLowerCase();
    const isActive = categoryItems.some(item => {
      const target = ruleTarget(item.url);
      return item.active && target && haystack.includes(target);
    });
    
    if (!isActive) continue;

    if (focusMode) {
      return {
        remaining: 0,
        maxTime: category.maxTime,
        name: category.timerName,
      };
    }

    const timeUsedToday = usedSecondsToday(
      categoryLog,
      category.timerName,
      today,
      session,
      activeCategoryNames.has(category.timerName) ? session?.domain : null
    );
    const remaining = remainingMinutes(category.maxTime, timeUsedToday);
    
    if (!bestTimer || remaining < bestTimer.remaining) {
      bestTimer = { 
        remaining: remaining, 
        maxTime: category.maxTime, 
        name: category.timerName 
      };
    }   
  }

  if (focusMode) {
    return {
      remaining: 0,
      maxTime: 0,
      name: domain,
    };
  }

  return bestTimer;
}

export async function computeAndSaveStats() {
  const [dayLog, domainLog, activeDates, blacklist, topExcluded] = await Promise.all([
    getDayLog(),
    getDomainLog(),
    getActiveDates(),
    getBlacklist(),
    getTopExcluded(),
  ]);

  const sum = f => Object.values(dayLog).reduce((t, d) => t + (d[f] ?? 0), 0);

  const streak = calcStreak(activeDates);
  const days = last7DateKeys();
  const prevDays = prev7DateKeys();

  // week-over-week change
  const weekSum = (keys, field) => keys.reduce((t, d) => t + (dayLog[d]?.[field] ?? 0), 0);
  const weekDelta = (field) => {
    const current = weekSum(days, field);
    const previous = weekSum(prevDays, field);
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  };

  const allBlockedItems = blacklist.flatMap(category => category.items ?? []);
  const uniqueUrls = new Set(allBlockedItems.map(item => item.url));

  const usageStats = {
    focusHours:    +(sum("focusSeconds")  / 3600).toFixed(1),
    focusSessions:  sum("focusSessions"),
    scrollHours:   +(sum("scrollSeconds") / 3600).toFixed(1),
    scrollAttempts: sum("blockedCount"),
    currentStreak: streak.current, bestStreak: streak.best,
    blockedSites:  allBlockedItems.length,
    activeDays:    activeDates.length,
    chart: {
      focus:  days.map(d => +((dayLog[d]?.focusSeconds  ?? 0) / 3600).toFixed(2)),
      scroll: days.map(d => +((dayLog[d]?.scrollSeconds ?? 0) / 3600).toFixed(2)),
    },
    weekDelta: {
      focus:  weekDelta("focusSeconds"),
      scroll: weekDelta("scrollSeconds"),
    },
  };

  const trackedDomains = Object.entries(domainLog)
    .filter(([url]) => url.includes("."))
    .map(([url, data]) => ({ 
      url: url, 
      durationSeconds: data.totalSeconds, 
      lastVisit: data.lastVisit ?? 0 
    }));

  const inRules = domain => [...uniqueUrls].some(url => url && domain.includes(url));
  const topSites = trackedDomains
    .filter(d => !inRules(d.url) && !topExcluded.includes(d.url))
    .sort((a, b) => b.durationSeconds - a.durationSeconds)
    .slice(0, 10);

  // Save all processed stats
  await Promise.all([
    customStorage.setLocal("usageStats", usageStats),
    customStorage.setLocal("topSites", topSites)
  ]);

  return usageStats;
}

// blacklist domain from "Most time spent on" only
export async function excludeFromTopSites(url) {
  const topExcluded = await getTopExcluded();

  if (topExcluded.includes(url)) return;

  await customStorage.setLocal("topExcluded", [...topExcluded, url]);
  await computeAndSaveStats();
}
