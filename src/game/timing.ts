export const MIN_DELAY_MS = 1500;
export const MAX_DELAY_MS = 4500;
/** Short "get ready" pause before the arena turns red. */
export const READY_DELAY_MS = 900;

/** Monotonic, high-resolution clock used for every reaction measurement. */
export function nowMs(): number {
  return performance.now();
}

/** Random wait between MIN_DELAY_MS and MAX_DELAY_MS. `rng` is injectable for tests. */
export function randomDelayMs(rng: () => number = Math.random): number {
  return Math.round(MIN_DELAY_MS + rng() * (MAX_DELAY_MS - MIN_DELAY_MS));
}

/** Elapsed whole milliseconds between the green signal and the accepted input. */
export function calcReactionMs(startedAt: number, inputAt: number): number {
  return Math.max(0, Math.round(inputAt - startedAt));
}

export interface TimeoutManager {
  set: (callback: () => void, delayMs: number) => void;
  clear: () => void;
  pending: () => number;
}

/** Tracks timeouts so they can all be cancelled together (round cancelled, restarted or unmounted). */
export function createTimeoutManager(): TimeoutManager {
  const ids = new Set<ReturnType<typeof setTimeout>>();
  return {
    set(callback, delayMs) {
      const id = setTimeout(() => {
        ids.delete(id);
        callback();
      }, delayMs);
      ids.add(id);
    },
    clear() {
      for (const id of ids) clearTimeout(id);
      ids.clear();
    },
    pending: () => ids.size,
  };
}
