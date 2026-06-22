import { custom_storage } from "../../browser_handlers/storage_manager.js";

/**
 * Generiert die URL für das Favicon via DuckDuckGo
 */
function getFaviconUrl(url) {
  return `https://icons.duckduckgo.com/ip3/${url}.ico`;
}

/**
 * Erstellt ein einzelnes Activity-Element mittels modernem DOM-Parsing
 */
function createActivityItem(item) {
  const minutes = Math.round(item.durationSeconds / 60);
  const template = document.createElement('template');
  
  // HTML-Struktur als cleaner String (einfacher zu stylen und zu lesen)
  template.innerHTML = `
    <div class="activity-item">
      <img class="favicon" src="${getFaviconUrl(item.url)}" alt="${item.url}" />
      <h1 class="domain">${item.url}</h1>
      <p class="duration">${minutes} min aktiv</p>
    </div>
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