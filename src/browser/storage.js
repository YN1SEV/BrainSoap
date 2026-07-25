class StorageManager {
  constructor() {
		
		// cross-browser
		this.browserApi = globalThis.browser ?? globalThis.chrome;

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
			if (this.localCache[key] !== undefined) return this.localCache[key];

			const result = await this.browserApi.storage.local.get(key);
			return result[key];
		} catch (e) {
			console.error(`error while getting ${key} from local storage`, e);
			throw e;
		}
	}

	// wipes session
	async clearLocalStorage() {
		const KEEP = new Set([
      'dayLog', 
      'domainLog', 
      'categoryLog', 
      'usageStats', 
      'recentVisits', 
      'topExcluded', 
      'activeDates', 
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
			this.syncCache[key] = value;
			await this.browserApi.storage.sync.set({ [key]: value });
		} catch (e) {
			console.error(`error while setting ${key} in sync storage`, e);
			throw e;
		}
	}

	async getSync(key) {
		try {
		await this._ensureInitialized();
		if (this.syncCache[key] !== undefined) return this.syncCache[key];

		const result = await this.browserApi.storage.sync.get(key);
		return result[key];
		} catch (e) {
			console.error(`error while getting ${key} in sync storage`, e);
			throw e;
		}
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
				this.browserApi.storage.local.get(null),
				this.browserApi.storage.sync.get(null)
			]);
			this.localCache = localData || {};
			this.syncCache = syncData || {};
			this.isReady = true;
			} catch (e) {
				console.error("error while initializing storage:", e);
				throw e;
			}
	}
}

// expose globally for non-module UI scripts
export const customStorage = new StorageManager();
try { window.customStorage = customStorage; } catch (e) {}