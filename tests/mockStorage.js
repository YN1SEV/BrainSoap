import { mock } from 'bun:test';

export class StorageAreaMock {
  constructor() {
    this.state = {};
    this.shouldFail = false;
  }

  get = mock(async (keys) => {
    if (this.shouldFail) throw new Error('Storage read error');
    if (keys === null) return { ...this.state };
    if (typeof keys === 'string') return { [keys]: this.state[keys] };
    return this.state;
  });

  set = mock(async (items) => {
    if (this.shouldFail) throw new Error('Storage write error');
    Object.assign(this.state, items);
  });

  remove = mock(async (keys) => {
    if (this.shouldFail) throw new Error('Storage delete error');
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach((k) => delete this.state[k]);
  });

  clear() {
    this.state = {};
    this.shouldFail = false;
  }
}

// Global setup helper
export const localStorage = new StorageAreaMock();
export const syncStorage = new StorageAreaMock();
let changeListener = null;

const chromeMock = {
  storage: {
    local: localStorage,
    sync: syncStorage,
    onChanged: {
      addListener: mock((listener) => {
        changeListener = listener;
      })
    }
  }
};

// Set globals on execution so they exist before StorageManager imports
globalThis.chrome = chromeMock;
globalThis.browser = chromeMock;

export function triggerStorageChange(changes, areaName) {
  if (changeListener) changeListener(changes, areaName);
}