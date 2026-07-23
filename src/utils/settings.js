import { custom_storage } from "../browser/storage.js";
import { defaultSettings } from "./defaults.js";

// read settings merged over the defaults so missing keys always resolve
export async function getSettings() {
  return { ...defaultSettings, ...(await custom_storage.getSync('settings')) };
}

export async function saveSettings(patch) {
  const next = { ...(await getSettings()), ...patch };
  await custom_storage.setSync('settings', next);
  return next;
}

// dashboard refresh interval in milliseconds (min 1s)
export async function getRefreshMs() {
  const { refreshSeconds } = await getSettings();
  const seconds = Number(refreshSeconds) || defaultSettings.refreshSeconds;
  return Math.max(1, seconds) * 1000;
}

// defaults applied when the user creates a new rules category
export async function getNewCategoryDefaults() {
  const { newCategoryDefaults } = await getSettings();
  return { ...defaultSettings.newCategoryDefaults, ...newCategoryDefaults };
}
