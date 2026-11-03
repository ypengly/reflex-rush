export const TOTAL_ROUNDS = 5;

export type GamePhase =
  | 'idle'
  | 'ready'
  | 'waiting'
  | 'go'
  | 'result'
  | 'falseStart'
  | 'gameOver';

export type RoundKind = 'valid' | 'falseStart';

export interface RoundResult {
  /** 1-based round number. */
  round: number;
  kind: RoundKind;
  /** Reaction time in whole milliseconds, or null when the round is not a valid measurement. */
  reactionMs: number | null;
  score: number;
}

export interface GameState {
  phase: GamePhase;
  /** 1-based number of the round currently being played. */
  round: number;
  results: RoundResult[];
  /** `performance.now()` timestamp captured when the green signal became active. */
  goStartedAt: number | null;
  /** Identifier of the current round attempt; stale timer callbacks carry an old token and are ignored. */
  roundToken: number;
  /** Whether the "ready" phase advances to "waiting" on its own. */
  autoAdvance: boolean;
  notice: string | null;
}

export type GameAction =
  | { type: 'START' }
  | { type: 'BEGIN_WAIT' }
  | { type: 'SIGNAL'; token: number; now: number }
  | { type: 'INPUT'; now: number }
  | { type: 'NEXT' }
  | { type: 'CANCEL' }
  | { type: 'RESTART_ROUND' }
  | { type: 'RESET' };

export interface SessionSummary {
  totalScore: number;
  validCount: number;
  falseStarts: number;
  averageMs: number | null;
  fastestMs: number | null;
  slowestMs: number | null;
}

export interface PersonalRecords {
  bestAverageMs: number | null;
  bestScore: number | null;
}

export interface Settings {
  soundEnabled: boolean;
  reduceMotion: boolean;
}

export interface SessionOutcome {
  summary: SessionSummary;
  previous: PersonalRecords;
  records: PersonalRecords;
  newBestAverage: boolean;
  newBestScore: boolean;
  /** True when no record existed before this session. */
  firstRecord: boolean;
}
