function getBrowserAPI() {
  if (typeof browser !== "undefined" && browser.runtime) {return browser;}
  if (typeof chrome !== "undefined" && chrome.runtime)   {return chrome;}
  return null;
}

function getExtensionURL(path) {
  const api = getBrowserAPI();
  return api?.runtime?.getURL(path) ?? path;
}

function loadComponent(path, targetId) {
  const target = document.getElementById(targetId);

  if (!target) {
    console.error("Target not found:", targetId);
    return;
  }

  const url = getExtensionURL(path);

  fetch(url).then((res) => {
    if (!res.ok) {throw new Error(`HTTP error ${res.status} for ${url}`);}
    return res.text();
  })
  .then((html) => {target.innerHTML = html;})
  .catch((err) => {console.error("Load error:", path, err);});
}

document.addEventListener("DOMContentLoaded", () => {
  //    /* Home */
  //    loadComponent("widgets/home/home_dummy1.html", "home_dummy1");
  //    loadComponent("widgets/home/home_dummy2.html", "home_dummy2");
  //    loadComponent("widgets/home/home_dummy3.html", "home_dummy3");
  //    
  //    /* Rules */
  //    loadComponent("widgets/rules/rules_timer.html", "rules_timer");
  //    loadComponent("widgets/rules/rules_blacklist.html", "rules_blacklist");
  //    
  //    /* Stats */
  //    loadComponent("widgets/stats/stats_graph.html", "stats_graph");
  //    loadComponent("widgets/stats/stats_heatmap.html", "stats_heatmap");
  //    loadComponent("widgets/stats/stats_all_time.html", "stats_all_time");
  //    loadComponent("widgets/stats/stats_recent.html", "stats_recent");
  //    /* Settings */
  //    loadComponent("widgets/settings/settings_dummy1.html", "settings_dummy1");
});