// save new or update variable in browser storage
async function saveVariable(name, value) 
{
    try {
        await browser.storage.local.set({ [name]: value });
    } catch (e) {
        console.error("Storage write error:", e);
        return undefined;
    }
}

// get variable from browser storage, may return undefined if variable doesnt exist.
async function getVariable(name) 
{
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
async function saveSetting(name, value) 
{
    try {
        await browser.storage.sync.set({ [name]: value });
        
    } catch (error) {
        console.error("Storage write error:", error);
    }
}

// get setting from synced storage, restores default if user deleted browser data
async function getSetting(name) 
{
    const result = await browser.storage.sync.get(name);
    const value = result[name];

    // validate that the value exists and is not undefined
    if (value !== undefined) 
    {
        return value;
    }
    else 
    {
        await checkSettingsExists()
        return defaultSettings[name];
    }
}

async function checkSettingsExists()
{
    const result = await browser.storage.sync.get("exist").then((result) => result.exist);
    if (result === undefined)
    {
        // restore default settings if user deleted browser data
        await browser.storage.sync.set(defaultSettings);
    }
}

async function clearLocalStorage() {
    try {
        await browser.storage.local.clear();
        console.log("All storage cleared.");
    } catch (e) {
        console.error("Storage clear error:", e);
    }
}