import { custom_storage } from "../../browser/storage.js";
import { getCleanedIdentifier, isTrackableUrl } from "../../utils/url.js";
import { logFocusSessionEnd, startFocusTracking, accrueFocusTime, shortestTimer, computeAndSaveStats } from "../../services/stats-service.js";

globalThis.browser ??= globalThis.chrome;

// cleaned domain of the current tab or null
async function activeDomain() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (!isTrackableUrl(tab?.url)) return null;
    
    const blacklist = (await custom_storage.getSync('blacklist')) ?? [];
    return getCleanedIdentifier(tab.url, blacklist);
  } catch {
    return null;
  }
}

async function updateStatus() {
  const pageEl = document.getElementById('display-streak');
  const minEl  = document.getElementById('display-time');
  const bar    = document.getElementById('time-bar');
  const domain = await activeDomain();

  if (!domain) {
    pageEl.textContent = 'No active page';
    minEl.textContent = '';
    bar.style.setProperty('--time-bar-progress', '0%');
    return;
  }

  pageEl.textContent = domain;
  const timer = await shortestTimer(domain);

  if (!timer) {
    minEl.textContent = 'no limit';
    bar.style.setProperty('--time-bar-progress', '0%');
    return;
  }

  minEl.textContent = `${timer.remaining} min`;

  const usedPct = timer.maxTime > 0 
    ? Math.round(((timer.maxTime - timer.remaining) / timer.maxTime) * 100) 
    : 0;
    
  bar.style.setProperty('--time-bar-progress', `${usedPct}%`);
}

const focusToggle = () => document.getElementById('toggle-focus');
const pauseToggle = () => document.getElementById('toggle-pause');

const setFocusEnabled = (enabled) => {
  focusToggle().disabled = !enabled;
};

async function turnFocusOff() {
  await logFocusSessionEnd();
  await custom_storage.setLocal('focusMode', false);
  await accrueFocusTime();
}

async function loadToggles() {
  const [focusMode, paused] = await Promise.all([
    custom_storage.getLocal('focusMode'),
    custom_storage.getLocal('paused'),
  ]);

  focusToggle().checked = !!focusMode;
  pauseToggle().checked = !!paused;
  setFocusEnabled(!paused);
}

async function onFocusChange(e) {
  if (e.target.checked) {
    await custom_storage.setLocal('focusMode', true);
    await startFocusTracking();
    await browser.runtime.sendMessage({ action: "RECHECK_TAB" });
  } else {
    await turnFocusOff();
  }
  await updateStatus();
}

async function onPauseChange(e) {
  if (e.target.checked) {
    await custom_storage.setLocal('paused', true);
    
    if (focusToggle().checked) {
      focusToggle().checked = false;
      await turnFocusOff();
    }
    
    setFocusEnabled(false);
  } else {
    await custom_storage.setLocal('paused', false);
    setFocusEnabled(true);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await computeAndSaveStats();
  await Promise.all([updateStatus(), loadToggles()]);
  
  focusToggle().addEventListener('change', onFocusChange);
  pauseToggle().addEventListener('change', onPauseChange);
});