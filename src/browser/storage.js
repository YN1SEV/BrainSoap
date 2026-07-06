class StorageManager {
  constructor() {
		
		// cross-browser
		this.browserApi = globalThis.browser ?? globalThis.chrome;

		this.localCache = {};
		this.syncCache = {};
		this.isReady = false;

		this.initPromise = this._initCache();

		// ensures FE and BE are synced
		chrome.storage.onChanged.addListener((changes, areaName) => {
			if (areaName === 'local') {
				for (let [key, { newValue }] of Object.entries(changes)) {
					if (newValue === undefined) delete this.localCache[key];
					else this.localCache[key] = newValue;
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
	async setLocal(key, value) {
		await this._ensureInitialized();
		this.localCache[key] = value;
		await chrome.storage.local.set({ [key]: value });
	}

	async getLocal(key) {
		await this._ensureInitialized();
		if (this.localCache[key] !== undefined) return this.localCache[key];

		const result = await chrome.storage.local.get(key);
		return result[key];
	}

	// wipes session
	async clearLocalStorage() {
		const KEEP = new Set([
      'dayLog', 
      'domainLog', 
      'categoryLog', 
      'usageStats', 
      'recentStats', 
      'topExcluded', 
      'activeDates', 
      'installDate'
    ]);

		const toDelete = Object.keys(this.localCache).filter((key) => !KEEP.has(key));
		if (!toDelete.length) return;
		await chrome.storage.local.remove(toDelete);
		for (const key of toDelete) delete this.localCache[key];
	}

	// synced storage
	async setSync(key, value) {
		await this._ensureInitialized();
		this.syncCache[key] = value;
		await chrome.storage.sync.set({ [key]: value });
	}

	async getSync(key) {
		await this._ensureInitialized();
		if (this.syncCache[key] !== undefined) return this.syncCache[key];

		const result = await chrome.storage.sync.get(key);
		return result[key];
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
			const [localData, syncData] = await Promise.all([
				chrome.storage.local.get(null),
				chrome.storage.sync.get(null)
			]);
			this.localCache = localData || {};
			this.syncCache = syncData || {};
			this.isReady = true;
			} catch (e) {
				console.error("StorageManager Init Failed:", e);
			}
	}
}

// expose globall for non-module UI scripts
export const custom_storage = new StorageManager();
try { window.custom_storage = custom_storage; } catch (e) {}