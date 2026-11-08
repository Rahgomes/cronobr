import type { Instant } from '@/domain/engine';

export interface Clock {
  now(): Instant;
}

/** performance.now é monotônico no processo; Date.now é o relógio civil (ver engine.ts, D12). */
export const systemClock: Clock = {
  now: () => ({ mono: performance.now(), wall: Date.now() }),
};

/** Id local de sessão: único o bastante no aparelho e sem depender de crypto nativo. */
export function newSessionId(wall = Date.now(), random = Math.random): string {
  return `${wall.toString(36)}-${random().toString(36).slice(2, 10)}`;
}
