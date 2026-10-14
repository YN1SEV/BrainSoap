import { customStorage } from "../../browser/storage.js";
import { getCleanedIdentifier, isTrackableUrl } from "../../utils/url.js";
import { logFocusSessionEnd, startFocusTracking, accrueFocusTime, shortestTimer, computeAndSaveStats } from "../../services/stats-service.js";
import { applyTheme } from "../../utils/themes.js";

globalThis.browser ??= globalThis.chrome;

// cleaned domain of the current tab or null
async function activeDomain() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (!isTrackableUrl(tab?.url)) return null;
    
    const blacklist = (await customStorage.getSync('blacklist')) ?? [];
    return getCleanedIdentifier(tab.url, blacklist);
  } catch {
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
    return;
  }

  minEl.textContent = `${timer.remaining} min`;

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
  await logFocusSessionEnd();
  await customStorage.setLocal('focusMode', false);
  await accrueFocusTime();
}

async function loadToggles() {
  const [focusMode, paused] = await Promise.all([
    customStorage.getLocal('focusMode'),
    customStorage.getLocal('paused'),
  ]);

  focusToggle().checked = !!focusMode;
  pauseToggle().checked = !!paused;
  setFocusEnabled(!paused);
}

async function onFocusChange(e) {
  if (e.target.checked) {
    await customStorage.setLocal('focusMode', true);
    await startFocusTracking();
    await browser.runtime.sendMessage({ action: "RECHECK_TAB" });
  } else {
    await turnFocusOff();
  }
  await updateStatus();
}

async function onPauseChange(e) {
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
  const settings = await customStorage.getSync('settings');
  const theme = settings?.theme ?? 'system';
  applyTheme(theme);
  document.documentElement.dataset.theme = theme;

  await computeAndSaveStats();
  await Promise.all([updateStatus(), loadToggles()]);
  
  focusToggle().addEventListener('change', onFocusChange);
  pauseToggle().addEventListener('change', onPauseChange);
  setInterval(updateStatus, 5000);
});