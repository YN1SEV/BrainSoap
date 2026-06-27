export function toDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function last7DateKeys(today = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6 + i);
    return toDateKey(d);
  });
}

export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function calcStreak(activeDates) {
  if (!activeDates.length) return { current: 0, best: 0 };

  const sorted = [...activeDates].sort();
  let best = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const isConsecutive = (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000 === 1;
    run = isConsecutive ? run + 1 : 1;
    if (run > best) best = run;
  }

  const daysSinceLast = (Date.now() - new Date(sorted.at(-1))) / 86400000;
  return { current: daysSinceLast < 2 ? run : 0, best };
}
