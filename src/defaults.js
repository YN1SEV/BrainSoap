// default settings on install
const defaultSettings = {
  exist: true, // flag to check if user deleted browser data
  theme: "light", // make this browser default
  notificationsEnabled: true, // note to self: change to false
  limit: 5, // TODO: make this per domain
  // save all the dommscrolling sites
  urls: ["youtube.com/shorts", "instagram.com/reels", "tiktok.com"] // no trailing backslash, no http, no www, just the domain and first path segment
};