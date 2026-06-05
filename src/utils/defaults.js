// default settings on install
const defaultSettings = {
  exist: true, // flag to check if user deleted browser data
  theme: "light", // make this browser default
  notificationsEnabled: true, // note to self: change to false
  
  // available actions: "notify" = message, "popup" = popup window, "redirect":url = redirect to a different page
  timers: {"default": {"limit": 5, "actions": ["notify", "popup", "redirect"], "redirectUrl": "https://www.linkedin.com/jobs/"},
            "example1": {"limit": 5, "actions": ["image"], "imagePath": "assets/visuals/stop.png"},
            },

  timerMap: {"youtube.com/shorts": ["example1"],
              "instagram.com/reels": ["example1"],
              "tiktok.com": ["default"],
              "engage.cloud.microsoft/main":["default"]
  }
};