const activities = [
  { domain: "youtube.com", duration: "12 min aktiv" },
  { domain: "github.com", duration: "7 min aktiv" },
  { domain: "openai.com", duration: "22 min aktiv" },
  { domain: "reddit.com", duration: "4 min aktiv" },
  { domain: "readoutto.me", duration: "48 min aktiv" },
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

function createActivityItem(item) {
  const el = document.createElement("div");
  el.className = "activity-item";

  const img = document.createElement("img");
  img.className = "favicon";
  img.src = getFavicon(item.domain);
  img.alt = item.domain;

  const domain = document.createElement("h1");
  domain.className = "domain";
  domain.textContent = item.domain;

  const duration = document.createElement("p");
  duration.className = "duration";
  duration.textContent = item.duration;

  el.append(img, domain, duration);

  return el;
}

function renderActivities(list) {
  const fragment = document.createDocumentFragment();

  list.forEach(item => {
    fragment.appendChild(createActivityItem(item));
  });

  container.appendChild(fragment);
}

renderActivities(activities);
