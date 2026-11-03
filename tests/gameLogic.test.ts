import { describe, expect, it } from 'vitest';
import {
  CANCEL_NOTICE,
  describeState,
  gameReducer,
  initialGameState,
} from '../src/game/gameLogic';
import { TOTAL_ROUNDS, type GameAction, type GameState } from '../src/game/gameTypes';

const run = (actions: GameAction[], from: GameState = initialGameState) =>
  actions.reduce(gameReducer, from);

function toGo(from: GameState, goAt = 1000): GameState {
  const waiting = gameReducer(from, { type: 'BEGIN_WAIT' });
  return gameReducer(waiting, { type: 'SIGNAL', token: waiting.roundToken, now: goAt });
}

function playValid(from: GameState, ms: number): GameState {
  return gameReducer(toGo(from, 1000), { type: 'INPUT', now: 1000 + ms });
}

describe('state transitions', () => {
  it('starts in idle', () => {
    expect(initialGameState.phase).toBe('idle');
  });

  it('moves idle → ready → waiting → go', () => {
    let state = gameReducer(initialGameState, { type: 'START' });
    expect(state).toMatchObject({ phase: 'ready', round: 1, results: [] });
    state = gameReducer(state, { type: 'BEGIN_WAIT' });
    expect(state.phase).toBe('waiting');
    state = gameReducer(state, { type: 'SIGNAL', token: state.roundToken, now: 2000 });
    expect(state).toMatchObject({ phase: 'go', goStartedAt: 2000 });
  });

  it('completes a valid reaction', () => {
    const state = playValid(gameReducer(initialGameState, { type: 'START' }), 250);
    expect(state.phase).toBe('result');
    expect(state.results).toEqual([{ round: 1, kind: 'valid', reactionMs: 250, score: 900 }]);
  });

  it('turns an early input into a false start worth -250', () => {
    const waiting = run([{ type: 'START' }, { type: 'BEGIN_WAIT' }]);
    const state = gameReducer(waiting, { type: 'INPUT', now: 500 });
    expect(state.phase).toBe('falseStart');
    expect(state.results).toEqual([{ round: 1, kind: 'falseStart', reactionMs: null, score: -250 }]);
  });

  it('ignores a pending green signal after a false start', () => {
    const waiting = run([{ type: 'START' }, { type: 'BEGIN_WAIT' }]);
    const staleToken = waiting.roundToken;
    const falseStart = gameReducer(waiting, { type: 'INPUT', now: 500 });
    const after = gameReducer(falseStart, { type: 'SIGNAL', token: staleToken, now: 900 });
    expect(after).toBe(falseStart);
  });

  it('lets the player continue after a false start', () => {
    const waiting = run([{ type: 'START' }, { type: 'BEGIN_WAIT' }, { type: 'INPUT', now: 500 }]);
    const state = gameReducer(waiting, { type: 'NEXT' });
    expect(state).toMatchObject({ phase: 'ready', round: 2 });
  });

  it('progresses through five rounds to game over', () => {
    let state = gameReducer(initialGameState, { type: 'START' });
    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      expect(state).toMatchObject({ phase: 'ready', round });
      state = gameReducer(playValid(state, 250), { type: 'NEXT' });
    }
    expect(state.phase).toBe('gameOver');
    expect(state.results).toHaveLength(TOTAL_ROUNDS);
  });

  it('counts false starts as rounds', () => {
    let state = gameReducer(initialGameState, { type: 'START' });
    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      state = run([{ type: 'BEGIN_WAIT' }, { type: 'INPUT', now: 1 }, { type: 'NEXT' }], state);
    }
    expect(state.phase).toBe('gameOver');
    expect(state.results.every((r) => r.kind === 'falseStart')).toBe(true);
  });
});

describe('input handling', () => {
  it('rejects input in idle, ready, result, falseStart and gameOver', () => {
    const idle = initialGameState;
    const ready = gameReducer(idle, { type: 'START' });
    const result = playValid(ready, 250);
    const falseStart = run([{ type: 'BEGIN_WAIT' }, { type: 'INPUT', now: 1 }], ready);
    let gameOver = ready;
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      gameOver = gameReducer(playValid(gameOver, 250), { type: 'NEXT' });
    }
    for (const state of [idle, ready, result, falseStart, gameOver]) {
      expect(gameReducer(state, { type: 'INPUT', now: 9999 })).toBe(state);
    }
  });

  it('prevents duplicate round completion', () => {
    const done = playValid(gameReducer(initialGameState, { type: 'START' }), 250);
    const again = gameReducer(done, { type: 'INPUT', now: 5000 });
    expect(again).toBe(done);
    expect(again.results).toHaveLength(1);
  });

  it('ignores a signal that carries a stale round token', () => {
    const waiting = run([{ type: 'START' }, { type: 'BEGIN_WAIT' }]);
    expect(gameReducer(waiting, { type: 'SIGNAL', token: waiting.roundToken - 1, now: 5 })).toBe(
      waiting,
    );
  });

  it('only starts a session from idle or game over', () => {
    const ready = gameReducer(initialGameState, { type: 'START' });
    expect(gameReducer(ready, { type: 'START' })).toBe(ready);
  });
});

describe('cancelling, resetting and replaying', () => {
  it('invalidates a round when the tab is hidden and waits for a manual restart', () => {
    const go = toGo(gameReducer(initialGameState, { type: 'START' }));
    const cancelled = gameReducer(go, { type: 'CANCEL' });
    expect(cancelled).toMatchObject({
      phase: 'ready',
      round: 1,
      autoAdvance: false,
      goStartedAt: null,
      notice: CANCEL_NOTICE,
    });
    expect(cancelled.results).toHaveLength(0);
    // The paused round does not start on its own.
    expect(gameReducer(cancelled, { type: 'BEGIN_WAIT' })).toBe(cancelled);
    const restarted = gameReducer(cancelled, { type: 'RESTART_ROUND' });
    expect(restarted).toMatchObject({ autoAdvance: true, notice: null });
    expect(gameReducer(restarted, { type: 'BEGIN_WAIT' }).phase).toBe('waiting');
  });

  it('ignores a cancel outside a live round', () => {
    expect(gameReducer(initialGameState, { type: 'CANCEL' })).toBe(initialGameState);
  });

  it('resets to idle without keeping old results', () => {
    const state = gameReducer(playValid(gameReducer(initialGameState, { type: 'START' }), 250), {
      type: 'RESET',
    });
    expect(state).toMatchObject({ phase: 'idle', round: 1, results: [] });
  });

  it('can replay after game over with a clean session', () => {
    let state = gameReducer(initialGameState, { type: 'START' });
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      state = gameReducer(playValid(state, 250), { type: 'NEXT' });
    }
    expect(state.phase).toBe('gameOver');
    const replay = gameReducer(state, { type: 'START' });
    expect(replay).toMatchObject({ phase: 'ready', round: 1, results: [] });
    expect(replay.roundToken).toBeGreaterThan(state.roundToken);
  });
});

describe('describeState', () => {
  it('describes each phase for assistive technology', () => {
    const ready = gameReducer(initialGameState, { type: 'START' });
    expect(describeState(initialGameState)).toBe('');
    expect(describeState(ready)).toContain('Round 1 of 5');
    expect(describeState(gameReducer(ready, { type: 'BEGIN_WAIT' }))).toContain('Wait for green');
    expect(describeState(toGo(ready))).toContain('Go');
    expect(describeState(playValid(ready, 247))).toContain('247 milliseconds');
    expect(
      describeState(run([{ type: 'BEGIN_WAIT' }, { type: 'INPUT', now: 1 }], ready)),
    ).toContain('false start');
  });
});
