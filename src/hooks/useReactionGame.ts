import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { describeState, gameReducer, initialGameState } from '../game/gameLogic';
import {
  TOTAL_ROUNDS,
  type PersonalRecords,
  type SessionOutcome,
} from '../game/gameTypes';
import { summarizeSession } from '../game/scoring';
import {
  READY_DELAY_MS,
  createTimeoutManager,
  nowMs,
  randomDelayMs,
} from '../game/timing';
import { createSoundPlayer } from '../utils/sound';
import {
  applySession,
  emptyRecords,
  loadRecords,
  resetRecords,
  saveRecords,
} from '../utils/storage';

interface UseReactionGameOptions {
  soundEnabled: boolean;
}

export function useReactionGame({ soundEnabled }: UseReactionGameOptions) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [records, setRecords] = useState<PersonalRecords>(() => loadRecords());
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [timers] = useState(createTimeoutManager);
  const [player] = useState(createSoundPlayer);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const summary = useMemo(() => summarizeSession(state.results), [state.results]);

  // Short preparation pause, then the arena turns red.
  useEffect(() => {
    if (state.phase !== 'ready' || !state.autoAdvance) return;
    timers.set(() => dispatch({ type: 'BEGIN_WAIT' }), READY_DELAY_MS);
    return () => timers.clear();
  }, [state.phase, state.autoAdvance, state.round, timers]);

  // Random wait, then the green signal. The start timestamp is captured inside the timer
  // callback itself, so React render timing never shifts the measured reaction window.
  useEffect(() => {
    if (state.phase !== 'waiting') return;
    const token = state.roundToken;
    timers.set(() => dispatch({ type: 'SIGNAL', token, now: nowMs() }), randomDelayMs());
    return () => timers.clear();
  }, [state.phase, state.roundToken, timers]);

  // Never leave timers behind after unmounting.
  useEffect(() => () => timers.clear(), [timers]);

  // A hidden tab cannot produce a trustworthy measurement: invalidate the round.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') dispatch({ type: 'CANCEL' });
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Space bar. Only intercepted while a round is live so focused buttons keep working elsewhere.
  useEffect(() => {
    if (state.phase !== 'waiting' && state.phase !== 'go') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      event.preventDefault();
      if (event.repeat) return;
      dispatch({ type: 'INPUT', now: nowMs() });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.phase]);

  // Optional sound feedback (silent unless enabled).
  useEffect(() => {
    if (!soundEnabledRef.current) return;
    if (state.phase === 'go') player.play('go');
    else if (state.phase === 'result') player.play('success');
    else if (state.phase === 'falseStart') player.play('falseStart');
    else if (state.phase === 'gameOver' && outcome && (outcome.newBestAverage || outcome.newBestScore)) {
      player.play('personalBest');
    }
  }, [state.phase, outcome, player]);

  const start = useCallback(() => {
    // Played here (inside the click handler) so mobile browsers allow audio to start.
    if (soundEnabledRef.current) player.play('start');
    setOutcome(null);
    dispatch({ type: 'START' });
  }, [player]);

  const handleInput = useCallback(() => {
    dispatch({ type: 'INPUT', now: nowMs() });
  }, []);

  const next = useCallback(() => {
    if (state.phase !== 'result' && state.phase !== 'falseStart') return;
    if (state.results.length >= TOTAL_ROUNDS) {
      const result = applySession(records, summarizeSession(state.results));
      if (result.records !== records) saveRecords(result.records);
      setRecords(result.records);
      setOutcome(result);
    }
    dispatch({ type: 'NEXT' });
  }, [state.phase, state.results, records]);

  const restartRound = useCallback(() => dispatch({ type: 'RESTART_ROUND' }), []);

  const backToIdle = useCallback(() => {
    setOutcome(null);
    dispatch({ type: 'RESET' });
  }, []);

  const clearRecords = useCallback(() => {
    resetRecords();
    setRecords({ ...emptyRecords });
    setOutcome(null);
  }, []);

  return {
    state,
    summary,
    records,
    outcome,
    announcement: describeState(state),
    start,
    handleInput,
    next,
    restartRound,
    backToIdle,
    clearRecords,
  };
}
