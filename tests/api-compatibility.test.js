import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";

const originalBrowser = globalThis.browser;

function installBrowser(overrides = {}) {
  globalThis.browser = {
    tabs: {
      query: async () => [{ id: 7 }],
      update: async () => undefined,
      sendMessage: async () => undefined,
      ...(overrides.tabs ?? {})
    },
    scripting: {
      executeScript: async () => undefined,
      ...(overrides.scripting ?? {})
    },
    notifications: {
      create: async () => undefined,
      ...(overrides.notifications ?? {})
    },
    runtime: {
      getURL: (path) => `moz-extension://test/${path}`,
      ...(overrides.runtime ?? {})
    }
  };
}

afterEach(() => {
  globalThis.browser = originalBrowser;
});

describe("Firefox Android browser API compatibility", () => {
  it("pauses media even when tab muting is unsupported", async () => {
    const updates = [];
    let pauseMessage;
    installBrowser({
      tabs: {
        update: async (...args) => {
          updates.push(args);
          throw new Error("muted is unsupported");
        },
        sendMessage: async (_tabId, message) => {
          pauseMessage = message;
        }
      }
    });

    const { freezeTab } = await import("../src/browser/tabs.js");
    await freezeTab(7);

    assert.deepEqual(updates, []);
    assert.deepEqual(pauseMessage, { action: "PAUSE_MEDIA" });
  });

  it("falls back to scripting when the content script is not ready", async () => {
    let scriptOptions;
    installBrowser({
      tabs: {
        sendMessage: async () => {
          throw new Error("receiving end does not exist");
        }
      },
      scripting: {
        executeScript: async (options) => {
          scriptOptions = options;
        }
      }
    });

    const { freezeTab } = await import("../src/browser/tabs.js");
    await freezeTab(7);

    assert.equal(scriptOptions.target.tabId, 7);
    assert.equal(typeof scriptOptions.func, "function");
  });

  it("redirects without the Android-unsupported loadReplace option", async () => {
    let updateArguments;
    installBrowser({
      tabs: {
        update: async (...args) => {
          updateArguments = args;
        }
      }
    });

    const { redirectTo } = await import("../src/browser/actions.js");
    await redirectTo("example.com");

    assert.deepEqual(updateArguments, [{ url: "https://example.com" }]);
  });

  it("redirects the explicit event tab without querying the active tab", async () => {
    let updateArguments;
    installBrowser({
      tabs: {
        update: async (...args) => {
          updateArguments = args;
        },
        query: async () => {
          throw new Error("active tab query unavailable");
        }
      }
    });

    const { redirectTo } = await import("../src/browser/actions.js");
    await redirectTo("example.com", 42);

    assert.deepEqual(updateArguments, [42, { url: "https://example.com" }]);
  });

  it("uses a packaged icon and awaits notification creation", async () => {
    let notificationArguments;
    installBrowser({
      notifications: {
        create: async (...args) => {
          notificationArguments = args;
        }
      }
    });

    const { sendMessage } = await import("../src/browser/actions.js");
    await sendMessage("Title", "Content", "limit-notify");

    assert.equal(notificationArguments[0], "limit-notify");
    assert.equal(notificationArguments[1].iconUrl, "moz-extension://test/assets/icons/icon128.png");
  });

});
