
const storageAPI = (typeof browser !== 'undefined') ? browser.storage.local : chrome.storage.local;

const focusCheckbox = document.getElementById('toggle-focus');
const pauseCheckbox = document.getElementById('toggle-pause');

// 1. Zustand laden (Simpel und direkt)
async function readState() {
    const data = await storageAPI.get(['focusMode', 'paused']);
    focusCheckbox.checked = !!data.focusMode;
    pauseCheckbox.checked = !!data.paused;
}

// 2. Zustand speichern (Zentralisiert)
function saveState() {
    storageAPI.set({
        focusMode: focusCheckbox.checked,
        paused: pauseCheckbox.checked
    });
}

// 3. Die "Gegenseitiger Ausschluss"-Logik (Dumm und effektiv)
focusCheckbox.addEventListener('change', () => {
    if (focusCheckbox.checked) pauseCheckbox.checked = false; // Wenn ich aktiv, mach den anderen aus
    saveState();
});

pauseCheckbox.addEventListener('change', () => {
    if (pauseCheckbox.checked) focusCheckbox.checked = false; // Wenn ich aktiv, mach den anderen aus
    saveState();
});

// Initialisieren
readState();