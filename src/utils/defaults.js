export const defaultSettings = {
  exist: true,                 // flag to check if user deleted browser data
  theme: "system",             // "system" | "light" | "dark"
  notificationsEnabled: true,
  refreshSeconds: 10,          // how often the dashboard re-reads stats/rules
  newCategoryDefaults: {
    maxTime: 60,               // default time limit (minutes) for a new category
    actions: ["popup"],        // "popup" | "redirect" | "notify"
    redirectUrl: "",           // used when action includes "redirect"
  },
};

export const defaultBlacklist = [
  {
    timerName: "Social Media",
    maxTime: 30,
    actions: ["notify", "popup", "redirect"],
    redirectUrl: "https://www.linkedin.com/jobs/",
    items: [
      { name: "Instagram", url: "instagram.com", active: true },
      { name: "TikTok",    url: "tiktok.com",    active: true },
      { name: "Facebook",  url: "facebook.com",  active: false },
      { name: "Reddit",    url: "reddit.com",    active: true },
    ],
  },
  {
    timerName: "Entertainment",
    maxTime: 60,
    actions: ["image"],
    imagePath: "assets/visuals/Stopper_plain.svg",
    items: [
      { name: "YouTube", url: "youtube.com", active: true },
      { name: "Netflix", url: "netflix.com", active: true },
      { name: "Reddit",  url: "reddit.com",  active: true },
    ],
  },
];
