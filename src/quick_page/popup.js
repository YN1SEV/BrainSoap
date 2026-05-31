function updateStats(streak, minutes, points) {
    document.getElementById("displayStreak").textContent = `${streak} Streak`;
    document.getElementById("displayTime").textContent = `${minutes} min left`;
  
}
updateStats(7, 12, 340);
document.getElementById("timeBar").style.width = "60%";
 
//---------------------- Eigentlicher Beginn

const dashboardBtn = document.getElementById('dashboardOpen');
const settingsBtn = document.querySelector('.icon-btn');

dashboardBtn.addEventListener('click', () => {
    browser.tabs.create({
        url: browser.runtime.getURL('/src/dashboard/index.html#/home')
    });
});

settingsBtn.addEventListener('click', () => {
    browser.tabs.create({
        url: browser.runtime.getURL('/src/dashboard/index.html#/settings')
    });
});