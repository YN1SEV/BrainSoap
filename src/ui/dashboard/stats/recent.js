import { custom_storage } from "../../../browser/storage.js";
import { escapeHtml } from "../../../utils/sanitize.js";
import { getRefreshMs } from "../../../utils/settings.js";
import { formatUsage } from "../../../utils/time.js";
import { faviconUrl, domainOf } from "../../../utils/url.js";

let lastActivityKeys = [];

function createActivityItem(item) {
  const label = domainOf(item.url) || item.url;
  const time = item.lastVisit
    ? new Date(item.lastVisit).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const li = document.createElement("li");
  li.className = "activity-item";

  const img = document.createElement("img");
  img.className = "favicon";
  img.src = faviconUrl(item.url);
  img.alt = "";

  const domainSpan = document.createElement("span");
  domainSpan.className = "domain";
  domainSpan.textContent = label;

  const metaSpan = document.createElement("span");
  metaSpan.className = "meta";

  const durationSpan = document.createElement("span");
  durationSpan.className = "duration";
  durationSpan.textContent = formatUsage(item.durationSeconds);

  const timestampSpan = document.createElement("span");
  timestampSpan.className = "timestamp";
  timestampSpan.textContent = time;

  metaSpan.append(durationSpan, timestampSpan);
  li.append(img, domainSpan, metaSpan);

  return li;
}

async function renderActivities() {
  const container = document.getElementById("activity-list");
  if (!container) return;

  const recent = await getRecentItems();

  if (!recent || recent.length === 0) {
    lastActivityKeys = [];
    container.replaceChildren();

    const emptyLi = document.createElement("li");
    emptyLi.className = "activity-empty";
    emptyLi.textContent = "No activity tracked yet.";
    container.appendChild(emptyLi);
    return;
  }

  const keys = recent.map((item) => `${item.url}|${item.lastVisit}`);
  const sameOrder =
    keys.length === lastActivityKeys.length &&
    keys.every((k, i) => k === lastActivityKeys[i]);

  if (sameOrder) {
    container.querySelectorAll(".activity-item .duration").forEach((el, i) => {
      if (recent[i]) {
        el.textContent = formatUsage(recent[i].durationSeconds);
      }
    });
    return;
  }

  lastActivityKeys = keys;

  // Clear existing items safely and append nodes
  container.replaceChildren(...recent.map(createActivityItem));
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderActivities();

  // refresh on the configured interval
  setInterval(async () => {
    console.log("Updating Activities...");
    await renderActivities();
  }, await getRefreshMs());
});
