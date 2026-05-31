async function loadStats() {
  const all = await browser.storage.local.get();

  const statsContainer = document.getElementById("stats");

  statsContainer.innerHTML = "";

  for (const [domain, seconds] of Object.entries(all)) {

    // skip settings objects
    if (typeof seconds !== "number") continue;

    const div = document.createElement("div");

    div.innerHTML = `
      <strong>${domain}</strong>
      <p>${formatTime(seconds)}</p>
    `;

    statsContainer.appendChild(div);
  }
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${h}h ${m}m ${s}s`;
}

loadStats();