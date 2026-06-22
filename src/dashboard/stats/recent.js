

function getFavicon(url) {
  return `https://icons.duckduckgo.com/ip3/${url}.ico`;
}

function createActivityItem(item) {
  const el = document.createElement("div");
  el.cla  ssName = "activity-item";

  const img = document.createElement("img");
    img.className = "favicon";
    img.src = getFavicon(item.url);
    img.alt = item.url;

  const domain = document.createElement("h1");
    domain.className = "domain";
    domain.textContent = item.url;

  const duration = document.createElement("p");
    duration.className = "duration";
    const minutes = Math.round(item.durationSeconds / 60);
    duration.textContent = `${minutes} min aktiv`;
    el.append(img, url, duration);

  return el;
}

function renderActivities(list) {
  const container = document.getElementById("activity-list");
  if (!container) return;

  list.forEach(item => {
    fragment.appendChild(createActivityItem(item));
  });

  container.appendChild(fragment);
}

document.addEventListener("DOMContentLoaded", () => {
  renderActivities(sampleRecentStats);
});