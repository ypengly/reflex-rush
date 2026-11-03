import { ArrowLeft, Play, Trophy } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
  TOTAL_ROUNDS,
  type SessionOutcome,
  type SessionSummary as SessionStats,
} from '../game/gameTypes';
import { formatMs, formatScore } from '../utils/formatTime';
import { ResetRecordsButton } from './ResetRecordsButton';

interface SessionSummaryProps {
  summary: SessionStats;
  outcome: SessionOutcome | null;
  onPlayAgain: () => void;
  onHome: () => void;
  onResetRecords: () => void;
}

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  angle: Math.round((360 / 14) * i),
  distance: 90 + (i % 3) * 30,
  color: ['var(--lime)', 'var(--cyan)', 'var(--violet)'][i % 3],
}));

function celebrationMessage(outcome: SessionOutcome | null): string | null {
  if (!outcome || (!outcome.newBestAverage && !outcome.newBestScore)) return null;
  if (outcome.firstRecord) return 'First record set — now beat it!';
  if (outcome.newBestAverage && outcome.newBestScore) {
    return 'New personal best: average time and score!';
  }
  return outcome.newBestAverage
    ? 'New personal best average reaction time!'
    : 'New personal best score!';
}

function describeDifference(current: number, previous: number): string {
  const diff = Math.round(current - previous);
  if (diff === 0) return 'the same as';
  return `${Math.abs(diff)} ms ${diff < 0 ? 'faster than' : 'slower than'}`;
}

function Comparison({ summary, outcome }: { summary: SessionStats; outcome: SessionOutcome | null }) {
  if (!outcome) return <p className="summary__note">Personal records were cleared.</p>;
  const { previous } = outcome;
  if (previous.bestAverageMs === null && previous.bestScore === null) {
    return <p className="summary__note">No previous record to compare with yet.</p>;
  }
  return (
    <ul className="compare">
      {summary.averageMs !== null && previous.bestAverageMs !== null && (
        <li>
          Average {formatMs(summary.averageMs)} — {describeDifference(summary.averageMs, previous.bestAverageMs)}{' '}
          your previous best average ({formatMs(previous.bestAverageMs)}).
        </li>
      )}
      {previous.bestScore !== null && (
        <li>
          Score {formatScore(summary.totalScore)} vs previous best {formatScore(previous.bestScore)}.
        </li>
      )}
    </ul>
  );
}

export function SessionSummary({
  summary,
  outcome,
  onPlayAgain,
  onHome,
  onResetRecords,
}: SessionSummaryProps) {
  const message = celebrationMessage(outcome);
  const hasValid = summary.validCount > 0;

  return (
    <div className="summary" role="region" aria-label="Session summary">
      <p className="eyebrow">Session complete</p>
      <h2 className="arena__title">Final Score</h2>

      {message && (
        <div className="banner">
          <div className="confetti" aria-hidden="true">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                style={
                  {
                    '--a': `${c.angle}deg`,
                    '--d': `${c.distance}px`,
                    '--c': c.color,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <Trophy aria-hidden="true" size={20} />
          <span>{message}</span>
        </div>
      )}

      <p className="time" data-testid="total-score">
        {formatScore(summary.totalScore)}
      </p>

      <dl className="summary__grid">
        <div className="tile">
          <dt>Average</dt>
          <dd>{formatMs(summary.averageMs)}</dd>
        </div>
        <div className="tile">
          <dt>Fastest</dt>
          <dd>{formatMs(summary.fastestMs)}</dd>
        </div>
        <div className="tile">
          <dt>Slowest</dt>
          <dd>{formatMs(summary.slowestMs)}</dd>
        </div>
        <div className="tile">
          <dt>Valid rounds</dt>
          <dd>{`${summary.validCount} / ${TOTAL_ROUNDS}`}</dd>
        </div>
        <div className="tile">
          <dt>False starts</dt>
          <dd>{summary.falseStarts}</dd>
        </div>
      </dl>

      {!hasValid && (
        <p className="summary__note">
          No valid reactions this session. Wait for green, then react — you have got this.
        </p>
      )}

      <Comparison summary={summary} outcome={outcome} />

      <div className="summary__actions">
        <button type="button" className="btn btn--primary" onClick={onPlayAgain}>
          <Play aria-hidden="true" size={20} />
          Play Again
        </button>
        <button type="button" className="btn btn--ghost" onClick={onHome}>
          <ArrowLeft aria-hidden="true" size={18} />
          Back to Menu
        </button>
        <ResetRecordsButton onConfirm={onResetRecords} />
      </div>

      <p className="summary__disclaimer">
        Scores are informal game feedback, not a scientific measure of ability.
      </p>
    </div>
  );
}
