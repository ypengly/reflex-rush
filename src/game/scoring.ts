import type { RoundResult, SessionSummary } from './gameTypes';

export const BASE_SCORE = 1000;
export const REFERENCE_MS = 200;
export const POINTS_PER_MS = 2;
export const FALSE_START_PENALTY = 250;

export const FALSE_START_MESSAGE = 'False Start — Stay Ready!';

/** roundScore = max(0, 1000 - 2 * max(0, reactionTimeMs - 200)) */
export function scoreForReaction(reactionMs: number): number {
  return Math.max(0, BASE_SCORE - POINTS_PER_MS * Math.max(0, reactionMs - REFERENCE_MS));
}

export function scoreForFalseStart(): number {
  return -FALSE_START_PENALTY;
}

/** Informal, encouraging game feedback. Not a scientific classification. */
export function feedbackForReaction(reactionMs: number): string {
  if (reactionMs <= 230) return 'Lightning Fast!';
  if (reactionMs <= 320) return 'Nice Reaction!';
  return 'Keep Building Your Speed!';
}

export function summarizeSession(results: readonly RoundResult[]): SessionSummary {
  const times = results.flatMap((r) =>
    r.kind === 'valid' && r.reactionMs !== null ? [r.reactionMs] : [],
  );
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const falseStarts = results.filter((r) => r.kind === 'falseStart').length;

  if (times.length === 0) {
    return {
      totalScore,
      validCount: 0,
      falseStarts,
      averageMs: null,
      fastestMs: null,
      slowestMs: null,
    };
  }

  return {
    totalScore,
    validCount: times.length,
    falseStarts,
    averageMs: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    fastestMs: Math.min(...times),
    slowestMs: Math.max(...times),
  };
}
