class StorageManager {
  constructor() {
		
		// cross-browser
		this.browserApi = globalThis.browser ?? globalThis.chrome;
		this.debug = (...args) => console.log("[BrainSoap storage]", ...args);

		this.localCache = {};
		this.syncCache = {};
		this.isReady = false;

		this.initPromise = this._initCache();

		// ensures FB and BG are synced
		this.browserApi.storage.onChanged.addListener((changes, areaName) => {
			if (areaName === 'local') {
				for (let [key, { newValue }] of Object.entries(changes)) {
					if (newValue === undefined) delete this.localCache[key];
					else this.localCache[key] = newValue;

					if (newValue === undefined) delete this.syncCache[key];
					else this.syncCache[key] = newValue;
				}
			}
			if (areaName === 'sync') {
				for (let [key, { newValue }] of Object.entries(changes)) {
					if (newValue === undefined) delete this.syncCache[key];
					else this.syncCache[key] = newValue;
				}
			}
		});
	}

	// wait for first cache
	async _ensureInitialized() {
		if (!this.isReady) await this.initPromise;
	}

	// local storage
	async setLocal(key, value) 
	{
		try {
			await this._ensureInitialized();
			this.debug("setLocal", { key, hasValue: value !== undefined });
			this.localCache[key] = value;
			await this.browserApi.storage.local.set({ [key]: value });		
		} catch (e) {
			console.error(`error while setting ${key} in local storage`, e);
			throw e;
		}
	}

	async getLocal(key) {
		try {
			await this._ensureInitialized();
			this.debug("getLocal", { key, cached: this.localCache[key] !== undefined });
			if (this.localCache[key] !== undefined) return this.localCache[key];

			const result = await this.browserApi.storage.local.get(key);
			return result[key];
		} catch (e) {
			console.error(`error while getting ${key} from local storage`, e);
			throw e;
		}
	}

	async getLocalFresh(key) {
		try {
			await this._ensureInitialized();
			this.debug("getLocalFresh", { key });
			const result = await this.browserApi.storage.local.get(key);
			const value = result[key];
			if (value !== undefined) this.localCache[key] = value;
			return value;
		} catch (e) {
			console.error(`error while getting ${key} from local storage`, e);
			throw e;
		}
	}

	// wipes session
	async clearLocalStorage() {
		this.debug("clearLocalStorage");
		const KEEP = new Set([
      'dayLog', 
      'domainLog', 
      'categoryLog', 
      'usageStats', 
      'recentVisits', 
      'topExcluded', 
      'activeDates', 
	'focusMode',
	'paused',
	'settings',
	'blacklist',
      'installDate'
    ]);

		const toDelete = Object.keys(this.localCache).filter((key) => !KEEP.has(key));
		if (!toDelete.length) return;
		await this.browserApi.storage.local.remove(toDelete);
		for (const key of toDelete) delete this.localCache[key];
	}

	// synced storage
	async setSync(key, value) {
		try {
			await this._ensureInitialized();
			this.debug("setSync->local", { key, hasValue: value !== undefined });
			this.localCache[key] = value;
			this.syncCache[key] = value;
			await this.browserApi.storage.local.set({ [key]: value });
		} catch (e) {
			console.error(`error while setting ${key} in sync storage`, e);
			throw e;
		}
	}

	async getSync(key, fallbackValue = undefined, fresh = false) {
		try {
		await this._ensureInitialized();
		this.debug("getSync->local", { key, cached: this.syncCache[key] !== undefined, fresh });
		if (!fresh && this.syncCache[key] !== undefined) return this.syncCache[key];

		const result = await this.browserApi.storage.local.get(key);
		const value = result[key] ?? fallbackValue;
		if (value !== undefined) this.localCache[key] = value;
		if (value !== undefined) this.syncCache[key] = value;
		return value;
		} catch (e) {
			console.error(`error while getting ${key} in sync storage`, e);
			if (fallbackValue !== undefined) return fallbackValue;
			throw e;
		}
	}

	async getSyncFresh(key, fallbackValue = undefined) {
		return this.getSync(key, fallbackValue, true);
	}

	async resetSettings(defaults) {
		await this.setSync('settings', defaults);
	}

	// restore defaults
	async checkSettingsExists(defaults) {
		const settings = await this.getSync('settings');
		if (!settings?.exist) await this.setSync('settings', defaults);
	}



	// --- initialize storage ---
	async _initCache() {
		try {
			this.debug("initCache:start");
			const localData = await this.browserApi.storage.local.get(null);
			this.localCache = localData || {};
			this.syncCache = { ...this.localCache };
			this.isReady = true;
			this.debug("initCache:done", { keys: Object.keys(this.localCache) });
			} catch (e) {
				console.error("error while initializing storage:", e);
				throw e;
			}
	}
}

// expose globally for non-module UI scripts
export const customStorage = new StorageManager();
try { window.customStorage = customStorage; } catch (e) {}