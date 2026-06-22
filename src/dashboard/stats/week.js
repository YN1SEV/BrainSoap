
function initWeekStats(data) {
  // Update week-summary values (total hours)
  const totalFocus = (data.chart.focus || []).reduce((a, b) => a + b, 0);
  const totalScroll = (data.chart.scroll || []).reduce((a, b) => a + b, 0);

  const vals = document.querySelectorAll(".week-summary .stat-value");
  if (vals && vals.length >= 2) {
    vals[0].textContent = `${totalFocus.toFixed(1)} h`;
    vals[1].textContent = `${totalScroll.toFixed(1)} h`;
  }

  new Chart(document.querySelector("#week-canvas"), {
    type: "line",
    data: {
      labels: getRotatedWeekLabels(),
      datasets: [
        { label: "Focus-Time",  data: data.sampleFocus,  borderColor: "#2563eb", fill: false },
        { label: "Scroll-Time", data: data.sampleScroll, borderColor: "#ef4444", fill: false },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function getRotatedWeekLabels() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayIndex = new Date().getDay();
  return [
    ...days.slice(todayIndex + 1),
    ...days.slice(0, todayIndex + 1),
  ];
}

// Set the week delta percentages for focus and scroll.
// Usage: setWeekDeltas(-15, 20)
function setWeekDeltas(focusPercent, scrollPercent) {
  
  let sign = focusPercent > 0 ? '+' : '';
  document.getElementById('focus-delta').textContent = `${sign}${focusPercent}% this week`;
  
  sign = scrollPercent > 0 ? '+' : '';
  document.getElementById('scroll-delta').textContent = `${sign}${scrollPercent}% this week`;
}

// Example
document.addEventListener('DOMContentLoaded', () => {
  initWeekStats(sampleUsageStats);
  setWeekDeltas(-15, 20);
});