export type SoundKind = 'start' | 'go' | 'success' | 'falseStart' | 'personalBest';

interface Tone {
  freq: number;
  at: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

const TONES: Record<SoundKind, Tone[]> = {
  start: [
    { freq: 440, at: 0, duration: 0.09, type: 'triangle', gain: 0.12 },
    { freq: 660, at: 0.09, duration: 0.12, type: 'triangle', gain: 0.12 },
  ],
  go: [{ freq: 880, at: 0, duration: 0.14, type: 'square', gain: 0.07 }],
  success: [
    { freq: 523, at: 0, duration: 0.09, type: 'sine', gain: 0.14 },
    { freq: 784, at: 0.08, duration: 0.16, type: 'sine', gain: 0.14 },
  ],
  falseStart: [
    { freq: 220, at: 0, duration: 0.14, type: 'sawtooth', gain: 0.08 },
    { freq: 150, at: 0.12, duration: 0.22, type: 'sawtooth', gain: 0.08 },
  ],
  personalBest: [
    { freq: 523, at: 0, duration: 0.12, type: 'triangle', gain: 0.13 },
    { freq: 659, at: 0.11, duration: 0.12, type: 'triangle', gain: 0.13 },
    { freq: 784, at: 0.22, duration: 0.12, type: 'triangle', gain: 0.13 },
    { freq: 1047, at: 0.33, duration: 0.28, type: 'triangle', gain: 0.13 },
  ],
};

export interface SoundPlayer {
  play: (kind: SoundKind) => void;
}

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  const legacy = window as unknown as { webkitAudioContext?: AudioContextConstructor };
  return window.AudioContext ?? legacy.webkitAudioContext ?? null;
}

/** Synthesizes short tones with the Web Audio API. No audio files or network access needed. */
export function createSoundPlayer(): SoundPlayer {
  let context: AudioContext | null = null;

  return {
    play(kind) {
      try {
        const Ctor = getAudioContextConstructor();
        if (!Ctor) return;
        context ??= new Ctor();
        const ctx = context;
        if (ctx.state === 'suspended') void ctx.resume();

        const start = ctx.currentTime;
        for (const tone of TONES[kind]) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t0 = start + tone.at;
          osc.type = tone.type;
          osc.frequency.setValueAtTime(tone.freq, t0);
          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.exponentialRampToValueAtTime(tone.gain, t0 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.duration);
          osc.connect(gain).connect(ctx.destination);
          osc.start(t0);
          osc.stop(t0 + tone.duration + 0.02);
        }
      } catch {
        // Audio is optional; failing silently keeps the game playable.
      }
    },
  };
}
