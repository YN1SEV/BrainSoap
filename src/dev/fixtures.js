const NAMES = ["empty", "casual", "power", "streak", "broken-streak", "overflow", "stress-test"];

window.bs = {
  list: () => console.log("bs.load:", NAMES.join(", ")),

  async load(name) {
    const data = await (await fetch(new URL(`./fixtures/${name}.json`, import.meta.url))).json();
    await chrome.storage.sync.set(data.sync);
    await chrome.storage.local.set(data.local);
    location.reload();
  },
};
