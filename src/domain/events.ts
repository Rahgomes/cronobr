// Eventos derivados de duas leituras do motor. Os efeitos (som, voz, vibração, histórico)
// reagem a eles; o motor não sabe que efeitos existem. Cada limiar dispara no intervalo
// (anterior, atual], então leituras repetidas não duplicam nada. Avisos vencidos há mais de
// LATE_MS são descartados: ao voltar da suspensão a pessoa ouve só a fase atual.
import type { Snapshot } from './engine';
import type { Phase, Segment } from './timeline';

const LATE_MS = 1500;
const HALFWAY_MIN_MS = 30_000;

export type SessionEvent =
  | { type: 'phase'; segment: number; phase: Phase; late: boolean }
  | { type: 'countdown'; segment: number; value: 3 | 2 | 1 }
  | { type: 'halfway'; segment: number }
  | { type: 'completed' };

type Reading = Pick<Snapshot, 'segment' | 'elapsedMs' | 'finished'>;

export function eventsBetween(
  timeline: readonly Segment[],
  prev: Reading,
  next: Reading,
): SessionEvent[] {
  if (next.finished) return prev.finished ? [] : [{ type: 'completed' }];

  const current = timeline[next.segment];
  if (!current) return [];
  const changed = prev.finished || next.segment !== prev.segment || next.elapsedMs < prev.elapsedMs;
  const events: SessionEvent[] = [];
  if (changed) {
    events.push({
      type: 'phase',
      segment: next.segment,
      phase: current.phase,
      late: next.elapsedMs > LATE_MS,
    });
  }

  const duration = current.durationMs;
  if (duration === null) return events;
  const from = changed ? 0 : prev.elapsedMs;
  const crossed = (mark: number) =>
    mark > from && mark <= next.elapsedMs && next.elapsedMs - mark <= LATE_MS;

  if (current.phase === 'work' && duration >= HALFWAY_MIN_MS && crossed(duration / 2)) {
    events.push({ type: 'halfway', segment: next.segment });
  }
  for (const value of [3, 2, 1] as const) {
    if (crossed(duration - value * 1000)) {
      events.push({ type: 'countdown', segment: next.segment, value });
    }
  }
  return events;
}
