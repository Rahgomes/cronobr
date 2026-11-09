import type { AudioClock } from './engine';

/** O pedaço da Web Audio que o clique usa; o `react-native-audio-api` tem a mesma forma. */
interface Param {
  setValueAtTime: (value: number, at: number) => unknown;
  exponentialRampToValueAtTime: (value: number, at: number) => unknown;
}
interface Node {
  connect: (to: never) => unknown;
  disconnect: () => void;
}
interface Oscillator extends Node {
  frequency: Param;
  start: (at: number) => void;
  stop: (at: number) => void;
}
interface Gain extends Node {
  gain: Param;
}
export interface ClickContext {
  readonly currentTime: number;
  readonly outputLatency?: number;
  readonly destination: unknown;
  createOscillator: () => Oscillator;
  createGain: () => Gain;
  resume: () => Promise<unknown>;
  close: () => Promise<unknown>;
}

const CLICK_HZ = 1600;
const CLICK_S = 0.05;
const PEAK = 0.7;
const FLOOR = 0.0001;

/**
 * Clique sintetizado, sem arquivo (funciona offline e não depende de decodificar áudio): um seno
 * curto com ataque de 2 ms e queda exponencial em 50 ms, marcado no relógio de áudio.
 */
export function clockFrom(ctx: ClickContext): AudioClock {
  return {
    get now() {
      return ctx.currentTime;
    },
    get outputLatency() {
      const latency = ctx.outputLatency;
      return typeof latency === 'number' && Number.isFinite(latency) ? latency : 0;
    },
    click: (at) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(CLICK_HZ, at);
      gain.gain.setValueAtTime(FLOOR, at);
      gain.gain.exponentialRampToValueAtTime(PEAK, at + 0.002);
      gain.gain.exponentialRampToValueAtTime(FLOOR, at + CLICK_S);
      osc.connect(gain as never);
      gain.connect(ctx.destination as never);
      osc.start(at);
      osc.stop(at + CLICK_S + 0.01);
      // Desmarcar = desligar da saída: chamar stop() de novo lança erro na Web Audio.
      return () => {
        try {
          gain.disconnect();
        } catch {
          // já desligado
        }
      };
    },
    resume: () => ctx.resume().then(() => undefined),
    close: () => {
      ctx.close().catch(() => undefined);
    },
  };
}
