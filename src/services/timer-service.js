
export function buildTimerMap(blacklist = []) {
  const map = {};
  for (const category of blacklist) {
    for (const item of category.items ?? []) {
      if (item.active) (map[item.url] ??= []).push(category.timerName);
    }
  }
  return map;
}

export function categoriesForDomain(domain, timerMap = {}) {
  const names = new Set();
  for (const [url, categoryNames] of Object.entries(timerMap)) {
    if (domain.includes(url)) categoryNames.forEach((name) => names.add(name));
  }
  return [...names];
}

export function matchingCategories(blacklist = [], domain) {
  if (!domain) return [];
  return blacklist.filter((category) =>
    (category.items ?? []).some((item) => item.active && domain.includes(item.url))
  );
}

export function remainingMinutes(maxTimeMinutes, usedSeconds) {
  return Math.max(0, maxTimeMinutes - Math.floor(usedSeconds / 60));
}
