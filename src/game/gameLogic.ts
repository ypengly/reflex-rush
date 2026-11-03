import {
  TOTAL_ROUNDS,
  type GameAction,
  type GameState,
  type RoundResult,
} from './gameTypes';
import { scoreForFalseStart, scoreForReaction } from './scoring';
import { calcReactionMs } from './timing';

export const CANCEL_NOTICE =
  'Round cancelled because the tab was hidden. This round was not counted.';

export const initialGameState: GameState = {
  phase: 'idle',
  round: 1,
  results: [],
  goStartedAt: null,
  roundToken: 0,
  autoAdvance: true,
  notice: null,
};

/**
 * Pure state machine for a session.
 *
 * idle → ready → waiting → go → result ─┐
 *                    └──→ falseStart ───┴→ ready (next round) … → gameOver → ready (play again)
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': {
      if (state.phase !== 'idle' && state.phase !== 'gameOver') return state;
      return {
        ...initialGameState,
        phase: 'ready',
        roundToken: state.roundToken + 1,
      };
    }

    case 'BEGIN_WAIT': {
      if (state.phase !== 'ready' || !state.autoAdvance) return state;
      return { ...state, phase: 'waiting', roundToken: state.roundToken + 1, notice: null };
    }

    case 'SIGNAL': {
      if (state.phase !== 'waiting' || action.token !== state.roundToken) return state;
      return { ...state, phase: 'go', goStartedAt: action.now };
    }

    case 'INPUT': {
      // Never complete the same round twice.
      if (state.results.some((r) => r.round === state.round)) return state;

      if (state.phase === 'go') {
        if (state.goStartedAt === null) return state;
        const reactionMs = calcReactionMs(state.goStartedAt, action.now);
        const result: RoundResult = {
          round: state.round,
          kind: 'valid',
          reactionMs,
          score: scoreForReaction(reactionMs),
        };
        return { ...state, phase: 'result', results: [...state.results, result], goStartedAt: null };
      }

      if (state.phase === 'waiting') {
        const result: RoundResult = {
          round: state.round,
          kind: 'falseStart',
          reactionMs: null,
          score: scoreForFalseStart(),
        };
        return {
          ...state,
          phase: 'falseStart',
          results: [...state.results, result],
          goStartedAt: null,
          roundToken: state.roundToken + 1,
        };
      }

      return state;
    }

    case 'NEXT': {
      if (state.phase !== 'result' && state.phase !== 'falseStart') return state;
      if (state.results.length >= TOTAL_ROUNDS) {
        return { ...state, phase: 'gameOver', goStartedAt: null };
      }
      return {
        ...state,
        phase: 'ready',
        round: state.round + 1,
        goStartedAt: null,
        autoAdvance: true,
        notice: null,
      };
    }

    case 'CANCEL': {
      if (state.phase !== 'ready' && state.phase !== 'waiting' && state.phase !== 'go') return state;
      return {
        ...state,
        phase: 'ready',
        goStartedAt: null,
        autoAdvance: false,
        roundToken: state.roundToken + 1,
        notice: CANCEL_NOTICE,
      };
    }

    case 'RESTART_ROUND': {
      if (state.phase !== 'ready' || state.autoAdvance) return state;
      return { ...state, autoAdvance: true, notice: null };
    }

    case 'RESET': {
      return { ...initialGameState, roundToken: state.roundToken + 1 };
    }

    default:
      return state;
  }
}

/** Short text for the screen-reader live region. */
export function describeState(state: GameState): string {
  const last = state.results[state.results.length - 1];
  switch (state.phase) {
    case 'idle':
      return '';
    case 'ready':
      return state.notice ?? `Round ${state.round} of ${TOTAL_ROUNDS}. Get ready.`;
    case 'waiting':
      return 'Wait for green.';
    case 'go':
      return 'Go! Click, tap or press Space now.';
    case 'result':
      return last && last.reactionMs !== null
        ? `Round ${last.round}: ${last.reactionMs} milliseconds. Score ${last.score}.`
        : '';
    case 'falseStart':
      return last
        ? `Round ${last.round}: false start. Penalty of 250 points. This round is not a valid measurement.`
        : '';
    case 'gameOver':
      return 'Session complete. Review your summary.';
  }
}
