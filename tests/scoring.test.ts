import { describe, expect, it } from 'vitest';
import type { RoundResult } from '../src/game/gameTypes';
import {
  FALSE_START_PENALTY,
  feedbackForReaction,
  scoreForFalseStart,
  scoreForReaction,
  summarizeSession,
} from '../src/game/scoring';

const valid = (round: number, ms: number): RoundResult => ({
  round,
  kind: 'valid',
  reactionMs: ms,
  score: scoreForReaction(ms),
});
const falseStart = (round: number): RoundResult => ({
  round,
  kind: 'falseStart',
  reactionMs: null,
  score: scoreForFalseStart(),
});

describe('scoreForReaction', () => {
  it('gives 1000 points at the 200 ms reference', () => {
    expect(scoreForReaction(200)).toBe(1000);
  });

  it('subtracts 2 points per millisecond above 200 ms', () => {
    expect(scoreForReaction(250)).toBe(900);
    expect(scoreForReaction(300)).toBe(800);
  });

  it('never exceeds 1000 for times below 200 ms', () => {
    expect(scoreForReaction(150)).toBe(1000);
    expect(scoreForReaction(0)).toBe(1000);
  });

  it('clamps at zero', () => {
    expect(scoreForReaction(700)).toBe(0);
    expect(scoreForReaction(5000)).toBe(0);
  });
});

describe('false start', () => {
  it('scores -250', () => {
    expect(FALSE_START_PENALTY).toBe(250);
    expect(scoreForFalseStart()).toBe(-250);
  });
});

describe('feedbackForReaction', () => {
  it('returns encouraging messages', () => {
    expect(feedbackForReaction(210)).toBe('Lightning Fast!');
    expect(feedbackForReaction(280)).toBe('Nice Reaction!');
    expect(feedbackForReaction(450)).toBe('Keep Building Your Speed!');
  });
});

describe('summarizeSession', () => {
  it('sums five round scores and computes statistics', () => {
    const results = [200, 250, 300, 400, 600].map((ms, i) => valid(i + 1, ms));
    expect(summarizeSession(results)).toEqual({
      totalScore: 1000 + 900 + 800 + 600 + 200,
      validCount: 5,
      falseStarts: 0,
      averageMs: 350,
      fastestMs: 200,
      slowestMs: 600,
    });
  });

  it('keeps false starts out of the reaction statistics', () => {
    const results = [valid(1, 250), falseStart(2), valid(3, 350), falseStart(4), valid(5, 300)];
    const summary = summarizeSession(results);
    expect(summary.validCount).toBe(3);
    expect(summary.falseStarts).toBe(2);
    expect(summary.averageMs).toBe(300);
    expect(summary.fastestMs).toBe(250);
    expect(summary.slowestMs).toBe(350);
    expect(summary.totalScore).toBe(900 + 700 + 800 - 500);
  });

  it('reports no averages when there are no valid reactions', () => {
    const summary = summarizeSession([1, 2, 3, 4, 5].map(falseStart));
    expect(summary.validCount).toBe(0);
    expect(summary.averageMs).toBeNull();
    expect(summary.fastestMs).toBeNull();
    expect(summary.slowestMs).toBeNull();
    expect(summary.totalScore).toBe(-1250);
  });
});
