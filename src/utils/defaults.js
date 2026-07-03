export const defaultSettings = {
  exist: true,                 // flag to check if user deleted browser data
  theme: "light",
  notificationsEnabled: true,
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
    imagePath: "assets/visuals/stop.png",
    items: [
      { name: "YouTube", url: "youtube.com", active: true },
      { name: "Netflix", url: "netflix.com", active: true },
      { name: "Reddit",  url: "reddit.com",  active: true },
    ],
  },
];
