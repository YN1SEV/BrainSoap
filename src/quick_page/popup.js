function updateStats(streak, minutes) {
    document.getElementById("display-streak").textContent = `${streak} Streak`;
    document.getElementById("display-time").textContent = `${minutes} min left`;
  
}
updateStats(7, 12);
