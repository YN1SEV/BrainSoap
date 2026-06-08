// =================================================
// VARIABLES
// =================================================
let currentDomain = null;
let BlockedDomain = null;
let startTime = Date.now();

// =================================================
// EVENT LISTENERS - maybe make they'r own file?
// =================================================
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
});

// 1. Setup the Heartbeat (Every 1 minute)
browser.alarms.create("checkLimit", { periodInMinutes: 1 });
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "checkLimit") {
    await updateTime(); 
    await checkThresholds();
  }
});

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
  console.log(`Tab ${activeInfo.tabId} activated. Current domain: ${currentDomain}`);
});

// on install, set default settings 
browser.runtime.onInstalled.addListener(async (details) => {
  await storage.clearLocalStorage(); 
  await storage.resetSettings(); // TODO: delete later, dont overwrite user settings on update
  if (details.reason === "install") 
    {
      await storage.resetSettings();
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
    await storage.checkSettingsExists();
    await storage.clearLocalStorage(); 

});

// can listen to all messages, add more if blocks/switch
browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "BLOCKER_CONFIRMED") {
    if(message.url !== undefined){
      console.log(`redirecting to ${message.url}`)
      redirectTo(message.url); 
    }
    unmuteCurrentTab();
    storage.saveVariable(BlockedDomain, 0) // reset currently blocked domain
    console.log(`${BlockedDomain} timer reset to 0`)
  }
});

// =================================================
// FUNCTIONS
// =================================================
const checkIfTracked = async (url) => {
  if (!url) return false;
  const timerMap = await storage.getSetting("timerMap");
  const trackedUrls = Object.keys(timerMap);
  console.log(`Checking if ${url} is tracked among:`, trackedUrls);
  return trackedUrls.some(trackedUrl => url.includes(trackedUrl));
}

// save logic
async function updateTime() {
  if (!currentDomain) return;

  const now = Date.now();
  const delta = Math.floor((now - startTime) / 1000);
  
  // Storage usage with Promises
  const data = await storage.getVariable(currentDomain);
  const total = (data || 0) + delta;

  await storage.saveVariable(currentDomain, total);

  startTime = now; 
}

// check current time spent
async function checkThresholds() {
  if (!currentDomain) return;
  if (!await checkIfTracked(currentDomain)) return;

  const timeSpent = await storage.getVariable(currentDomain);
  console.log(`Time spent on ${currentDomain}: ${timeSpent} seconds`);

  const timerMap = await storage.getSetting("timerMap");
  const timersList = await storage.getSetting("timers");
  const activeTimerKeys = timerMap[currentDomain] || ["default"];

  // performe actions
  for (const t of activeTimerKeys) {
    const timerObject = timersList[t];
    
    if (!timerObject) continue;

    const limit = timerObject.limit;
    
    if (timeSpent >= limit) 
    {
      // dont need to wait on result
      actionOnLimit(timeSpent, timerObject);
    }
  }
}

// action depending on settings
async function actionOnLimit(time, timerObject)
{  
  console.log(`Limit reached for ${currentDomain}: ${time} seconds out of ${timerObject.limit} allowed.`);
  
  const actions = timerObject.actions;

  const hasPopup = actions.includes("popup");
  const hasRedirect = actions.includes("redirect");
  const hasImage = actions.includes("image");
  
  if (actions.includes("notify")) {
    sendMessage("BrainSoap: Limit Reached", `Time's up on ${currentDomain}!`, "limit-notify");
  }

  if (hasImage)
  {
    showImage(timerObject.imagePath);
  }
  
  if (hasPopup && hasRedirect) {
    showBlocker(timerObject.redirectUrl); 
  } else if (hasPopup) {
    showBlocker();
  } else if (hasRedirect) {
    redirectTo(timerObject.redirectUrl);
  }
  
  BlockedDomain = currentDomain;
  //reset current domain
  storage.saveVariable(currentDomain,0);
  return;
}