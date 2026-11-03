import { Hand, Play, RotateCcw, Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type {
  GameState,
  PersonalRecords,
  SessionOutcome,
  SessionSummary as SessionStats,
} from '../game/gameTypes';
import { GameInstructions } from './GameInstructions';
import { GameResults } from './GameResults';
import { RoundProgress } from './RoundProgress';
import { SessionSummary } from './SessionSummary';

interface GameArenaProps {
  state: GameState;
  summary: SessionStats;
  outcome: SessionOutcome | null;
  records: PersonalRecords;
  onStart: () => void;
  onInput: () => void;
  onNext: () => void;
  onRestartRound: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
  onResetRecords: () => void;
}

export function GameArena({
  state,
  summary,
  outcome,
  onStart,
  onInput,
  onNext,
  onRestartRound,
  onPlayAgain,
  onHome,
  onResetRecords,
}: GameArenaProps) {
  const { phase, round, results } = state;
  const arenaRef = useRef<HTMLElement>(null);
  const previousPhase = useRef(phase);

  // Keep keyboard focus inside the game when the screen changes.
  useEffect(() => {
    if (previousPhase.current === phase) return;
    previousPhase.current = phase;
    arenaRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (phase !== 'waiting' && phase !== 'go') return;
    if (event.button > 0 || event.isPrimary === false) return;
    onInput();
  };

  const lastResult = results[results.length - 1];

  return (
    <section
      ref={arenaRef}
      className={`arena arena--${phase}`}
      data-phase={phase}
      aria-label="Game arena"
      tabIndex={-1}
      onPointerDown={handlePointerDown}
    >
      <div className="arena__content" key={phase}>
        {phase === 'idle' && (
          <>
            <h1 className="logo">REFLEX RUSH</h1>
            <p className="arena__tagline">Wait for green. React fast. Beat your best.</p>
            <button type="button" className="btn btn--primary btn--xl" onClick={onStart}>
              <Play aria-hidden="true" size={22} />
              Start Game
            </button>
            <RoundProgress results={results} round={round} phase={phase} />
            <p className="arena__caption">5 rounds per session</p>
            <GameInstructions phase={phase} round={round} />
          </>
        )}

        {phase === 'ready' && (
          <>
            <GameInstructions phase={phase} round={round} />
            <RoundProgress results={results} round={round} phase={phase} />
            {state.autoAdvance ? (
              <div className="prep" aria-hidden="true">
                <span />
              </div>
            ) : (
              <>
                {state.notice && <p className="notice">{state.notice}</p>}
                <button type="button" className="btn btn--primary" onClick={onRestartRound}>
                  <RotateCcw aria-hidden="true" size={20} />
                  Restart Round
                </button>
              </>
            )}
          </>
        )}

        {phase === 'waiting' && (
          <>
            <Hand aria-hidden="true" size={56} className="arena__icon" />
            <GameInstructions phase={phase} round={round} />
            <RoundProgress results={results} round={round} phase={phase} />
          </>
        )}

        {phase === 'go' && (
          <>
            <Zap aria-hidden="true" size={64} className="arena__icon" />
            <GameInstructions phase={phase} round={round} />
          </>
        )}

        {(phase === 'result' || phase === 'falseStart') && lastResult && (
          <>
            <GameResults result={lastResult} fastestMs={summary.fastestMs} onNext={onNext} />
            <RoundProgress results={results} round={round} phase={phase} />
          </>
        )}

        {phase === 'gameOver' && (
          <SessionSummary
            summary={summary}
            outcome={outcome}
            onPlayAgain={onPlayAgain}
            onHome={onHome}
            onResetRecords={onResetRecords}
          />
        )}
      </div>
    </section>
  );
}
