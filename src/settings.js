// Initialize components

const usernameInput = document.getElementById('username');
const notifyCheckbox = document.getElementById('notifications');
const themeSelect = document.getElementById('theme');
const saveBtn = document.getElementById('save');
const statusMsg = document.getElementById('status');

// 1. Load values from browser storage when popup opens
document.addEventListener('DOMContentLoaded', () => {
  // Pass an object with default values in case keys don't exist yet
  chrome.storage.sync.get({
    theme: 'light'
  }, (items) => {
    themeSelect.value = items.theme;
  });
});

// 2. Save/Update values to browser storage
saveBtn.addEventListener('click', () => {
  const settings = {
    theme: themeSelect.value
  };

  browser.storage.sync.set(settings, () => {
    // Update status to let user know options were saved.
    statusMsg.textContent = 'Settings saved!';
    
    // Clear message after 2 seconds
    setTimeout(() => {
      statusMsg.textContent = '';
    }, 2000);
  });
});