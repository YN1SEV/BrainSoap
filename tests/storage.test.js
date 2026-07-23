import { describe, test, expect, beforeEach } from 'bun:test';
// 1. Import mocks FIRST so globalThis.chrome is set up before custom_storage is instantiated
import { localStorage, syncStorage, triggerStorageChange } from './mockStorage.js';
import { custom_storage } from '../src/browser/storage.js'; // Your exported instance

describe('custom_storage (StorageManager Instance)', () => {
  beforeEach(async () => {
    // Reset mock storage state and function call records
    localStorage.clear();
    syncStorage.clear();
    localStorage.get.mockClear();
    localStorage.set.mockClear();
    localStorage.remove.mockClear();
    syncStorage.get.mockClear();
    syncStorage.set.mockClear();

    // Reset instance cache state between tests
    custom_storage.localCache = {};
    custom_storage.syncCache = {};

    // Ensure initial promise has completed
    await custom_storage.initPromise;
  });

  // ==========================================
  // HAPPY PATHS
  // ==========================================
  describe('Happy Paths', () => {
    test('setLocal stores key-value pair in browser storage and local cache', async () => {
      await custom_storage.setLocal('userTheme', 'dark');

      expect(await custom_storage.getLocal('userTheme')).toBe('dark');
      expect(localStorage.set).toHaveBeenCalledWith({ userTheme: 'dark' });
    });

    test('getLocal retrieves value from cache without calling storage API', async () => {
      await custom_storage.setLocal('cachedKey', 'cachedValue');
      localStorage.get.mockClear();

      const val = await custom_storage.getLocal('cachedKey');

      expect(val).toBe('cachedValue');
      expect(localStorage.get).not.toHaveBeenCalled();
    });

    test('clearLocalStorage removes only non-protected keys', async () => {
      await custom_storage.setLocal('dayLog', 'KEEP_ME');
      await custom_storage.setLocal('tempSessionData', 'DELETE_ME');

      await custom_storage.clearLocalStorage();

      expect(await custom_storage.getLocal('dayLog')).toBe('KEEP_ME');
      expect(localStorage.state['tempSessionData']).toBeUndefined();
      expect(localStorage.remove).toHaveBeenCalledWith(['tempSessionData']);
    });

    test('setSync and getSync handle sync storage interactions', async () => {
      await custom_storage.setSync('syncSetting', { enabled: true });

      const val = await custom_storage.getSync('syncSetting');

      expect(val).toEqual({ enabled: true });
      expect(syncStorage.set).toHaveBeenCalledWith({ syncSetting: { enabled: true } });
    });

    test('resetSettings updates default settings in sync storage', async () => {
      const defaults = { theme: 'light', sound: true };
      await custom_storage.resetSettings(defaults);

      expect(await custom_storage.getSync('settings')).toEqual(defaults);
    });

    test('checkSettingsExists sets defaults if no settings exist', async () => {
      const defaults = { exist: true, version: 1 };
      
      await custom_storage.checkSettingsExists(defaults);

      expect(await custom_storage.getSync('settings')).toEqual(defaults);
    });

    test('onChanged listener updates localCache on external storage updates', async () => {
      triggerStorageChange({ externalKey: { newValue: 'externalVal' } }, 'local');

      expect(await custom_storage.getLocal('externalKey')).toBe('externalVal');
    });
  });

  // ==========================================
  // UNHAPPY PATHS
  // ==========================================
  describe('Unhappy Paths', () => {
    test('setLocal throws when browser storage write fails', async () => {
      localStorage.shouldFail = true;

      expect(custom_storage.setLocal('key', 'val')).rejects.toThrow('Storage write error');
    });

    test('setSync throws when browser sync write fails', async () => {
      syncStorage.shouldFail = true;

      expect(custom_storage.setSync('key', 'val')).rejects.toThrow('Storage write error');
    });

    test('clearLocalStorage does nothing if no deletable keys exist', async () => {
      await custom_storage.setLocal('installDate', '2026-01-01'); // Protected key
      localStorage.remove.mockClear();

      await custom_storage.clearLocalStorage();

      expect(localStorage.remove).not.toHaveBeenCalled();
    });

    test('onChanged listener removes items from cache when deleted externally', async () => {
      await custom_storage.setLocal('tempKey', 'value');

      // Simulate external deletion (newValue is undefined)
      triggerStorageChange({ tempKey: { newValue: undefined } }, 'local');

      expect(custom_storage.localCache['tempKey']).toBeUndefined();
    });
  });
});