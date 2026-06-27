import { custom_storage } from "../../../browser/storage.js";
import { escapeHtml } from "../../../utils/sanitize.js";

/**
 * Generiert die URL für das Favicon via DuckDuckGo
 */
function getFaviconUrl(domain) {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

/**
 * Erstellt ein einzelnes Activity-Element mittels modernem DOM-Parsing
 */
function createActivityItem(item) {
  const minutes = Math.round(item.durationSeconds / 60);
  const url = escapeHtml(item.url);
  const template = document.createElement('template');

  template.innerHTML = `
    <li class="activity-item">
      <img class="favicon" src="${getFaviconUrl(item.url)}" alt="" />
      <span class="domain">${url}</span>
      <span class="duration">${minutes} min</span>
    </li>
  `.trim();

  return template.content.firstChild;
}

/**
 * Holt die Daten und rendert die exakt 10 letzten Aktivitäten
 */
async function renderActivities() {
  const recentStats = await custom_storage.getLocal('recentStats');

  if (!recentStats || !Array.isArray(recentStats)) {
    console.warn('No valid recent stats found in storage');
    container.innerHTML = `<li class="activity-empty">No activity tracked yet.</li>`;
    return;
  }

  const container = document.getElementById("activity-list");
  if (!container) return;

  // 1. Container leeren (falls vorher schon mal gerendert wurde)
  container.innerHTML = "";

  // 2. Fragment erstellen, um DOM-Operationen zu bündeln (Performance)
  const fragment = document.createDocumentFragment();

  // 3. Nur die ersten 10 Elemente verarbeiten (.slice ist hier super)
  recentStats.slice(0, 10).forEach(item => {
    fragment.appendChild(createActivityItem(item));
  });

  // 4. Alles auf einmal ins DOM jagen
  container.appendChild(fragment);
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', async () => {
  await renderActivities();

  // Intervall für automatische Updates alle 10 Sekunden
  setInterval(async () => {
    console.log("Updating Activities...");
    await renderActivities();
  }, 10000);
});
