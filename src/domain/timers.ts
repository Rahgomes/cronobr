// Vários temporizadores (E07 A, D94). Mesmo princípio do motor e do cronômetro: nada lê relógio,
// o que falta é derivado do marco `since`. Callback atrasado ou app suspenso não perdem tempo.
import type { Instant } from './engine';

export type TimerStatus = 'ready' | 'running' | 'paused' | 'done';

export interface Timer {
  id: string;
  /** Nome escrito pela pessoa (até 40 letras). */
  name: string;
  durationMs: number;
  status: TimerStatus;
  /** Marco do último começar/retomar; null fora de "rodando". */
  since: Instant | null;
  /** O que faltava no instante `since` (ou congelado, nos outros estados). */
  remainingMs: number;
  /** Relógio civil do fim exato (não da leitura que percebeu o fim). */
  doneAt: number | null;
}

/** Limite testado: 10 rodando juntos cabem no teto de avisos do iPhone (D96). */
export const TIMERS_MAX = 10;
export const NAME_MAX = 40;
const DURATION_MIN_MS = 1000;
export const DURATION_MAX_MS = 24 * 60 * 60 * 1000;
/** Fins a menos disso um do outro viram um aviso só (política de colisão, D98). */
const COLLISION_MS = 1000;

export function createTimer(id: string, name: string, durationMs: number): Timer {
  return {
    id,
    name: name.trim().slice(0, NAME_MAX),
    durationMs: clampDuration(durationMs),
    status: 'ready',
    since: null,
    remainingMs: clampDuration(durationMs),
    doneAt: null,
  };
}

function clampDuration(ms: number): number {
  return Math.min(DURATION_MAX_MS, Math.max(DURATION_MIN_MS, Math.round(ms / 1000) * 1000));
}

export function remaining(timer: Timer, now: Instant): number {
  if (timer.status !== 'running' || !timer.since) return timer.remainingMs;
  return Math.max(0, timer.remainingMs - Math.max(0, now.mono - timer.since.mono));
}

/** Relógio civil em que um temporizador rodando termina; null fora de "rodando". */
export function endsAt(timer: Timer): number | null {
  if (timer.status !== 'running' || !timer.since) return null;
  return timer.since.wall + timer.remainingMs;
}

export function start(timer: Timer, now: Instant): Timer {
  if (timer.status === 'running' || timer.status === 'done') return timer;
  return { ...timer, status: 'running', since: now };
}

export function pause(timer: Timer, now: Instant): Timer {
  if (timer.status !== 'running') return timer;
  return { ...timer, status: 'paused', since: null, remainingMs: remaining(timer, now) };
}

/** Repetir: volta ao tempo cheio e já começa (a conclusão anterior fica para trás). */
export function repeat(timer: Timer, now: Instant): Timer {
  return {
    ...timer,
    status: 'running',
    since: now,
    remainingMs: timer.durationMs,
    doneAt: null,
  };
}

/** Zerar: volta ao tempo cheio, parado. */
export function reset(timer: Timer): Timer {
  return { ...timer, status: 'ready', since: null, remainingMs: timer.durationMs, doneAt: null };
}

/**
 * Uma leitura da lista: quem chegou a zero vira concluído, com a hora exata do fim. Devolve a
 * lista nova e os que acabaram de terminar nesta leitura (para avisar uma vez só).
 */
export function tick(timers: readonly Timer[], now: Instant): { timers: Timer[]; done: Timer[] } {
  const done: Timer[] = [];
  const next = timers.map((timer) => {
    if (timer.status !== 'running' || remaining(timer, now) > 0) return timer;
    const finished: Timer = {
      ...timer,
      status: 'done',
      since: null,
      remainingMs: 0,
      doneAt: endsAt(timer) ?? now.wall,
    };
    done.push(finished);
    return finished;
  });
  return { timers: done.length > 0 ? next : [...timers], done };
}

/** Reabrir o app: `mono` recomeça a cada processo; o marco é recalculado pelo relógio civil. */
export function rebase(timer: Timer, now: Instant): Timer {
  if (timer.status !== 'running' || !timer.since) return timer;
  const away = Math.max(0, now.wall - timer.since.wall);
  return { ...timer, since: { mono: now.mono - away, wall: timer.since.wall } };
}

export function canAdd(timers: readonly Timer[]): boolean {
  return timers.length < TIMERS_MAX;
}

/**
 * Política de colisão (D98): fins a menos de COLLISION_MS um do outro formam um grupo, avisado
 * de uma vez ("Ovo e Chá terminaram"). Grupos em ordem de hora; dentro do grupo, ordem da lista.
 */
export function collide<T extends { at: number }>(items: readonly T[]): T[][] {
  const sorted = [...items].sort((a, b) => a.at - b.at);
  const groups: T[][] = [];
  for (const item of sorted) {
    const last = groups.at(-1);
    const first = last?.[0];
    if (last && first && item.at - first.at < COLLISION_MS) last.push(item);
    else groups.push([item]);
  }
  return groups;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const STATUSES: readonly TimerStatus[] = ['ready', 'running', 'paused', 'done'];

function parseOne(raw: unknown): Timer | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const since = o.since as Record<string, unknown> | null | undefined;
  const sinceOk = since == null || (isNum(since.mono) && isNum(since.wall));
  if (
    typeof o.id !== 'string' ||
    o.id.length === 0 ||
    typeof o.name !== 'string' ||
    !isNum(o.durationMs) ||
    !isNum(o.remainingMs) ||
    !STATUSES.includes(o.status as TimerStatus) ||
    !sinceOk ||
    (o.status === 'running' && since == null) ||
    !(o.doneAt === null || isNum(o.doneAt))
  )
    return null;
  const durationMs = clampDuration(o.durationMs);
  return {
    id: o.id,
    name: o.name.slice(0, NAME_MAX),
    durationMs,
    status: o.status as TimerStatus,
    since: since ? { mono: since.mono as number, wall: since.wall as number } : null,
    remainingMs: Math.min(o.remainingMs, durationMs),
    doneAt: o.doneAt,
  };
}

/** Leitura do gravado: item estranho sai, o resto fica; nunca passa do limite. */
export function parseTimers(raw: unknown): Timer[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Timer[] = [];
  for (const item of raw) {
    const timer = parseOne(item);
    if (!timer || seen.has(timer.id)) continue;
    seen.add(timer.id);
    out.push(timer);
    if (out.length === TIMERS_MAX) break;
  }
  return out;
}
