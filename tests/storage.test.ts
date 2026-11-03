import { describe, expect, it } from 'vitest';
import type { SessionSummary } from '../src/game/gameTypes';
import {
  RECORDS_KEY,
  SETTINGS_KEY,
  applySession,
  emptyRecords,
  loadRecords,
  loadSettings,
  parseRecords,
  resetRecords,
  saveRecords,
  saveSettings,
} from '../src/utils/storage';

const summary = (overrides: Partial<SessionSummary> = {}): SessionSummary => ({
  totalScore: 3000,
  validCount: 5,
  falseStarts: 0,
  averageMs: 300,
  fastestMs: 250,
  slowestMs: 350,
  ...overrides,
});

const throwingStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('records persistence', () => {
  it('saves and loads valid records', () => {
    expect(saveRecords({ bestAverageMs: 245, bestScore: 4100 })).toBe(true);
    expect(loadRecords()).toEqual({ bestAverageMs: 245, bestScore: 4100 });
  });

  it('returns empty records when nothing is stored', () => {
    expect(loadRecords()).toEqual(emptyRecords);
  });

  it('recovers from corrupted JSON', () => {
    window.localStorage.setItem(RECORDS_KEY, '{not json');
    expect(loadRecords()).toEqual(emptyRecords);
  });

  it('validates every field of stored data', () => {
    expect(parseRecords('"a string"')).toEqual(emptyRecords);
    expect(parseRecords('[1,2]')).toEqual(emptyRecords);
    expect(parseRecords('{"bestAverageMs":"fast","bestScore":-5}')).toEqual(emptyRecords);
    expect(parseRecords('{"bestAverageMs":0,"bestScore":999999}')).toEqual(emptyRecords);
    expect(parseRecords('{"bestAverageMs":250,"bestScore":"x"}')).toEqual({
      bestAverageMs: 250,
      bestScore: null,
    });
  });

  it('resets saved records', () => {
    saveRecords({ bestAverageMs: 245, bestScore: 4100 });
    expect(resetRecords()).toBe(true);
    expect(window.localStorage.getItem(RECORDS_KEY)).toBeNull();
    expect(loadRecords()).toEqual(emptyRecords);
  });

  it('degrades gracefully when storage is unavailable', () => {
    expect(loadRecords(throwingStorage)).toEqual(emptyRecords);
    expect(saveRecords({ bestAverageMs: 1, bestScore: 1 }, throwingStorage)).toBe(false);
    expect(resetRecords(throwingStorage)).toBe(false);
    expect(loadRecords(null)).toEqual(emptyRecords);
    expect(saveRecords({ bestAverageMs: 1, bestScore: 1 }, null)).toBe(false);
  });
});

describe('applySession', () => {
  it('sets the first record', () => {
    const outcome = applySession(emptyRecords, summary());
    expect(outcome.records).toEqual({ bestAverageMs: 300, bestScore: 3000 });
    expect(outcome).toMatchObject({ newBestAverage: true, newBestScore: true, firstRecord: true });
  });

  it('only improves the records that were beaten', () => {
    const previous = { bestAverageMs: 280, bestScore: 2500 };
    const outcome = applySession(previous, summary());
    expect(outcome.records).toEqual({ bestAverageMs: 280, bestScore: 3000 });
    expect(outcome).toMatchObject({ newBestAverage: false, newBestScore: true, firstRecord: false });
  });

  it('keeps records when the session was worse', () => {
    const previous = { bestAverageMs: 200, bestScore: 4000 };
    const outcome = applySession(previous, summary());
    expect(outcome.records).toBe(previous);
    expect(outcome.newBestAverage || outcome.newBestScore).toBe(false);
  });

  it('never records a session without a valid reaction', () => {
    const outcome = applySession(
      emptyRecords,
      summary({ validCount: 0, averageMs: null, fastestMs: null, slowestMs: null, totalScore: -1250 }),
    );
    expect(outcome.records).toEqual(emptyRecords);
    expect(outcome.newBestAverage).toBe(false);
    expect(outcome.newBestScore).toBe(false);
  });

  it('does not store a non-positive score as a record', () => {
    const outcome = applySession(emptyRecords, summary({ totalScore: -200 }));
    expect(outcome.records.bestScore).toBeNull();
    expect(outcome.records.bestAverageMs).toBe(300);
  });
});

describe('settings persistence', () => {
  const fallback = { soundEnabled: false, reduceMotion: false };

  it('falls back to defaults (sound off) when nothing is stored', () => {
    expect(loadSettings(fallback)).toEqual(fallback);
  });

  it('round-trips saved settings', () => {
    saveSettings({ soundEnabled: true, reduceMotion: true });
    expect(loadSettings(fallback)).toEqual({ soundEnabled: true, reduceMotion: true });
  });

  it('ignores corrupted or wrongly typed values', () => {
    window.localStorage.setItem(SETTINGS_KEY, '{oops');
    expect(loadSettings(fallback)).toEqual(fallback);
    window.localStorage.setItem(SETTINGS_KEY, '{"soundEnabled":"yes","reduceMotion":true}');
    expect(loadSettings(fallback)).toEqual({ soundEnabled: false, reduceMotion: true });
  });
});
