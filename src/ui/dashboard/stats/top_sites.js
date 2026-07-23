import { custom_storage } from "../../../browser/storage.js";
import { formatUsage } from "../../../utils/time.js";
import { escapeHtml } from "../../../utils/sanitize.js";
import { computeAndSaveStats, excludeFromTopSites } from "../../../services/stats-service.js";
import { getRefreshMs } from "../../../utils/settings.js";
import { faviconUrl, domainOf } from "../../../utils/url.js";

// copy text with textarea fallback for old browsers
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  const ta = document.createElement("textarea");
  ta.value = text;
  Object.assign(ta.style, { position: "fixed", opacity: "0" });
  document.body.appendChild(ta);
  ta.select();

  let ok = false;
  
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }

  ta.remove();
  return ok;
}

let lastTopSiteUrls = [];

function createRow(item) {
  const displayLabel = domainOf(item.url) || item.url;

  const li = document.createElement("li");
  li.className = "top-site";

  const img = document.createElement("img");
  img.className = "favicon";
  img.src = faviconUrl(item.url);
  img.alt = "";

  const domainSpan = document.createElement("span");
  domainSpan.className = "domain";
  domainSpan.textContent = displayLabel;

  const durationSpan = document.createElement("span");
  durationSpan.className = "duration";
  durationSpan.textContent = formatUsage(item.durationSeconds);

  // Add button
  const addButton = document.createElement("button");
  addButton.className = "top-add";
  addButton.dataset.url = item.url;
  addButton.setAttribute("aria-label", `Copy ${item.url} and open Rules`);
  addButton.textContent = "+";

  // Remove button
  const removeButton = document.createElement("button");
  removeButton.className = "top-remove";
  removeButton.dataset.url = item.url;
  removeButton.setAttribute("aria-label", `Remove ${item.url} from this statistic`);
  removeButton.textContent = "✕";

  li.append(img, domainSpan, durationSpan, addButton, removeButton);

  return li;
}

async function renderTopSites() {
  const container = document.getElementById("top-sites-list");
  if (!container) return;

  const topSites = await custom_storage.getLocal("topSites");

  if (!Array.isArray(topSites) || topSites.length === 0) {
    lastTopSiteUrls = [];
    container.replaceChildren();

    const emptyLi = document.createElement("li");
    emptyLi.className = "top-empty";
    emptyLi.textContent = "No data yet.";
    container.appendChild(emptyLi);
    return;
  }

  const urls = topSites.map((item) => item.url);
  const sameOrder =
    urls.length === lastTopSiteUrls.length &&
    urls.every((u, i) => u === lastTopSiteUrls[i]);

  if (sameOrder) {
    container.querySelectorAll(".top-site .duration").forEach((el, i) => {
      if (topSites[i]) {
        el.textContent = formatUsage(topSites[i].durationSeconds);
      }
    });
    return;
  }

  lastTopSiteUrls = urls;

  // Modern, linter-safe replacement of all children
  container.replaceChildren(...topSites.map(createRow));
}

// wires up the + copy and x remove buttons
function setupActions() {
  const container = document.getElementById("top-sites-list");
  
  if (!container) return;

  container.addEventListener("click", async (e) => {
    const url = e.target.dataset?.url;
    
    if (!url) return;

    if (e.target.matches(".top-add")) {
      await copyToClipboard(url);
      window.location.hash = "rules";

      const toast = document.getElementById("copy-toast");
      toast?.togglePopover(true);
      setTimeout(() => toast?.togglePopover(false), 2000);
    } else if (e.target.matches(".top-remove")) {
      await excludeFromTopSites(url);
      await renderTopSites();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await computeAndSaveStats();
  await renderTopSites();
  setupActions();
  setInterval(renderTopSites, await getRefreshMs());
});