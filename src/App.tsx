import { useState } from 'react';
import { GameArena } from './components/GameArena';
import { GameHeader } from './components/GameHeader';
import { SettingsPanel } from './components/SettingsPanel';
import { StatsPanel } from './components/StatsPanel';
import { useReactionGame } from './hooks/useReactionGame';
import { useSettings } from './hooks/useSettings';

export default function App() {
  const { settings, updateSettings } = useSettings();
  const game = useReactionGame({ soundEnabled: settings.soundEnabled });
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app">
      <GameHeader
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((open) => !open)}
      />

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          onResetRecords={game.clearRecords}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <main className="main">
        <GameArena
          state={game.state}
          summary={game.summary}
          outcome={game.outcome}
          records={game.records}
          onStart={game.start}
          onInput={game.handleInput}
          onNext={game.next}
          onRestartRound={game.restartRound}
          onPlayAgain={game.start}
          onHome={game.backToIdle}
          onResetRecords={game.clearRecords}
        />
        <StatsPanel records={game.records} summary={game.summary} phase={game.state.phase} />
      </main>

      <p className="sr-only" role="status" aria-live="polite">
        {game.announcement}
      </p>

      <footer className="footer">
        <p>Informal game feedback, not a scientific test. Records stay on your device.</p>
      </footer>
    </div>
  );
}
