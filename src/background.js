let currentDomain = null;
let startTime = Date.now();


const checkIfTracked = async (url) => {
  const trackedUrls = await getSetting("urls");
  return trackedUrls.some(trackedUrl => url.startsWith(trackedUrl));
}

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
  const data = await getVariable(currentDomain);
  const total = (data || 0) + delta;

  await saveVariable(currentDomain, total);

  startTime = now; 
}

// 3. The "At that moment" check
async function checkThresholds() {
  if (!currentDomain) return;
  if (!checkIfTracked(currentDomain)) return;

  const data = await getVariable(currentDomain);
  const timeSpent = data[currentDomain] || 0;
  const limit = await getSetting("limit") 

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
  currentDomain = getCleanedIdentifier(tab.url);
});


// save default settings to synced storage on first install 
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") 
    {
      await saveSetting("limit", defaultSettings.limit);
      console.log("Default settings initialized.");
    }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // changeInfo.url will only be present if the URL actually changed
    if (changeInfo.url) {
      console.log("URL changed to:", tab.url);
      try {
        currentDomain = getCleanedIdentifier(tab.url);
        console.log("Current domain ID set to:", currentDomain);
        await updateTime();
        
      } catch (e) {
        console.error(e);
        
      }
    }
  },{properties: ["url"]});