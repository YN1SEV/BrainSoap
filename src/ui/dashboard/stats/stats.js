import { customStorage } from "../../../browser/storage.js";
import { computeAndSaveStats } from "../../../services/stats-service.js";
import { getRefreshMs } from "../../../services/settings-service.js";


// weekday names in order ending on today
function getRotatedWeekLabels() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayIndex = new Date().getDay();
  return [
    ...days.slice(todayIndex + 1),
    ...days.slice(0, todayIndex + 1),
  ];
}

function updateDOMText(mapping) {
  for (const [elementId, value] of Object.entries(mapping)) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }
}

function formatWeekDelta(percent) {
  if (percent === null || percent === undefined) return "N/A";
  return `${percent > 0 ? '+' : ''}${percent}% this week`;
}

function setWeekDeltas(focusPercent, scrollPercent) {
  const focusEl = document.getElementById('focus-delta');
  const scrollEl = document.getElementById('scroll-delta');

  if (focusEl) focusEl.textContent = formatWeekDelta(focusPercent);
  if (scrollEl) scrollEl.textContent = formatWeekDelta(scrollPercent);
}

function describeChart(canvasElement, focusData, scrollData) {
  const labels = getRotatedWeekLabels();
  const perDay = labels
    .map((day, i) => `${day}: ${(focusData[i] ?? 0).toFixed(1)} h focus, ${(scrollData[i] ?? 0).toFixed(1)} h scroll`)
    .join('; ');

  canvasElement.setAttribute(
    'aria-label',
    `Line chart of focus and scroll hours over the last 7 days. ${perDay}.`
  );
}

// draw the weekly line chart or update it if it already exists
function renderChart(canvasElement, focusData, scrollData) {
  describeChart(canvasElement, focusData, scrollData);

  const existingChart = Chart.getChart(canvasElement);

  if (existingChart) {
    existingChart.data.labels = getRotatedWeekLabels();
    existingChart.data.datasets[0].data = focusData;
    existingChart.data.datasets[1].data = scrollData;
    existingChart.update('none'); 
    return;
  }

  new Chart(canvasElement, {
    type: "line",
    data: {
      labels: getRotatedWeekLabels(),
      datasets: [
        { label: "Focus-Time", data: focusData, borderColor: "#2563eb", fill: false },
        { label: "Scroll-Time", data: scrollData, borderColor: "#ef4444", fill: false },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });
}

async function renderStats() {
  const computedStats = await computeAndSaveStats();
  const storedStats = await customStorage.getLocal('usageStats');
  const stats = storedStats ?? computedStats;
  if (!stats) {
    console.warn('No usageStats found in storage');
    return;
  }

  const focusChartData = stats.chart?.focus || [];
  const scrollChartData = stats.chart?.scroll || [];
  const sumHours = (hours) => hours.reduce((total, value) => total + value, 0);

  updateDOMText({
    "focus-hours": stats.focusHours ?? 0,
    "focus-sessions": stats.focusSessions ?? 0,
    "scroll-hours": stats.scrollHours ?? 0,
    "scroll-attempts": stats.scrollAttempts ?? 0,
    "scrolls-blocked": stats.currentStreak ?? 0,
    "best-streak": stats.bestStreak ?? 0,
    "sites-blocked": stats.blockedSites ?? 0,
    "active-days": stats.activeDays ?? 0,
    "week-focus-total": `${sumHours(focusChartData).toFixed(1)} h`,
    "week-scroll-total": `${sumHours(scrollChartData).toFixed(1)} h`
  });

  const canvasElement = document.getElementById("week-canvas");
  if (canvasElement) {
    renderChart(canvasElement, focusChartData, scrollChartData);
  }

  setWeekDeltas(stats.weekDelta?.focus ?? null, stats.weekDelta?.scroll ?? null);
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderStats();
  setInterval(async () => {
    await renderStats();
  }, await getRefreshMs());
});
