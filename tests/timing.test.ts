import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gameReducer, initialGameState } from '../src/game/gameLogic';
import type { GameState } from '../src/game/gameTypes';
import {
  MAX_DELAY_MS,
  MIN_DELAY_MS,
  calcReactionMs,
  createTimeoutManager,
  nowMs,
  randomDelayMs,
} from '../src/game/timing';

function goState(goAt: number): GameState {
  let state = gameReducer(initialGameState, { type: 'START' });
  state = gameReducer(state, { type: 'BEGIN_WAIT' });
  return gameReducer(state, { type: 'SIGNAL', token: state.roundToken, now: goAt });
}

describe('nowMs', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads the monotonic performance clock', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1234.5);
    expect(nowMs()).toBe(1234.5);
  });
});

describe('randomDelayMs', () => {
  it('stays within 1.5 – 4.5 seconds', () => {
    expect(randomDelayMs(() => 0)).toBe(MIN_DELAY_MS);
    expect(randomDelayMs(() => 1)).toBe(MAX_DELAY_MS);
    expect(randomDelayMs(() => 0.5)).toBe(3000);
    for (let i = 0; i < 100; i++) {
      const delay = randomDelayMs();
      expect(delay).toBeGreaterThanOrEqual(MIN_DELAY_MS);
      expect(delay).toBeLessThanOrEqual(MAX_DELAY_MS);
    }
  });
});

describe('calcReactionMs', () => {
  it('measures from the green timestamp to the input timestamp', () => {
    expect(calcReactionMs(1000, 1247)).toBe(247);
    expect(calcReactionMs(1000.4, 1247.2)).toBe(247);
  });

  it('never returns a negative value', () => {
    expect(calcReactionMs(2000, 1900)).toBe(0);
  });
});

describe('reaction timestamps in the game state', () => {
  it('uses the timestamp captured at the green signal', () => {
    const state = gameReducer(goState(5000), { type: 'INPUT', now: 5321 });
    expect(state.results[0]).toMatchObject({ kind: 'valid', reactionMs: 321 });
  });

  it('keeps the first input and ignores repeated inputs', () => {
    let state = gameReducer(goState(1000), { type: 'INPUT', now: 1300 });
    state = gameReducer(state, { type: 'INPUT', now: 1900 });
    state = gameReducer(state, { type: 'INPUT', now: 2500 });
    expect(state.results).toHaveLength(1);
    expect(state.results[0].reactionMs).toBe(300);
  });

  it('does not create a valid measurement when a round is cancelled', () => {
    const state = gameReducer(goState(1000), { type: 'CANCEL' });
    expect(state.results).toHaveLength(0);
    expect(state.goStartedAt).toBeNull();
    expect(gameReducer(state, { type: 'INPUT', now: 1500 }).results).toHaveLength(0);
  });
});

describe('createTimeoutManager', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs callbacks and forgets finished timers', () => {
    const manager = createTimeoutManager();
    const callback = vi.fn();
    manager.set(callback, 100);
    expect(manager.pending()).toBe(1);
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(manager.pending()).toBe(0);
  });

  it('clears every pending timer so stale callbacks never fire', () => {
    const manager = createTimeoutManager();
    const first = vi.fn();
    const second = vi.fn();
    manager.set(first, 100);
    manager.set(second, 200);
    expect(manager.pending()).toBe(2);
    manager.clear();
    expect(manager.pending()).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });
});
