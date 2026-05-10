let currentDomain = null;
let startTime = Date.now();

// Helper: Get domain from URL
const getDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
};

// 1. Setup the Heartbeat (Every 1 minute)
browser.alarms.create("checkLimit", { periodInMinutes: 1 });

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "checkLimit") {
    await updateTime(); 
    await checkThresholds();
  }
});

// 2. The Logic to save time
async function updateTime() {
  if (!currentDomain) return;

  const now = Date.now();
  const delta = Math.floor((now - startTime) / 1000);
  
  // Storage usage with Promises
  const data = await browser.storage.local.get(currentDomain);
  const total = (data[currentDomain] || 0) + delta;

  await browser.storage.local.set({ [currentDomain]: total });
  startTime = now; 
}

// 3. The "At that moment" check
async function checkThresholds() {
  if (!currentDomain) return;

  const data = await browser.storage.local.get([currentDomain, "limit"]);
  const timeSpent = data[currentDomain] || 0;
  const limit = data.limit || 1800; // Default 30 mins

  if (timeSpent >= limit) {
    browser.notifications.create({
      "type": "basic",
      "iconUrl": browser.runtime.getURL("icon.png"),
      "title": "Limit Reached",
      "message": `Time's up on ${currentDomain}!`
    });
  }
}

// 4. Handle State Changes (Idle/Active)
browser.idle.onStateChanged.addListener(async (state) => {
  if (state === "active") {
    startTime = Date.now();
  } else {
    await updateTime();
    currentDomain = null;
  }
});

// 5. Track Tab Switching
browser.tabs.onActivated.addListener(async (activeInfo) => {
  await updateTime();
  const tab = await browser.tabs.get(activeInfo.tabId);
  currentDomain = getDomain(tab.url);
});