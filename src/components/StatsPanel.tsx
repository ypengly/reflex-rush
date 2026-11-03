import type { GamePhase, PersonalRecords, SessionSummary } from '../game/gameTypes';
import { formatMs, formatScore } from '../utils/formatTime';

interface StatsPanelProps {
  records: PersonalRecords;
  summary: SessionSummary;
  phase: GamePhase;
}

export function StatsPanel({ records, summary, phase }: StatsPanelProps) {
  const sessionActive = phase !== 'idle';
  return (
    <section className="stats" aria-label="Statistics">
      <dl className="stats__grid">
        <div className="tile">
          <dt>Best average</dt>
          <dd>{formatMs(records.bestAverageMs)}</dd>
        </div>
        <div className="tile">
          <dt>Best score</dt>
          <dd>{formatScore(records.bestScore)}</dd>
        </div>
        <div className="tile">
          <dt>Session fastest</dt>
          <dd>{sessionActive ? formatMs(summary.fastestMs) : '—'}</dd>
        </div>
        <div className="tile">
          <dt>False starts</dt>
          <dd>{sessionActive ? summary.falseStarts : '—'}</dd>
        </div>
      </dl>
    </section>
  );
}
