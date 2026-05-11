let currentDomain = null;
let startTime = Date.now();

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
});

const checkIfTracked = async (url) => {
  if (!url) return false;
  const trackedUrls = await getSetting("urls");
  return trackedUrls.some(trackedUrl => url.includes(trackedUrl));
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

  const timeSpent = await getVariable(currentDomain) || 0;
  //const timeSpent = data[currentDomain] || 0;
  const limit = await getSetting("limit") 

  if (timeSpent >= limit) {
    console.log(`Limit reached for ${currentDomain}: ${timeSpent} seconds`);
    browser.notifications.create("limit-notify", {
      "type": "basic",
      "iconUrl": browser.runtime.getURL("icons/icon128.png"),
      "title": "BrainSoap: Limit Reached",
      "message": `You've used up your time on ${currentDomain}. Move along!`,
      
      // This is the key property for persistence
      "requireInteraction": true, 
      
      // Optional: Adds a button for better UX
      "buttons": [
        { "title": "Close Tab" },
        { "title": "Give me 5 more minutes" }
      ]
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

// on install, set default settings 
browser.runtime.onInstalled.addListener(async (details) => {
  await clearLocalStorage(); 
  if (details.reason === "install") 
    {
      await saveSetting("limit", defaultSettings.limit);
      console.log("Default settings initialized.");
    }
});

// Listen for URL changes in the active tab
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // changeInfo.url will only be present if the URL actually changed
    if (changeInfo.url) {
      console.log("URL changed to:", tab.url);
      try {
        currentDomain = getCleanedIdentifier(tab.url);
        console.log("Current domain ID set to:", currentDomain);
        await updateTime();
        await checkThresholds();
      } catch (e) {
        console.error(e);
        
      }
    }
  },{properties: ["url"]});

// listenfer for browser startupo
browser.runtime.onStartup.addListener(async () => {
    console.log("Browser started, checking settings...");
    await checkSettingsExists();
    await clearLocalStorage(); 

  });