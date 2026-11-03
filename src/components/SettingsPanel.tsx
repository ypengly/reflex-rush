import { X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import type { Settings } from '../game/gameTypes';
import { ResetRecordsButton } from './ResetRecordsButton';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onResetRecords: () => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onChange, onResetRecords, onClose }: SettingsPanelProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') onClose();
  };

  return (
    <section id="settings-panel" className="panel" aria-label="Settings" onKeyDown={handleKeyDown}>
      <div className="panel__head">
        <h2>Settings</h2>
        <button type="button" className="btn btn--icon" aria-label="Close settings" onClick={onClose}>
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      <div className="toggle">
        <input
          id="setting-sound"
          type="checkbox"
          checked={settings.soundEnabled}
          aria-describedby="setting-sound-hint"
          onChange={(e) => onChange({ soundEnabled: e.target.checked })}
        />
        <div>
          <label htmlFor="setting-sound">Sound effects</label>
          <p id="setting-sound-hint">Short synthesized beeps. Off until you turn it on.</p>
        </div>
      </div>

      <div className="toggle">
        <input
          id="setting-motion"
          type="checkbox"
          checked={settings.reduceMotion}
          aria-describedby="setting-motion-hint"
          onChange={(e) => onChange({ reduceMotion: e.target.checked })}
        />
        <div>
          <label htmlFor="setting-motion">Reduce motion</label>
          <p id="setting-motion-hint">
            Calms pulses and celebrations. Your system setting is respected automatically.
          </p>
        </div>
      </div>

      <div className="panel__section">
        <h3>How to play</h3>
        <ul>
          <li>Press Start. The arena turns red.</li>
          <li>Wait for green, then click, tap or press Space.</li>
          <li>Reacting while it is red is a false start (−250 points).</li>
          <li>Five rounds make a session.</li>
        </ul>
      </div>

      <ResetRecordsButton onConfirm={onResetRecords} />
    </section>
  );
}
