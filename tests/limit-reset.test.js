import { describe, test, expect } from 'bun:test';
import { localStorage, syncStorage } from './mock-storage.js';
import { defaultSettings } from '../src/utils/defaults.js';
import { getNewCategoryDefaults } from '../src/services/settings-service.js';
import {
  LIMIT_RESET_MODES,
  categoryUsedSeconds,
  normalizeLimitResetMode,
  resetCategoryUsage,
  shouldResetAfterBlock,
} from '../src/services/timer-service.js';
import { toLocalDateKey } from '../src/utils/time.js';

describe('per-category limit reset behavior', () => {
  test('normalizes the global default and legacy daily spelling', () => {
    expect(defaultSettings.defaultLimitResetMode).toBe(LIMIT_RESET_MODES.LOCAL_MIDNIGHT);
    expect(normalizeLimitResetMode('dayly')).toBe(LIMIT_RESET_MODES.LOCAL_MIDNIGHT);
    expect(normalizeLimitResetMode('daily')).toBe(LIMIT_RESET_MODES.LOCAL_MIDNIGHT);
    expect(normalizeLimitResetMode('after-block')).toBe(LIMIT_RESET_MODES.AFTER_BLOCK);
  });

  test('new category defaults expose the global reset mode', async () => {
    localStorage.clear();
    syncStorage.clear();
    const defaults = await getNewCategoryDefaults();

    expect(defaults.resetMode).toBe(defaultSettings.defaultLimitResetMode);
  });

  test('only the category that reset is removed from usage', () => {
    const log = {
      Social: { usedSeconds: 1900, date: '2026-10-14' },
      Video: { usedSeconds: 3600, date: '2026-10-14' },
    };

    expect(resetCategoryUsage(log, 'Social')).toEqual({
      Video: { usedSeconds: 3600, date: '2026-10-14' },
    });
    expect(log.Social.usedSeconds).toBe(1900);
  });

  test('after-block applies only to non-focus mode categories', () => {
    expect(shouldResetAfterBlock({ resetMode: 'after-block' })).toBe(true);
    expect(shouldResetAfterBlock({ resetMode: 'local-midnight' })).toBe(false);
    expect(shouldResetAfterBlock({ resetMode: 'after-block' }, true)).toBe(false);
    expect(shouldResetAfterBlock({})).toBe(false);
  });

  test('category usage is valid only for the current local date key', () => {
    const date = new Date(2026, 9, 14, 23, 30);
    const localDate = toLocalDateKey(date);
    const log = { Social: { usedSeconds: 120, date: localDate } };

    expect(categoryUsedSeconds(log, 'Social', localDate)).toBe(120);
    expect(categoryUsedSeconds(log, 'Social', '2026-10-15')).toBe(0);
  });
});