import { DEFAULT_INTERVAL, DEFAULT_TIMER } from '@/domain/quick';
import type { IntervalConfig } from '@/domain/routine';

type Timer = { kind: 'temporizador'; seconds: number; name: string; loop: boolean };
type Interval = { kind: 'intervalo' } & IntervalConfig;

const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : fallback;

export const TIMER_START: Timer = { ...DEFAULT_TIMER, loop: false };

export function parseTimer(raw: unknown): Timer {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    kind: 'temporizador',
    seconds: num(o.seconds, DEFAULT_TIMER.seconds),
    name: typeof o.name === 'string' ? o.name : '',
    loop: o.loop === true,
  };
}

export function parseInterval(raw: unknown): Interval {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_INTERVAL;
  return {
    kind: 'intervalo',
    prepSeconds: num(o.prepSeconds, d.prepSeconds),
    workSeconds: num(o.workSeconds, d.workSeconds),
    restSeconds: num(o.restSeconds, d.restSeconds),
    rounds: num(o.rounds, d.rounds),
  };
}
