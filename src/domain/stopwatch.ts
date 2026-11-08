// Cronômetro (E04): conta para cima, com voltas. Mesmo princípio do motor: nada lê relógio,
// o tempo é derivado do marco `since`. Gravado em preferências para sobreviver a fechar o app.
import type { Instant } from './engine';

export interface Stopwatch {
  status: 'idle' | 'running' | 'paused';
  since: Instant | null;
  /** Tempo acumulado até `since` (ou total, parado). */
  accumulatedMs: number;
  /** Marcas de volta em tempo total (ms), em ordem. */
  laps: number[];
}

export const LAPS_MAX = 999;

export const IDLE: Stopwatch = { status: 'idle', since: null, accumulatedMs: 0, laps: [] };

export function elapsed(sw: Stopwatch, now: Instant): number {
  if (sw.status !== 'running' || !sw.since) return sw.accumulatedMs;
  return sw.accumulatedMs + Math.max(0, now.mono - sw.since.mono);
}

export function startOrResume(sw: Stopwatch, now: Instant): Stopwatch {
  if (sw.status === 'running') return sw;
  return { ...sw, status: 'running', since: now };
}

export function pause(sw: Stopwatch, now: Instant): Stopwatch {
  if (sw.status !== 'running') return sw;
  return { ...sw, status: 'paused', since: null, accumulatedMs: elapsed(sw, now) };
}

export function lap(sw: Stopwatch, now: Instant): Stopwatch {
  if (sw.status !== 'running' || sw.laps.length >= LAPS_MAX) return sw;
  return { ...sw, laps: [...sw.laps, elapsed(sw, now)] };
}

/** Zerar só parado: rodando, a tela pede para pausar antes (proteção do PRD). */
export function reset(sw: Stopwatch): Stopwatch {
  return sw.status === 'running' ? sw : IDLE;
}

export interface LapRow {
  number: number;
  lapMs: number;
  totalMs: number;
}

/** Voltas da mais recente para a mais antiga, com a duração de cada uma. */
export function lapRows(sw: Stopwatch): LapRow[] {
  return sw.laps
    .map((totalMs, i) => ({ number: i + 1, totalMs, lapMs: totalMs - (sw.laps[i - 1] ?? 0) }))
    .reverse();
}

/**
 * Reabrir o app: `mono` recomeça a cada processo, então o marco é recalculado pelo relógio
 * civil (como o `restore` do motor). Relógio civil para trás conta como zero.
 */
export function rebase(sw: Stopwatch, now: Instant): Stopwatch {
  if (sw.status !== 'running' || !sw.since) return sw;
  const away = Math.max(0, now.wall - sw.since.wall);
  return { ...sw, since: { mono: now.mono - away, wall: sw.since.wall } };
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Leitura do que foi gravado: qualquer coisa fora do formato volta ao cronômetro zerado. */
export function parseStopwatch(raw: unknown): Stopwatch {
  if (typeof raw !== 'object' || raw === null) return IDLE;
  const o = raw as Record<string, unknown>;
  const status = o.status;
  const since = o.since as Record<string, unknown> | null | undefined;
  const sinceOk = since == null || (isNum(since.mono) && isNum(since.wall));
  if (
    (status !== 'idle' && status !== 'running' && status !== 'paused') ||
    !isNum(o.accumulatedMs) ||
    !Array.isArray(o.laps) ||
    !o.laps.every(isNum) ||
    !sinceOk ||
    (status === 'running' && since == null)
  )
    return IDLE;
  return {
    status,
    since: since ? { mono: since.mono as number, wall: since.wall as number } : null,
    accumulatedMs: o.accumulatedMs,
    laps: o.laps,
  };
}
