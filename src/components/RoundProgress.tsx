import { TOTAL_ROUNDS, type GamePhase, type RoundResult } from '../game/gameTypes';

interface RoundProgressProps {
  results: readonly RoundResult[];
  round: number;
  phase: GamePhase;
}

function pipLabel(index: number, result: RoundResult | undefined, isCurrent: boolean): string {
  const label = `Round ${index}`;
  if (result?.kind === 'valid') return `${label}: ${result.reactionMs} milliseconds`;
  if (result?.kind === 'falseStart') return `${label}: false start`;
  return isCurrent ? `${label}: current` : `${label}: upcoming`;
}

export function RoundProgress({ results, round, phase }: RoundProgressProps) {
  const active = phase !== 'idle' && phase !== 'gameOver';
  return (
    <ol className="pips" aria-label="Round progress">
      {Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
        const index = i + 1;
        const result = results.find((r) => r.round === index);
        const isCurrent = active && !result && index === round;
        const status = result
          ? result.kind === 'valid'
            ? 'done'
            : 'false'
          : isCurrent
            ? 'current'
            : 'upcoming';
        return (
          <li
            key={index}
            className={`pip pip--${status}`}
            aria-label={pipLabel(index, result, isCurrent)}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span aria-hidden="true">{status === 'false' ? '✕' : index}</span>
          </li>
        );
      })}
    </ol>
  );
}
