import { customStorage } from "../../browser/storage.js";
import { getActiveTabId } from "../../browser/tabs.js";
import { defaultBlacklist } from "../../utils/defaults.js";
import { getCleanedIdentifier, isTrackableUrl } from "../../utils/url.js";
import { logFocusSessionEnd, startFocusTracking, accrueFocusTime, shortestTimer, computeAndSaveStats } from "../../services/stats-service.js";

globalThis.browser ??= globalThis.chrome;

const debug = (...args) => console.log("[BrainSoap popup]", ...args);

window.addEventListener("error", (event) => {
  console.error("[BrainSoap popup] uncaught error", event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[BrainSoap popup] unhandled rejection", event.reason);
});

// cleaned domain of the current tab or null
async function activeDomain() {
  try {
    const tabId = await getActiveTabId();
    if (!tabId) {
      debug("no active tab id");
      return null;
    }

    const tab = await browser.tabs.get(tabId);
    debug("active tab", { tabId, url: tab?.url });

    if (!isTrackableUrl(tab?.url)) {
      debug("active tab is not trackable");
      return null;
    }
    
    const storedBlacklist = await customStorage.getSyncFresh('blacklist', defaultBlacklist);
    const blacklist = Array.isArray(storedBlacklist) ? storedBlacklist : defaultBlacklist;
    const domain = getCleanedIdentifier(tab.url, blacklist);
    debug("resolved domain", domain);
    return domain;
  } catch {
    debug("activeDomain failed");
    return null;
  }
}

function paintTimeBar(bar, usedPercent, spokenLabel) {
  bar.style.setProperty('--time-bar-progress', `${usedPercent}%`);
  bar.setAttribute('aria-valuenow', String(usedPercent));
  bar.setAttribute('aria-valuetext', spokenLabel);
}

async function updateStatus() {
  const pageEl = document.getElementById('display-streak');
  const minEl  = document.getElementById('display-time');
  const bar    = document.getElementById('time-bar');
  const domain = await activeDomain();
  debug("updateStatus", { domain });

  if (!domain) {
    pageEl.textContent = 'No active page';
    minEl.textContent = '';
    paintTimeBar(bar, 0, 'No active page');
    return;
  }

  pageEl.textContent = domain;
  const timer = await shortestTimer(domain);

  if (!timer) {
    minEl.textContent = 'no limit';
    paintTimeBar(bar, 0, 'No limit');
    debug("no timer found for domain");
    return;
  }

  minEl.textContent = `${timer.remaining} min`;
  debug("timer", timer);

  const usedPercent = timer.maxTime > 0
    ? Math.round(((timer.maxTime - timer.remaining) / timer.maxTime) * 100)
    : 0;

  paintTimeBar(bar, usedPercent, `${timer.remaining} of ${timer.maxTime} minutes left`);
}

const focusToggle = () => document.getElementById('toggle-focus');
const pauseToggle = () => document.getElementById('toggle-pause');

const setFocusEnabled = (enabled) => {
  focusToggle().disabled = !enabled;
};

async function turnFocusOff() {
  debug("turnFocusOff");
  await logFocusSessionEnd();
  await customStorage.setLocal('focusMode', false);
  await accrueFocusTime();
}

async function loadToggles() {
  const [focusMode, paused] = await Promise.all([
    customStorage.getLocalFresh('focusMode'),
    customStorage.getLocalFresh('paused'),
  ]);

  focusToggle().checked = !!focusMode;
  pauseToggle().checked = !!paused;
  setFocusEnabled(!paused);
  debug("loadToggles", { focusMode: !!focusMode, paused: !!paused });
}

async function onFocusChange(e) {
  debug("focus toggle changed", { checked: e.target.checked });
  if (e.target.checked) {
    await customStorage.setLocal('focusMode', true);
    await startFocusTracking();
    debug("sending RECHECK_TAB");
    const response = await browser.runtime.sendMessage({ action: "RECHECK_TAB" });
    debug("RECHECK_TAB response", response);
  } else {
    await turnFocusOff();
  }
  await updateStatus();
}

async function onPauseChange(e) {
  debug("pause toggle changed", { checked: e.target.checked });
  if (e.target.checked) {
    await customStorage.setLocal('paused', true);
    
    if (focusToggle().checked) {
      focusToggle().checked = false;
      await turnFocusOff();
    }
    
    setFocusEnabled(false);
  } else {
    await customStorage.setLocal('paused', false);
    setFocusEnabled(true);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  debug("DOMContentLoaded");
  await computeAndSaveStats();
  await Promise.all([updateStatus(), loadToggles()]);
  
  focusToggle().addEventListener('change', onFocusChange);
  pauseToggle().addEventListener('change', onPauseChange);
});