// ===================================================================================================================
// DEFAULT SETTINGS ON INSTALL
// ===================================================================================================================

export const defaultSettings = {
  exist: true, // flag to check if user deleted browser data
  theme: "light", // make this browser default
  notificationsEnabled: true, // note to self: change to false
  
  timers: {
    "timer1": {"limit": 5, "actions": ["notify", "popup", "redirect"], "redirectUrl": "https://www.linkedin.com/jobs/"},
    "timer2": {"limit": 5, "actions": ["image"], "imagePath": "assets/visuals/stop.png"},
  },

  timerMap: {
    "URL_NAME_1": ["timer1"],
    "URL_NAME_2": ["timer1", "timer2"],
  }
};


// ===================================================================================================================
// FRONTEND -> BACKEND: BLACKLIST STRUCTURE
// Sent only when changes occur. Used for timer restriction logic.
// ===================================================================================================================
const sampleBlacklist = [
  {
    timerName: "timer1",
    maxTime: 60,
    minRemaining: 0, 
    items: [
      { name: "URL_NAME_1", url: "URL_1", active: true },
      { name: "URL_NAME_2", url: "URL_2", active: true },
      { name: "URL_NAME_3", url: "URL_3", active: false }
    ]
  },
  {
    timerName: "timer2",
    maxTime: 30,
    minRemaining: 1,
    items: [
      { name: "URL_NAME_2", url: "URL_2", active: true },
      { name: "URL_NAME_1", url: "URL_1", active: false }
    ]
  }
];


// ===================================================================================================================
// BACKEND -> FRONTEND: RECENT ACTIVITY STATS
// Sent every 30 seconds (only when dashboard is open).
// Contains the 10 most recently visited URLs.
// ===================================================================================================================
const sampleRecentStats = [
  { url: "URL_1", durationSeconds: 2642 },
  { url: "URL_2", durationSeconds: 126342 },
  { url: "URL_3", durationSeconds: 82634 },
  { url: "URL_4", durationSeconds: 4265 }
];

// ===================================================================================================================
// BACKEND -> FRONTEND: WEEKLY + ALL-TIME STATISTICS
// Sent every 10 minutes or on page refresh (only when dashboard is open).
// ===================================================================================================================
const sampleUsageStats = {
  focusHours: 11.9,
  focusSessions: 18,
  scrollHours: 4.5,
  scrollAttempts: 17,
  scrollBlocks: 9,
  bestStreak: 4,
  blockedSites: 23,
  activeDays: 6,
  
  chart: {
    focus: [1.2, 21.5, 0.8, 3.0, 4.1, 0.0, 0.3],
    scroll: [0.5, 1.0, 0.2, 1.8, 0.9, 0.1, 0.0]
  }
};