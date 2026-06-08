



function updateStats(streak, minutes, points) {
    document.getElementById("displayStreak").textContent = `${streak} Streak`;
    document.getElementById("displayTime").textContent = `${minutes} min left`;
    document.getElementById("displayPoints").textContent = `${points} Points`;
}
updateStats(7, 12, 340);
document.getElementById("timeBar").style.width = "60%";