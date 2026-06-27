import { custom_storage } from "../../browser_handlers/storage_manager.js";
import { computeAndSaveStats } from "../../services/stats-service.js";

// --- Hilfsfunktionen für bessere Lesbarkeit und Struktur ---

/**
 * Holt die Wochentage rotiert basierend auf dem aktuellen Tag, sodass heute ganz rechts steht.
 */
function getRotatedWeekLabels() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayIndex = new Date().getDay();
  return [
    ...days.slice(todayIndex + 1),
    ...days.slice(0, todayIndex + 1),
  ];
}

/**
 * Aktualisiert Textinhalte im DOM basierend auf einer ID-Mapping-Tabelle.
 */
function updateDOMText(mapping) {
  for (const [elementId, value] of Object.entries(mapping)) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }
}

/**
 * Setzt die Prozentabweichungen (Deltas) im Dashboard.
 */
function setWeekDeltas(focusPercent, scrollPercent) {
  const focusEl = document.getElementById('focus-delta');
  const scrollEl = document.getElementById('scroll-delta');

  if (focusEl) focusEl.textContent = `${focusPercent > 0 ? '+' : ''}${focusPercent}% this week`;
  if (scrollEl) scrollEl.textContent = `${scrollPercent > 0 ? '+' : ''}${scrollPercent}% this week`;
}

/**
 * Aktualisiert oder erstellt das ChartJS-Liniendiagramm.
 */
function renderChart(canvasElement, focusData, scrollData) {
  const existingChart = Chart.getChart(canvasElement);

  // Performance-Optimierung: Wenn das Chart existiert, updaten wir nur die Daten statt es neu zu erstellen
  if (existingChart) {
    existingChart.data.labels = getRotatedWeekLabels();
    existingChart.data.datasets[0].data = focusData;
    existingChart.data.datasets[1].data = scrollData;
    existingChart.update('none'); // 'none' verhindert unruhige Animationen beim Auto-Refresh
    return;
  }

  // Initiales Rendern
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

// --- Hauptfunktion ---

async function renderStats() {
  await computeAndSaveStats();
  const stats = await custom_storage.getLocal('usageStats');
  if (!stats) {
    console.warn('No usageStats found in storage');
    return;
  }

  // 1. All-Time Stats im DOM verteilen
  updateDOMText({
    "focus-hours": stats.focusHours ?? 0,
    "focus-sessions": stats.focusSessions ?? 0,
    "scroll-hours": stats.scrollHours ?? 0,
    "scroll-attempts": stats.scrollAttempts ?? 0,
    "scrolls-blocked": stats.currentStreak ?? 0,
    "best-streak": stats.bestStreak ?? 0,
    "sites-blocked": stats.blockedSites ?? 0,
    "active-days": stats.activeDays ?? 0
  });

  // 2. Wochendaten verarbeiten
  const focusChartData = stats.chart?.focus || [];
  const scrollChartData = stats.chart?.scroll || [];

  const totalFocus = focusChartData.reduce((a, b) => a + b, 0);
  const totalScroll = scrollChartData.reduce((a, b) => a + b, 0);

  // Wöchentliche Zusammenfassung eintragen
  const summaryElements = document.querySelectorAll(".week-summary .stat-value");
  if (summaryElements?.length >= 2) {
    summaryElements[0].textContent = `${totalFocus.toFixed(1)} h`;
    summaryElements[1].textContent = `${totalScroll.toFixed(1)} h`;
  }

  // 3. Chart rendern oder aktualisieren
  const canvasElement = document.querySelector("#week-canvas");
  if (canvasElement) {
    renderChart(canvasElement, focusChartData, scrollChartData);
  }

  // 4. Deltas setzen
  setWeekDeltas(-15, 20);
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', async () => {
  await renderStats();

  // Intervall für automatische Updates alle 10 Sekunden
  setInterval(async () => {
    console.log("Updating Stats...");
    await renderStats();
  }, 10000);
});