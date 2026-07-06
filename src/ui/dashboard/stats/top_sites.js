import { custom_storage } from "../../../browser/storage.js";
import { formatDuration } from "../../../utils/time.js";
import { escapeHtml } from "../../../utils/sanitize.js";
import { computeAndSaveStats, excludeFromTopSites } from "../../../services/stats-service.js";

const getFaviconUrl = (domain) => `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;

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

function createRow(item) {
  const url = escapeHtml(item.url);

  return `
    <li class="top-site">
      <img class="favicon" src="${getFaviconUrl(item.url)}" alt="" />
      <span class="domain">${url}</span>
      <span class="duration">${formatDuration(item.durationSeconds)}</span>
      <button class="top-add" data-url="${url}" aria-label="Copy ${url} and open Rules">+</button>
      <button class="top-remove" data-url="${url}" aria-label="Remove ${url} from this statistic">✕</button>
    </li>
  `;
}

async function renderTopSites() {
  const container = document.getElementById("top-sites-list");
  
  if (!container) return;
  
  const topSites = await custom_storage.getLocal("topSites");

  if (!Array.isArray(topSites) || topSites.length === 0) {
    container.innerHTML = `<li class="top-empty">No data yet.</li>`;
    return;
  }

  container.innerHTML = topSites.map(createRow).join("");
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
  setInterval(renderTopSites, 10000);
});