import { custom_storage } from "../../../browser/storage.js";
import { defaultSettings, defaultBlacklist } from "../../../utils/defaults.js";
import { getSettings, saveSettings } from "../../../utils/settings.js";
import { applyTheme } from "../../../utils/themes.js";

const EXPORT_FILENAME = "brainsoap-backup.json";

// patch the nested new-category defaults without dropping the other keys
async function saveCategoryDefaults(patch) {
  const current = (await getSettings()).newCategoryDefaults;
  return saveSettings({ newCategoryDefaults: { ...current, ...patch } });
}

function setStatus(message) {
  const el = document.getElementById('settings-status');
  if (el) el.textContent = message ?? '';
}

// --- data management -------------------------------------------------------

async function exportData() {
  const [sync, local] = await Promise.all([
    chrome.storage.sync.get(null),
    chrome.storage.local.get(null),
  ]);

  const payload = {
    app: "BrainSoap",
    version: 1,
    exportedAt: new Date().toISOString(),
    sync,
    local,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = EXPORT_FILENAME;
  link.click();
  URL.revokeObjectURL(url);

  setStatus("Exported your settings and data.");
}

async function importData(file) {
  try {
    const data = JSON.parse(await file.text());

    if (data?.app !== "BrainSoap" || !data.sync) {
      setStatus("That file isn't a BrainSoap backup.");
      return;
    }

    await chrome.storage.sync.set(data.sync);
    if (data.local) await chrome.storage.local.set(data.local);

    setStatus("Imported. Reloading…");
    setTimeout(() => location.reload(), 600);
  } catch (e) {
    console.error("Import failed:", e);
    setStatus("Import failed — the file couldn't be read.");
  }
}

// usage/stats data kept in local storage — wiped on a full reset
const STATS_KEYS = [
  'dayLog', 'domainLog', 'categoryLog', 'usageStats',
  'recentStats', 'topExcluded', 'activeDates',
];

async function resetAll() {
  if (!confirm("Reset all settings, rules and stats to their defaults?")) return;

  await custom_storage.setSync('settings', { ...defaultSettings });
  await custom_storage.setSync('blacklist', defaultBlacklist);
  await chrome.storage.local.remove(STATS_KEYS);

  setStatus("Reset to defaults. Reloading…");
  setTimeout(() => location.reload(), 600);
}

// --- wiring ----------------------------------------------------------------

async function initSettings() {
  const settings = await getSettings();

  const themeSelect = document.getElementById('setting-theme');
  const notifToggle = document.getElementById('setting-notifications');
  const refreshInput = document.getElementById('setting-refresh');
  const catTimeInput = document.getElementById('setting-cat-time');
  const catActionSelect = document.getElementById('setting-cat-action');
  const catRedirectInput = document.getElementById('setting-cat-redirect');
  const exportBtn = document.getElementById('settings-export');
  const importBtn = document.getElementById('settings-import');
  const importFile = document.getElementById('settings-import-file');
  const resetBtn = document.getElementById('settings-reset');

  const catDefaults = settings.newCategoryDefaults ?? defaultSettings.newCategoryDefaults;

  // reflect stored state, then apply the saved theme to the whole dashboard
  if (themeSelect) themeSelect.value = settings.theme ?? 'system';
  if (notifToggle) notifToggle.checked = settings.notificationsEnabled !== false;
  if (refreshInput) refreshInput.value = settings.refreshSeconds ?? defaultSettings.refreshSeconds;
  if (catTimeInput) catTimeInput.value = catDefaults.maxTime;
  if (catActionSelect) catActionSelect.value = catDefaults.action;
  if (catRedirectInput) catRedirectInput.value = catDefaults.redirectUrl ?? '';
  syncRedirect();
  applyTheme(settings.theme);

  // redirect url is only relevant when the action is "redirect"
  function syncRedirect() {
    if (catRedirectInput) catRedirectInput.hidden = catActionSelect?.value !== 'redirect';
  }

  themeSelect?.addEventListener('change', async () => {
    applyTheme(themeSelect.value);
    await saveSettings({ theme: themeSelect.value });
    setStatus("Theme updated.");
  });

  notifToggle?.addEventListener('change', async () => {
    const enabled = notifToggle.checked;
    await saveSettings({ notificationsEnabled: enabled });
    setStatus(enabled ? "Notifications enabled." : "Notifications disabled.");
  });

  refreshInput?.addEventListener('change', async () => {
    const seconds = Math.max(1, Number(refreshInput.value) || defaultSettings.refreshSeconds);
    refreshInput.value = seconds;
    await saveSettings({ refreshSeconds: seconds });
    setStatus("Refresh interval saved — reload to apply.");
  });

  catTimeInput?.addEventListener('change', async () => {
    const maxTime = Math.max(1, Number(catTimeInput.value) || defaultSettings.newCategoryDefaults.maxTime);
    catTimeInput.value = maxTime;
    await saveCategoryDefaults({ maxTime });
    setStatus("Default time limit saved.");
  });

  catActionSelect?.addEventListener('change', async () => {
    syncRedirect();
    await saveCategoryDefaults({ action: catActionSelect.value });
    setStatus("Default action saved.");
  });

  catRedirectInput?.addEventListener('change', async () => {
    await saveCategoryDefaults({ redirectUrl: catRedirectInput.value.trim() });
    setStatus("Default redirect URL saved.");
  });

  exportBtn?.addEventListener('click', exportData);

  importBtn?.addEventListener('click', () => importFile?.click());
  importFile?.addEventListener('change', () => {
    const file = importFile.files?.[0];
    if (file) importData(file);
    importFile.value = '';
  });

  resetBtn?.addEventListener('click', resetAll);
}

document.addEventListener('DOMContentLoaded', initSettings);
