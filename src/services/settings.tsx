import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { DEFAULT_PACE, Pace, paceById, PaceId } from '../core/pace';
import { DEFAULT_PRESET, PresetId, presetById } from '../core/rules';
import { DEFAULT_THROW_SET, ThrowSet, throwSetById, ThrowSetId } from '../core/themes';

/** Player choices kept on the device between launches. */
export interface Settings {
  throwSet: ThrowSetId;
  pace: PaceId;
  preset: PresetId;
}

const DEFAULTS: Settings = { throwSet: DEFAULT_THROW_SET, pace: DEFAULT_PACE, preset: DEFAULT_PRESET };
const KEY = 'rps-bash/settings/v1';

interface SettingsContext {
  settings: Settings;
  throwSet: ThrowSet;
  pace: Pace;
  update: (change: Partial<Settings>) => void;
}

const Context = createContext<SettingsContext>({
  settings: DEFAULTS,
  throwSet: throwSetById(DEFAULTS.throwSet),
  pace: paceById(DEFAULTS.pace),
  update: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Settings>;
        // Unknown ids (from an older version) fall back to the defaults.
        setSettings({
          throwSet: throwSetById(saved.throwSet).id,
          pace: paceById(saved.pace).id,
          preset: presetById(saved.preset).id,
        });
      })
      .catch(() => {});
  }, []);

  const update = (change: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...change };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return (
    <Context.Provider
      value={{ settings, throwSet: throwSetById(settings.throwSet), pace: paceById(settings.pace), update }}
    >
      {children}
    </Context.Provider>
  );
}

export function useSettings(): SettingsContext {
  return useContext(Context);
}
