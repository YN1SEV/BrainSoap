const activities = [
  { domain: "youtube.com", duration: "12 min aktiv" },
  { domain: "github.com", duration: "7 min aktiv" },
  { domain: "openai.com", duration: "22 min aktiv" },
  { domain: "reddit.com", duration: "4 min aktiv" },
  { domain: "readoutto.me", duration: "48 min aktiv" }
];

const container = document.getElementById("activity-list");

function getFavicon(domain) {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

function getRelativeTime() {
  const now = Date.now();

  return (timestamp) => {
    const diffMin = Math.round((now - timestamp) / 60000);

    if (diffMin < 1) return "gerade eben";
    if (diffMin === 1) return "vor 1 min";
    return `vor ${diffMin} min`;
  };
}

const formatTime = getRelativeTime();

function createActivityItem(item) {
  const el = document.createElement("div");
    el.className = "activity-item";

  const img = document.createElement("img");
    img.className = "favicon";
    img.src = getFavicon(item.domain);
    img.alt = item.domain;

  const content = document.createElement("div");
    content.className = "content";

  const domain = document.createElement("h1");
    domain.className = "domain";
    domain.textContent = item.domain;

  const duration = document.createElement("p");
    duration.className = "duration";
    duration.textContent = item.duration;

  const time = document.createElement("p");
    time.className = "time";
    time.textContent = formatTime(Date.now());

  content.append(domain, duration);
  el.append(img, content, time);

  return el;
}

function renderActivities(list) {
  const fragment = document.createDocumentFragment();

    list.forEach(item => {fragment.appendChild(createActivityItem(item));});

  container.appendChild(fragment);
}

renderActivities(activities);