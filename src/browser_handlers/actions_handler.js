async function redirectTo(url) {
  try {
    await browser.tabs.update({url: url, loadReplace: false});
  } catch (e) {
    console.error("Error occurred while redirecting:", e);
  }
}

async function sendMessage(title, content, name) {
    try {
        browser.notifications.create(name, {
        "type": "basic",
        "iconUrl": browser.runtime.getURL("icons/icon128.png"),
        "title": title,
        "message": content
        });
    }catch (e) {
    console.error("Error occurred while sending message:", e);
    }
}

async function showBlocker(redirectUrl = null) {
  const tabID = await getActiveTabId();
  freezeTab(tabID);
  if(redirectUrl)
  {
    browser.tabs.sendMessage(tabID, {
      action: "TRIGGER_BLOCK",
      seconds: 1,
      redirectUrl: redirectUrl
    });
  }else{
    browser.tabs.sendMessage(tabID, {
      action: "TRIGGER_BLOCK",
      seconds: 10 
    });
  }
  return;
}
