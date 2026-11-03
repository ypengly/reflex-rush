import { useCallback, useEffect, useState } from 'react';
import type { Settings } from '../game/gameTypes';
import { loadSettings, saveSettings } from '../utils/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  // Lets the stylesheet honour the in-app "Reduce motion" switch as well as the OS setting.
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(settings.reduceMotion);
  }, [settings.reduceMotion]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      saveSettings(next);
    },
    [settings],
  );

  return { settings, updateSettings };
}
