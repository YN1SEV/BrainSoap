import { custom_storage } from "../../../browser/storage.js";
import { escapeHtml } from "../../../utils/sanitize.js";

function getFaviconUrl(domain) {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

function createActivityItem(item) {
  const minutes = Math.round(item.durationSeconds / 60);
  const url = escapeHtml(item.url);

  return `
    <li class="activity-item">
      <img class="favicon" src="${getFaviconUrl(item.url)}" alt="" />
      <span class="domain">${url}</span>
      <span class="duration">${minutes} min</span>
    </li>
  `;
}

async function renderActivities() {
  const container = document.getElementById("activity-list");
  if (!container) return;

  const recentStats = await custom_storage.getLocal('recentStats');

  if (!recentStats || !Array.isArray(recentStats)) {
    console.warn('No valid recent stats found in storage');
    container.innerHTML = `<li class="activity-empty">No activity tracked yet.</li>`;
    return;
  }

  container.innerHTML = recentStats.slice(0, 10).map(createActivityItem).join("");
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderActivities();

  // refresh every 10 seconds
  setInterval(async () => {
    console.log("Updating Activities...");
    await renderActivities();
  }, 10000);
});
