const dStreak  = document.getElementById("display-streak");
const dTime    = document.getElementById("display-time");
const dTimeBar = document.getElementById("time-bar");


function updateStats(streak, minutes, percentage) {
    dStreak.textContent = `${streak} Streak`;
    dTime.textContent = `${minutes} min left`;
    dTimeBar.style.setProperty("--time-bar-progress", `${percentage*100}%`);
}

updateStats(7, 12, 0.5);
