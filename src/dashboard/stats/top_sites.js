import { custom_storage } from "../../browser_handlers/storage_manager.js";
import { formatDuration } from "../../utils/time.js";
import { computeAndSaveStats, removeDomain } from "../../services/stats-service.js";

const getFaviconUrl = (domain) => `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;

async function copyToClipboard(text) {
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; } } catch {}
  const ta = document.createElement("textarea");
  ta.value = text; Object.assign(ta.style, { position: "fixed", opacity: "0" });
  document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch { ok = false; }
  ta.remove(); return ok;
}

function createRow(item) {
  const row = document.createElement("li"); row.className = "top-site";
  const favicon = document.createElement("img"); favicon.className = "favicon"; favicon.src = getFaviconUrl(item.url); favicon.alt = "";
  const domain = document.createElement("span"); domain.className = "domain"; domain.textContent = item.url;
  const duration = document.createElement("span"); duration.className = "duration"; duration.textContent = formatDuration(item.durationSeconds);
  const add = document.createElement("button"); add.className = "top-add"; add.textContent = "+"; add.dataset.url = item.url; add.setAttribute("aria-label", `Copy ${item.url} and open Rules`);
  const remove = document.createElement("button"); remove.className = "top-remove"; remove.textContent = "✕"; remove.dataset.url = item.url; remove.setAttribute("aria-label", `Remove ${item.url} from this statistic`);
  row.append(favicon, domain, duration, add, remove); return row;
}

async function renderTopSites() {
  const container = document.getElementById("top-sites-list");
  if (!container) return;
  const topSites = await custom_storage.getLocal("topSites");
  if (!Array.isArray(topSites) || topSites.length === 0) { container.innerHTML = `<li class="top-empty">No data yet.</li>`; return; }
  const fragment = document.createDocumentFragment();
  topSites.forEach(item => fragment.appendChild(createRow(item)));
  container.innerHTML = ""; container.appendChild(fragment);
}

function setupActions() {
  const container = document.getElementById("top-sites-list");
  if (!container) return;
  container.addEventListener("click", async (e) => {
    const url = e.target.dataset?.url; if (!url) return;
    if (e.target.matches(".top-add")) { await copyToClipboard(url); window.location.hash = "rules"; }
    else if (e.target.matches(".top-remove")) { await removeDomain(url); await renderTopSites(); }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await computeAndSaveStats(); await renderTopSites(); setupActions(); setInterval(renderTopSites, 10000);
});
