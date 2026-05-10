import { defaultSettings } from "./defaults.js";

// save new or update variable in browser storage
function SaveVariable(name, value) 
{
  browser.storage.local.set({ [name]: value });
}

// get variable from browser storage, may return undefined if variable doesnt exist.
function GetVariable(name) 
{
    return browser.storage.local.get(name).then((result) => result[name]);
}

// save setting to synced storage or create new if not eist
function saveSetting(name, value) 
{
  browser.storage.sync.set({ [name]: value });
}

// get setting from synced storage, restores default if user deleted browser data
function getSetting(name) 
{
    value = browser.storage.sync.get(name).then((result) => result[name]);
    // validate that the value exists and is not undefined
    if (value !== undefined) 
    {
        return value;
    }
    else 
    {
        checkSettingsExists()
        return defaultSettings[name];
    }


}

function checkSettingsExists()
{
    exist = browser.storage.sync.get("exist").then((result) => result.exist);
    if (exist === undefined)
    {
        // restore default settings if user deleted browser data
        browser.storage.sync.set(defaultSettings);
    }
}