import type { AudioClock } from '@/features/metronome/engine';

/**
 * Relógio de áudio falso: anda com o tempo falso do Jest, mais um `stall` que simula o laço de JS
 * travado (navegador em segundo plano, thread ocupada) enquanto o áudio segue tocando.
 */
interface FakeAudio {
  stall: number;
  resumed: number;
  closed: number;
  clicks: { at: number; cancelled: boolean }[];
  clock: AudioClock;
}

export function fakeAudio(): FakeAudio {
  const start = Date.now();
  const audio: FakeAudio = {
    stall: 0,
    resumed: 0,
    closed: 0,
    clicks: [],
    clock: {
      get now() {
        return (Date.now() - start) / 1000 + audio.stall;
      },
      outputLatency: 0,
      click: (at) => {
        const click = { at, cancelled: false };
        audio.clicks.push(click);
        return () => {
          click.cancelled = true;
        };
      },
      resume: () => {
        audio.resumed += 1;
        return Promise.resolve();
      },
      close: () => {
        audio.closed += 1;
      },
    },
  };
  return audio;
}

/** Os cliques que seguem marcados (os desmarcados ao parar ou trocar o BPM ficam de fora). */
export const live = (clicks: { at: number; cancelled: boolean }[]) =>
  clicks.filter((c) => !c.cancelled).map((c) => c.at);
