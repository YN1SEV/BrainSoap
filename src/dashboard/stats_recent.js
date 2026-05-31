const activities = [
    {
        domain: "youtube.com",
        action: "Video angesehen",
        duration: "12 min aktiv",
        time: "vor 1 min"
    },
    {
        domain: "github.com",
        action: "Repository geöffnet",
        duration: "7 min aktiv",
        time: "vor 5 min"
    },
    {
        domain: "openai.com",
        action: "Chat verwendet",
        duration: "22 min aktiv",
        time: "vor 9 min"
    },
    {
        domain: "reddit.com",
        action: "Beiträge gelesen",
        duration: "4 min aktiv",
        time: "vor 14 min"
    },
    {
        domain: "readoutto.me",
        action: "Serie angesehen",
        duration: "48 min aktiv",
        time: "vor 27 min"
    }
];

const container = document.getElementById("activity-list");

function getFavicon(domain) {return `https://icons.duckduckgo.com/ip3/${domain}.ico`;}

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

  const details = document.createElement("p");
    details.className = "details";
    details.textContent = `${item.action} · ${item.duration}`;

  const time = document.createElement("p");
    time.className = "time";
    time.textContent = item.time;

  content.append(domain, details);
  el.append(img, content, time);

  return el;
}

function renderActivities(list) {
    const fragment = document.createDocumentFragment();

    list.forEach(item => {fragment.appendChild(createActivityItem(item));});

    container.appendChild(fragment);
}

renderActivities(activities);