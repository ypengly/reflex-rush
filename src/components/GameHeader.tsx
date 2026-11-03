import { Settings as SettingsIcon, Zap } from 'lucide-react';

interface GameHeaderProps {
  settingsOpen: boolean;
  onToggleSettings: () => void;
}

export function GameHeader({ settingsOpen, onToggleSettings }: GameHeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <Zap aria-hidden="true" size={22} />
        <span>REFLEX RUSH</span>
      </div>
      <button
        type="button"
        className="btn btn--icon"
        aria-label="Settings"
        aria-expanded={settingsOpen}
        aria-controls="settings-panel"
        onClick={onToggleSettings}
      >
        <SettingsIcon aria-hidden="true" size={22} />
      </button>
    </header>
  );
}
