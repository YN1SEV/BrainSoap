// Display all-time statistics from Backend data

function renderAllTimeStats(stats) {
  const mapping = {
    "focus-hours": stats.focusHours,
    "focus-sessions": stats.focusSessions,
    "scroll-hours": stats.scrollHours,
    "scroll-attempts": stats.scrollAttempts,
    "scrolls-blocked": stats.scrollBlocks,
    "best-streak": stats.bestStreak,
    "sites-blocked": stats.blockedSites,
    "active-days": stats.activeDays
  };

  for (const [elementId, value] of Object.entries(mapping)) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }
}

// Initialize with sample data
document.addEventListener('DOMContentLoaded', () => {
  renderAllTimeStats(sampleUsageStats);
});