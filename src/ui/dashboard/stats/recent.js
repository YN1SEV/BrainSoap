import { custom_storage } from "../../../browser/storage.js";
import { escapeHtml } from "../../../utils/sanitize.js";
import { getRefreshMs } from "../../../utils/settings.js";
import { formatUsage } from "../../../utils/time.js";
import { faviconUrl, domainOf } from "../../../utils/url.js";

function createActivityItem(item) {
  const label = escapeHtml(domainOf(item.url) || item.url);
  const time = item.lastVisit
    ? new Date(item.lastVisit).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return `
    <li class="activity-item">
      <img class="favicon" src="${faviconUrl(item.url)}" alt="" />
      <span class="domain">${label}</span>
      <span class="meta">
        <span class="duration">${formatUsage(item.durationSeconds)}</span>
        <span class="timestamp">${time}</span>
      </span>
    </li>
  `;
}

async function getRecentItems() {
  const recentVisits = await custom_storage.getLocal('recentVisits');
  if (!Array.isArray(recentVisits)) return [];
  return [...recentVisits].sort((a, b) => b.lastVisit - a.lastVisit).slice(0, 10);
}

async function renderActivities() {
  const container = document.getElementById("activity-list");
  if (!container) return;

  const recent = await getRecentItems();

  if (recent.length === 0) {
    container.innerHTML = `<li class="activity-empty">No activity tracked yet.</li>`;
    return;
  }

  container.innerHTML = recent.map(createActivityItem).join("");
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderActivities();

  // refresh on the configured interval
  setInterval(async () => {
    console.log("Updating Activities...");
    await renderActivities();
  }, await getRefreshMs());
});
