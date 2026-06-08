class storageManager {
    constructor() {
        this.localCache = {};
        this.syncCache = {};
        this.isInitialized = this.initCache();
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local') {
                for (let [key, { newValue }] of Object.entries(changes)) {
                    if (newValue === undefined) {
                    delete this.localCache[key]; // Falls gelöscht wurde
                    } else {
                    this.localCache[key] = newValue; // Aktualisieren
                    }
                }
            }
            if (areaName === 'sync') {
                for (let [key, { newValue }] of Object.entries(changes)) {
                    if (newValue === undefined) {
                        delete this.syncCache[key]; // Falls gelöscht wurde
                    } else {
                        this.syncCache[key] = newValue; // Aktualisieren
                    }
                }
            }
        });
    }

    // save new or update variable in browser storage
    async saveVariable(name, value) 
    {
        
        
        try {
            await browser.storage.local.set({ [name]: value });
        } catch (e) {
            console.error("Storage write error:", e);
            return undefined;
        }
    }

    // get variable from browser storage, may return undefined if variable doesnt exist.
    async getVariable(name) 
    {
        if (!this.isInitialized) { return undefined; }
        if(this.localCache[name]) {return this.localCache[name];}
        try {
            const result = await browser.storage.local.get(name);
            return result[name];
        } catch (e) {
            console.error("Storage read error:", e);
            return undefined;
        }
    }

    // save setting to synced storage or create new if not eist
    // this trusts the user input. 
    async saveSetting(name, value) 
    {
        try {
            await browser.storage.sync.set({ [name]: value });
            
        } catch (error) {
            console.error("Storage write error:", error);
        }
    }

    // get setting from synced storage, restores default if user deleted browser data
    async getSetting(name) 
    {
        if (!this.isInitialized) {return undefined;}
        if (this.syncCache[name]) {return this.syncCache[name];}

        try {
            const result = await browser.storage.sync.get(name);
            const value = result[name];

            if (value !== undefined) 
            {
                return value;
            }
            else // TODO: change
            {
                await checkSettingsExists()
                return defaultSettings[name];
            }
        } catch (error) {
            console.error("Storage read error:", e);
        }
        
    }

    async checkSettingsExists()
    {
        const result = await browser.storage.sync.get("exist").then((result) => result.exist);
        if (result === undefined)
        {
            await resetSettings();
        }
    }

    async clearLocalStorage() {
        try {
            await browser.storage.local.clear();
            console.log("All storage cleared.");
        } catch (e) {
            console.error("Storage clear error:", e);
        }
    }

    async resetSettings() {
        try {
            await browser.storage.sync.set(defaultSettings);
            console.log("Settings reset to default.");
        }
        catch (e) {
            console.error("Settings reset error:", e);
        }
    }

    async initCache() {
        try {
            // Fetch everything from both local and sync storage concurrently
            const [localData, syncData] = await Promise.all([
                browser.storage.local.get(null),
                browser.storage.sync.get(null)
            ]);

            // Populate the in-memory caches
            this.localCache = localData || {};
            this.syncCache = syncData || {};

            // If it's a first-time run or settings were cleared, initialize defaults
            if (this.syncCache["exist"] === undefined) {
                await this.resetSettings();
            }

            console.log("Storage cache successfully initialized.");
            return true;
        } catch (e) {
            console.error("Failed to initialize storage cache:", e);
            return false;
        }
    }
}
