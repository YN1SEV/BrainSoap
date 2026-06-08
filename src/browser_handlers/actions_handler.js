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
    sendMessageWithRetry(tabID, {
      action: "TRIGGER_BLOCK",
      seconds: 3,
      redirectUrl: redirectUrl
    }); 

  }else{
    sendMessageWithRetry(tabID, {
      action: "TRIGGER_BLOCK",
      seconds: 10 
    });
  }
  return;
}


// Usage inside your showImage function:
async function showImage(imagePath) {
  const tabID = await getActiveTabId();
  freezeTab(tabID);
  
  try {
    await sendMessageWithRetry(tabID, {
      action: "TRIGGER_BLOCK",
      imagePath: imagePath
    });
  } catch (error) {
    console.error("Message failed after multiple attempts:", error);
  }
}