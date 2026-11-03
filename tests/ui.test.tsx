import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { MIN_DELAY_MS, READY_DELAY_MS } from '../src/game/timing';
import { RECORDS_KEY, SETTINGS_KEY } from '../src/utils/storage';

let clock = 0;

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const arena = () => screen.getByRole('region', { name: 'Game arena' });
const startGame = () => {
  fireEvent.click(screen.getByRole('button', { name: /start game/i }));
};
const toWaiting = () => advance(READY_DELAY_MS);
const toGreen = () => advance(MIN_DELAY_MS);
const react = (ms: number) => {
  clock += ms;
  fireEvent.pointerDown(arena());
};

/** Plays one full round with the given reaction time (random delay is pinned to 1.5 s). */
function playRound(ms: number) {
  toWaiting();
  toGreen();
  react(ms);
}

beforeEach(() => {
  vi.useFakeTimers();
  clock = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('instructions for each game state', () => {
  it('shows the idle screen with start button, round indicator and controls', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'REFLEX RUSH' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
    expect(screen.getByText('5 rounds per session')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Round progress' })).toBeInTheDocument();
    expect(screen.getByText('Keyboard: Space')).toBeInTheDocument();
    expect(screen.getByText('Touch: tap')).toBeInTheDocument();
  });

  it('walks through ready, waiting and go with distinct, text-based instructions', () => {
    render(<App />);
    startGame();
    expect(arena()).toHaveAttribute('data-phase', 'ready');
    expect(screen.getByText('Get Ready')).toBeInTheDocument();

    toWaiting();
    expect(arena()).toHaveAttribute('data-phase', 'waiting');
    expect(screen.getByText('WAIT FOR GREEN')).toBeInTheDocument();
    expect(screen.getByText('Round 1 of 5')).toBeInTheDocument();

    toGreen();
    expect(arena()).toHaveAttribute('data-phase', 'go');
    expect(screen.getByText('CLICK NOW!')).toBeInTheDocument();
  });
});

describe('input', () => {
  it('measures the reaction time on a mouse or touch press', () => {
    render(<App />);
    startGame();
    playRound(247);
    expect(arena()).toHaveAttribute('data-phase', 'result');
    expect(screen.getByTestId('reaction-time')).toHaveTextContent('247 ms');
    expect(screen.getByText('Nice Reaction!')).toBeInTheDocument();
    expect(screen.getByText('+906')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Round' })).toBeInTheDocument();
  });

  it('accepts the Space bar, ignores key repeats and unrelated keys', () => {
    render(<App />);
    startGame();
    toWaiting();

    fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
    expect(arena()).toHaveAttribute('data-phase', 'waiting');

    toGreen();
    fireEvent.keyDown(window, { key: ' ', code: 'Space', repeat: true });
    expect(arena()).toHaveAttribute('data-phase', 'go');

    clock += 300;
    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    expect(arena()).toHaveAttribute('data-phase', 'result');
    expect(screen.getByTestId('reaction-time')).toHaveTextContent('300 ms');
  });

  it('keeps the first reaction when the player presses repeatedly', () => {
    render(<App />);
    startGame();
    toWaiting();
    toGreen();
    react(220);
    react(900);
    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    expect(screen.getByTestId('reaction-time')).toHaveTextContent('220 ms');
  });

  it('ignores presses while idle, preparing and viewing a result', () => {
    render(<App />);
    fireEvent.pointerDown(arena());
    expect(arena()).toHaveAttribute('data-phase', 'idle');

    startGame();
    fireEvent.pointerDown(arena());
    expect(arena()).toHaveAttribute('data-phase', 'ready');

    playRound(250);
    fireEvent.pointerDown(arena());
    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    expect(arena()).toHaveAttribute('data-phase', 'result');
    expect(screen.getByTestId('reaction-time')).toHaveTextContent('250 ms');
  });

  it('flags a false start, cancels the pending signal and lets the player continue', () => {
    render(<App />);
    startGame();
    toWaiting();
    fireEvent.pointerDown(arena());

    expect(arena()).toHaveAttribute('data-phase', 'falseStart');
    expect(screen.getByText('False Start — Stay Ready!')).toBeInTheDocument();
    expect(screen.getByText('−250')).toBeInTheDocument();

    // The old green timer must not fire.
    advance(10_000);
    expect(arena()).toHaveAttribute('data-phase', 'falseStart');

    fireEvent.click(screen.getByRole('button', { name: 'Next Round' }));
    expect(screen.getByText('Round 2 of 5')).toBeInTheDocument();
  });
});

describe('tab visibility', () => {
  afterEach(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('cancels a live round and waits for a manual restart', () => {
    render(<App />);
    startGame();
    toWaiting();

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(arena()).toHaveAttribute('data-phase', 'ready');
    expect(within(arena()).getByText(/round cancelled/i)).toBeInTheDocument();

    advance(10_000);
    expect(arena()).toHaveAttribute('data-phase', 'ready');

    fireEvent.click(screen.getByRole('button', { name: 'Restart Round' }));
    toWaiting();
    expect(arena()).toHaveAttribute('data-phase', 'waiting');
  });
});

describe('a complete session', () => {
  function playSession(times: number[]) {
    startGame();
    times.forEach((ms, index) => {
      playRound(ms);
      const last = index === times.length - 1;
      fireEvent.click(screen.getByRole('button', { name: last ? 'See Summary' : 'Next Round' }));
    });
  }

  it('shows an accurate summary and persists personal records', () => {
    render(<App />);
    playSession([200, 250, 300, 400, 600]);

    const summary = screen.getByRole('region', { name: 'Session summary' });
    expect(within(summary).getByText('3,500')).toBeInTheDocument();
    expect(within(summary).getByText('350 ms')).toBeInTheDocument();
    expect(within(summary).getByText('200 ms')).toBeInTheDocument();
    expect(within(summary).getByText('600 ms')).toBeInTheDocument();
    expect(within(summary).getByText('5 / 5')).toBeInTheDocument();
    expect(within(summary).getByText('First record set — now beat it!')).toBeInTheDocument();
    expect(within(summary).getByText('No previous record to compare with yet.')).toBeInTheDocument();

    expect(JSON.parse(window.localStorage.getItem(RECORDS_KEY) ?? 'null')).toEqual({
      bestAverageMs: 350,
      bestScore: 3500,
    });
  });

  it('loads saved records after a refresh and compares the new session with them', () => {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify({ bestAverageMs: 400, bestScore: 2000 }));
    render(<App />);

    const stats = screen.getByRole('region', { name: 'Statistics' });
    expect(within(stats).getByText('400 ms')).toBeInTheDocument();
    expect(within(stats).getByText('2,000')).toBeInTheDocument();

    playSession([250, 250, 250, 250, 250]);
    const summary = screen.getByRole('region', { name: 'Session summary' });
    expect(within(summary).getByText('New personal best: average time and score!')).toBeInTheDocument();
    expect(within(summary).getByText(/150 ms faster than/)).toBeInTheDocument();
  });

  it('handles a session with no valid reactions without misleading numbers', () => {
    render(<App />);
    startGame();
    for (let i = 0; i < 5; i++) {
      toWaiting();
      fireEvent.pointerDown(arena());
      fireEvent.click(screen.getByRole('button', { name: i === 4 ? 'See Summary' : 'Next Round' }));
    }
    const summary = screen.getByRole('region', { name: 'Session summary' });
    expect(within(summary).getByTestId('total-score')).toHaveTextContent('−1,250');
    expect(within(summary).getByText(/no valid reactions/i)).toBeInTheDocument();
    expect(within(summary).getByText('0 / 5')).toBeInTheDocument();
    expect(within(summary).queryByText('0 ms')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(RECORDS_KEY)).toBeNull();
  });

  it('plays again and returns to the menu', () => {
    render(<App />);
    playSession([250, 250, 250, 250, 250]);

    fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));
    expect(arena()).toHaveAttribute('data-phase', 'ready');
    expect(screen.getByText('Round 1 of 5')).toBeInTheDocument();

    toWaiting();
    toGreen();
    react(250);
    expect(screen.getByRole('list', { name: 'Round progress' })).toBeInTheDocument();
  });

  it('returns to the idle screen from the summary', () => {
    render(<App />);
    playSession([250, 250, 250, 250, 250]);
    fireEvent.click(screen.getByRole('button', { name: 'Back to Menu' }));
    expect(arena()).toHaveAttribute('data-phase', 'idle');
  });

  it('asks for confirmation before resetting personal records', () => {
    render(<App />);
    playSession([250, 250, 250, 250, 250]);
    expect(window.localStorage.getItem(RECORDS_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Reset Personal Records' }));
    expect(window.localStorage.getItem(RECORDS_KEY)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(window.localStorage.getItem(RECORDS_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Reset Personal Records' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }));
    expect(window.localStorage.getItem(RECORDS_KEY)).toBeNull();
    const stats = screen.getByRole('region', { name: 'Statistics' });
    expect(within(stats).getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });
});

describe('settings', () => {
  const openSettings = () => fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

  it('keeps sound off by default and persists the choice', () => {
    const { unmount } = render(<App />);
    openSettings();
    const sound = screen.getByRole('checkbox', { name: 'Sound effects' });
    expect(sound).not.toBeChecked();

    fireEvent.click(sound);
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? 'null')).toMatchObject({
      soundEnabled: true,
    });

    unmount();
    render(<App />);
    openSettings();
    expect(screen.getByRole('checkbox', { name: 'Sound effects' })).toBeChecked();
  });

  it('applies and persists the reduce-motion preference', () => {
    render(<App />);
    openSettings();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Reduce motion' }));
    expect(document.documentElement.dataset.reduceMotion).toBe('true');
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? 'null')).toMatchObject({
      reduceMotion: true,
    });
  });

  it('closes with the close button and Escape, and exposes expanded state', () => {
    render(<App />);
    const toggle = screen.getByRole('button', { name: 'Settings' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }));
    expect(screen.queryByRole('checkbox', { name: 'Sound effects' })).not.toBeInTheDocument();

    fireEvent.click(toggle);
    fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Sound effects' }), { key: 'Escape' });
    expect(screen.queryByRole('checkbox', { name: 'Sound effects' })).not.toBeInTheDocument();
  });

  it('resets personal records from the settings panel after confirmation', () => {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify({ bestAverageMs: 300, bestScore: 3000 }));
    render(<App />);
    openSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Reset Personal Records' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }));
    expect(window.localStorage.getItem(RECORDS_KEY)).toBeNull();
  });
});

describe('accessibility', () => {
  it('announces results through a polite live region', () => {
    render(<App />);
    const live = screen.getByRole('status');
    expect(live).toHaveAttribute('aria-live', 'polite');
    startGame();
    playRound(247);
    expect(live).toHaveTextContent('Round 1: 247 milliseconds. Score 906.');
  });

  it('labels every control and uses non-colour cues for states', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    startGame();
    toWaiting();
    expect(screen.getByText('WAIT FOR GREEN')).toBeInTheDocument();
    toGreen();
    expect(screen.getByText('CLICK NOW!')).toBeInTheDocument();
    react(250);
    expect(screen.getByRole('button', { name: 'Next Round' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Round 1: 250 milliseconds' })).toBeInTheDocument();
  });
});
