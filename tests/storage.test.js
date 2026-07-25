import { describe, test, expect, spyOn, mock, beforeEach } from 'bun:test';
// 1. Import mocks FIRST so globalThis.chrome is set up before customStorage is instantiated
import { localStorage, syncStorage, triggerStorageChange } from './mock-storage.js';
import { customStorage } from '../src/browser/storage.js'; // Your exported instance

describe('customStorage (StorageManager Instance)', () => {
  beforeEach(async () => {
    // Silence console logs for this test suite
    let errorSpy = spyOn(console, 'error').mockImplementation(() => {});
    let logSpy   = spyOn(console, 'log').mockImplementation(() => {});
    let warnSpy  = spyOn(console, 'warn').mockImplementation(() => {});

    // Reset mock storage state and function call records
    localStorage.clear();
    syncStorage.clear();
    localStorage.get.mockClear();
    localStorage.set.mockClear();
    localStorage.remove.mockClear();
    syncStorage.get.mockClear();
    syncStorage.set.mockClear();

    // Reset instance cache state between tests
    customStorage.localCache = {};
    customStorage.syncCache = {};

    // Ensure initial promise has completed
    await customStorage.initPromise;
  });

  // ==========================================
  // HAPPY PATHS
  // ==========================================
  describe('Happy Paths', () => {
    test('setLocal stores key-value pair in browser storage and local cache', async () => {
      await customStorage.setLocal('userTheme', 'dark');

      expect(await customStorage.getLocal('userTheme')).toBe('dark');
      expect(localStorage.set).toHaveBeenCalledWith({ userTheme: 'dark' });
    });

    test('getLocal retrieves value from cache without calling storage API', async () => {
      await customStorage.setLocal('cachedKey', 'cachedValue');
      localStorage.get.mockClear();

      const val = await customStorage.getLocal('cachedKey');

      expect(val).toBe('cachedValue');
      expect(localStorage.get).not.toHaveBeenCalled();
    });

    test('clearLocalStorage removes only non-protected keys', async () => {
      await customStorage.setLocal('dayLog', 'KEEP_ME');
      await customStorage.setLocal('tempSessionData', 'DELETE_ME');

      await customStorage.clearLocalStorage();

      expect(await customStorage.getLocal('dayLog')).toBe('KEEP_ME');
      expect(localStorage.state['tempSessionData']).toBeUndefined();
      expect(localStorage.remove).toHaveBeenCalledWith(['tempSessionData']);
    });

    test('setSync and getSync handle sync storage interactions', async () => {
      await customStorage.setSync('syncSetting', { enabled: true });

      const val = await customStorage.getSync('syncSetting');

      expect(val).toEqual({ enabled: true });
      expect(syncStorage.set).toHaveBeenCalledWith({ syncSetting: { enabled: true } });
    });

    test('resetSettings updates default settings in sync storage', async () => {
      const defaults = { theme: 'light', sound: true };
      await customStorage.resetSettings(defaults);

      expect(await customStorage.getSync('settings')).toEqual(defaults);
    });

    test('checkSettingsExists sets defaults if no settings exist', async () => {
      const defaults = { exist: true, version: 1 };
      
      await customStorage.checkSettingsExists(defaults);

      expect(await customStorage.getSync('settings')).toEqual(defaults);
    });

    test('onChanged listener updates localCache on external storage updates', async () => {
      triggerStorageChange({ externalKey: { newValue: 'externalVal' } }, 'local');

      expect(await customStorage.getLocal('externalKey')).toBe('externalVal');
    });

    test('getLocal fetches directly from browser storage on cache miss', async () => {
      localStorage.state['uncachedKey'] = 'directBrowserValue';

      const val = await customStorage.getLocal('uncachedKey');

      expect(val).toBe('directBrowserValue');
      expect(localStorage.get).toHaveBeenCalledWith('uncachedKey');
    });

    test('getSync fetches directly from browser storage on cache miss', async () => {
      syncStorage.state['uncachedSyncKey'] = 'directSyncValue';

      const val = await customStorage.getSync('uncachedSyncKey');

      expect(val).toBe('directSyncValue');
      expect(syncStorage.get).toHaveBeenCalledWith('uncachedSyncKey');
    });

    test('checkSettingsExists does NOT overwrite if settings already exist', async () => {
      const existingSettings = { exist: true, theme: 'dark' };
      await customStorage.setSync('settings', existingSettings);

      const defaults = { exist: true, theme: 'light' };
      await customStorage.checkSettingsExists(defaults);

      expect(await customStorage.getSync('settings')).toEqual(existingSettings);
    });

    test('onChanged listener updates syncCache on external sync storage updates', async () => {
      triggerStorageChange({ externalSyncKey: { newValue: 'syncVal' } }, 'sync');

      expect(await customStorage.getSync('externalSyncKey')).toBe('syncVal');
    });

    test('onChanged listener removes items from syncCache when deleted externally', async () => {
      await customStorage.setSync('tempSyncKey', 'value');

      triggerStorageChange({ tempSyncKey: { newValue: undefined } }, 'sync');

      expect(customStorage.syncCache['tempSyncKey']).toBeUndefined();
    });
  });

  // ==========================================
  // UNHAPPY PATHS
  // ==========================================
  describe('Unhappy Paths', () => {
    test('setLocal throws when browser storage write fails', async () => {
      localStorage.shouldFail = true;

      expect(customStorage.setLocal('key', 'val')).rejects.toThrow('Storage write error');
    });

    test('setSync throws when browser sync write fails', async () => {
      syncStorage.shouldFail = true;

      expect(customStorage.setSync('key', 'val')).rejects.toThrow('Storage write error');
    });

    test('clearLocalStorage does nothing if no deletable keys exist', async () => {
      await customStorage.setLocal('installDate', '2026-01-01'); // Protected key
      localStorage.remove.mockClear();

      await customStorage.clearLocalStorage();

      expect(localStorage.remove).not.toHaveBeenCalled();
    });

    test('onChanged listener removes items from cache when deleted externally', async () => {
      await customStorage.setLocal('tempKey', 'value');

      // Simulate external deletion (newValue is undefined)
      triggerStorageChange({ tempKey: { newValue: undefined } }, 'local');

      expect(customStorage.localCache['tempKey']).toBeUndefined();
    });

    test('getLocal throws when browser local storage get fails on cache miss', async () => {
      localStorage.get = mock(async () => {
        throw new Error('Local read error');
      });

      expect(customStorage.getLocal('missingKey')).rejects.toThrow('Local read error');
    });

    test('getSync throws when browser sync storage get fails on cache miss', async () => {
      syncStorage.get = mock(async () => {
        throw new Error('Sync read error');
      });

      expect(customStorage.getSync('missingKey')).rejects.toThrow('Sync read error');
    });

    test('clearLocalStorage throws when browser storage remove API fails', async () => {
      await customStorage.setLocal('tempData', 'deleteMe');
      localStorage.remove = mock(async () => {
        throw new Error('Removal failed');
      });

      expect(customStorage.clearLocalStorage()).rejects.toThrow('Removal failed');
    });
  });
});