// ===================================================================================================================
// DEFAULT SETTINGS ON INSTALL
// ===================================================================================================================

import { custom_storage } from "../browser_handlers/storage_manager.js";

export const defaultSettings = {
  exist: true, // flag to check if user deleted browser data
  theme: "light", // make this browser default
  notificationsEnabled: true, // note to self: change to false
  
  timers: {
    "Social Media": { "limit": 30, "actions": ["notify", "popup", "redirect"], "redirectUrl": "https://www.linkedin.com/jobs/" },
    "Entertainment": { "limit": 60, "actions": ["image"], "imagePath": "assets/visuals/stop.png" },
  },

  timerMap: {
    "instagram.com": ["Social Media"],
    "tiktok.com": ["Social Media"],
    "facebook.com": ["Social Media"],
    "youtube.com": ["Entertainment"],
    "netflix.com": ["Entertainment"],
    "reddit.com": ["Social Media", "Entertainment"]
  }
};


// ===================================================================================================================
// FRONTEND -> BACKEND: BLACKLIST STRUCTURE
// Sent only when changes occur. Used for timer restriction logic.
// ===================================================================================================================
const sampleBlacklist = [
  {
    timerName: "Social Media",
    maxTime: 30, 
    minRemaining: 12,
    items: [
      { name: "Instagram", url: "instagram.com", active: true },
      { name: "TikTok", url: "tiktok.com", active: true },
      { name: "Facebook", url: "facebook.com", active: false }
    ]
  },
  {
    timerName: "Entertainment",
    maxTime: 60, 
    minRemaining: 45, 
    items: [
      { name: "YouTube", url: "youtube.com", active: true },
      { name: "Netflix", url: "netflix.com", active: true },
      { name: "Twitch", url: "twitch.tv", active: false }
    ]
  }
];


// ===================================================================================================================
// BACKEND -> FRONTEND: RECENT ACTIVITY STATS
// Sent every 30 seconds (only when dashboard is open).
// Contains the 10 most recently visited URLs.
// ===================================================================================================================
const sampleRecentStats = [
  { url: "github.com", durationSeconds: 5420 },        // ca. 1.5 Stunden
  { url: "stackoverflow.com", durationSeconds: 1240 }, // ca. 20 Minuten
  { url: "youtube.com", durationSeconds: 3450 },       // ca. 57 Minuten
  { url: "instagram.com", durationSeconds: 420 },      // 7 Minuten
  { url: "mail.google.com", durationSeconds: 890 }     // ca. 15 Minuten
];

// ===================================================================================================================
// BACKEND -> FRONTEND: WEEKLY + ALL-TIME STATISTICS
// Sent every 10 minutes or on page refresh (only when dashboard is open).
// ===================================================================================================================
const sampleUsageStats = {
  focusHours: 32.5,        
  focusSessions: 24,       
  scrollHours: 5.2,        
  scrollAttempts: 42,      
  scrollBlocks: 18,        
  bestStreak: 7,          
  blockedSites: 6,         
  activeDays: 6,           
  
  chart: {
    focus: [4.5, 6.2, 5.8, 4.0, 7.1, 2.0, 2.9], 
    scroll: [1.5, 0.8, 1.2, 0.5, 0.9, 2.1, 1.8]
  }
};


// ===================================================================================================================
// inital data population for testing purposes - to be removed
// ===================================================================================================================
async function initTestDaten() {
    const existingBlacklist = await custom_storage.getSync('blacklist');
    
    if (!existingBlacklist || existingBlacklist.length === 0) {
        console.log("Speicher ist leer. Lade Testdaten...");
        await custom_storage.setSync('blacklist', sampleBlacklist);
        await custom_storage.setLocal('usageStats', sampleUsageStats);
        await custom_storage.setLocal('recentStats', sampleRecentStats);
    } else {
        console.log("Nutzerdaten existieren bereits. Testdaten werden ignoriert.");
    }
}

// Funktion direkt ausführen
initTestDaten();