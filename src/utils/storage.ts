import type {
  PersonalRecords,
  SessionOutcome,
  SessionSummary,
  Settings,
} from '../game/gameTypes';

export const RECORDS_KEY = 'reflex-rush:records:v1';
export const SETTINGS_KEY = 'reflex-rush:settings:v1';

export const emptyRecords: PersonalRecords = { bestAverageMs: null, bestScore: null };

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    // Access can throw (blocked cookies, private mode, sandboxed iframes).
    return null;
  }
}

function parseJson(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validTime(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 60000
    ? value
    : null;
}

function validScore(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 5000
    ? value
    : null;
}

/** Validates stored data field by field; anything invalid falls back to "no record". */
export function parseRecords(raw: string | null): PersonalRecords {
  const data = parseJson(raw);
  if (!isRecordObject(data)) return { ...emptyRecords };
  return {
    bestAverageMs: validTime(data.bestAverageMs),
    bestScore: validScore(data.bestScore),
  };
}

export function loadRecords(storage: StorageLike | null = getStorage()): PersonalRecords {
  if (!storage) return { ...emptyRecords };
  try {
    return parseRecords(storage.getItem(RECORDS_KEY));
  } catch {
    return { ...emptyRecords };
  }
}

export function saveRecords(
  records: PersonalRecords,
  storage: StorageLike | null = getStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(RECORDS_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

export function resetRecords(storage: StorageLike | null = getStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(RECORDS_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Compares a finished session with the stored records.
 * Sessions without a valid reaction never create or change a record, and a score record
 * must be positive.
 */
export function applySession(previous: PersonalRecords, summary: SessionSummary): SessionOutcome {
  const unchanged: SessionOutcome = {
    summary,
    previous,
    records: previous,
    newBestAverage: false,
    newBestScore: false,
    firstRecord: false,
  };
  if (summary.validCount === 0 || summary.averageMs === null) return unchanged;

  const newBestAverage =
    previous.bestAverageMs === null || summary.averageMs < previous.bestAverageMs;
  const newBestScore =
    summary.totalScore > 0 && (previous.bestScore === null || summary.totalScore > previous.bestScore);

  if (!newBestAverage && !newBestScore) return unchanged;

  return {
    summary,
    previous,
    records: {
      bestAverageMs: newBestAverage ? summary.averageMs : previous.bestAverageMs,
      bestScore: newBestScore ? summary.totalScore : previous.bestScore,
    },
    newBestAverage,
    newBestScore,
    firstRecord: previous.bestAverageMs === null && previous.bestScore === null,
  };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/** Sound is silent until the player turns it on. */
export function getDefaultSettings(): Settings {
  return { soundEnabled: false, reduceMotion: prefersReducedMotion() };
}

export function parseSettings(raw: string | null, fallback: Settings): Settings {
  const data = parseJson(raw);
  if (!isRecordObject(data)) return fallback;
  return {
    soundEnabled: typeof data.soundEnabled === 'boolean' ? data.soundEnabled : fallback.soundEnabled,
    reduceMotion: typeof data.reduceMotion === 'boolean' ? data.reduceMotion : fallback.reduceMotion,
  };
}

export function loadSettings(
  fallback: Settings = getDefaultSettings(),
  storage: StorageLike | null = getStorage(),
): Settings {
  if (!storage) return fallback;
  try {
    return parseSettings(storage.getItem(SETTINGS_KEY), fallback);
  } catch {
    return fallback;
  }
}

export function saveSettings(
  settings: Settings,
  storage: StorageLike | null = getStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
