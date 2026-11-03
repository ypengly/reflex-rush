import { TOTAL_ROUNDS, type GamePhase } from '../game/gameTypes';

export interface Instruction {
  eyebrow: string;
  title: string;
  hint: string;
}

export function instructionFor(phase: GamePhase, round: number): Instruction {
  const roundLabel = `Round ${round} of ${TOTAL_ROUNDS}`;
  switch (phase) {
    case 'idle':
      return {
        eyebrow: 'How to play',
        title: '',
        hint: 'Wait for the arena to turn green, then click, tap or press Space as fast as you can. Reacting while it is red is a false start.',
      };
    case 'ready':
      return {
        eyebrow: roundLabel,
        title: 'Get Ready',
        hint: 'The arena will turn red. Stay still and wait for green.',
      };
    case 'waiting':
      return {
        eyebrow: roundLabel,
        title: 'WAIT FOR GREEN',
        hint: 'Hold steady. Do not click, tap or press Space yet.',
      };
    case 'go':
      return {
        eyebrow: 'GO!',
        title: 'CLICK NOW!',
        hint: 'Click, tap or press Space.',
      };
    case 'result':
      return {
        eyebrow: roundLabel,
        title: 'Round Complete',
        hint: 'Check your time, then continue.',
      };
    case 'falseStart':
      return {
        eyebrow: roundLabel,
        title: 'False Start',
        hint: 'You reacted before the green signal.',
      };
    case 'gameOver':
      return {
        eyebrow: 'Finished',
        title: 'Session Complete',
        hint: 'Review your results below.',
      };
  }
}

interface GameInstructionsProps {
  phase: GamePhase;
  round: number;
}

export function GameInstructions({ phase, round }: GameInstructionsProps) {
  const { eyebrow, title, hint } = instructionFor(phase, round);
  return (
    <div className="instructions">
      <p className="eyebrow">{eyebrow}</p>
      {title && <h2 className="arena__title">{title}</h2>}
      <p className="arena__hint">{hint}</p>
      {phase === 'idle' && (
        <ul className="chips" aria-label="Controls">
          <li className="chip">Mouse: click</li>
          <li className="chip">Touch: tap</li>
          <li className="chip">Keyboard: Space</li>
        </ul>
      )}
    </div>
  );
}
