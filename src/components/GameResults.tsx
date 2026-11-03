import { ArrowRight, TriangleAlert } from 'lucide-react';
import { TOTAL_ROUNDS, type RoundResult } from '../game/gameTypes';
import { FALSE_START_MESSAGE, FALSE_START_PENALTY, feedbackForReaction } from '../game/scoring';
import { formatMs, formatSignedScore } from '../utils/formatTime';

interface GameResultsProps {
  result: RoundResult;
  fastestMs: number | null;
  onNext: () => void;
}

export function GameResults({ result, fastestMs, onNext }: GameResultsProps) {
  const isLast = result.round >= TOTAL_ROUNDS;
  const isFalseStart = result.kind === 'falseStart' || result.reactionMs === null;

  return (
    <div className={`results ${isFalseStart ? 'results--false' : 'results--valid'}`}>
      <p className="eyebrow">{`Round ${result.round} of ${TOTAL_ROUNDS}`}</p>

      {isFalseStart ? (
        <>
          <TriangleAlert aria-hidden="true" size={44} className="results__icon" />
          <h2 className="arena__title">{FALSE_START_MESSAGE}</h2>
          <p className="arena__hint">
            You reacted before the arena turned green. This round is not a valid reaction
            measurement and costs {FALSE_START_PENALTY} points.
          </p>
        </>
      ) : (
        <>
          <p className="time" data-testid="reaction-time">
            {formatMs(result.reactionMs)}
          </p>
          <h2 className="arena__title results__feedback">
            {feedbackForReaction(result.reactionMs ?? 0)}
          </h2>
        </>
      )}

      <dl className="results__stats">
        <div className="tile">
          <dt>Round score</dt>
          <dd>{formatSignedScore(result.score)}</dd>
        </div>
        <div className="tile">
          <dt>Fastest so far</dt>
          <dd>{formatMs(fastestMs)}</dd>
        </div>
      </dl>

      <button type="button" className="btn btn--primary" onClick={onNext}>
        {isLast ? 'See Summary' : 'Next Round'}
        <ArrowRight aria-hidden="true" size={20} />
      </button>
    </div>
  );
}
