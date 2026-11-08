// Progresso para o anel e a barra. Etapa por repetições não tem tempo: com ela na rotina, o
// treino anda por etapa (cada uma vale igual), senão anda pelo tempo. Nunca inventa duração.
import type { Snapshot } from './engine';
import type { Segment } from './timeline';

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Quanto da etapa atual já foi (0..1). Etapa manual: 0 até "Concluí". */
export function phaseProgress(timeline: readonly Segment[], snap: Snapshot): number {
  if (snap.finished) return 1;
  const duration = timeline[snap.segment]?.durationMs;
  if (!duration) return 0;
  return clamp(snap.elapsedMs / duration);
}

/** Quanto do treino já foi (0..1). */
export function overallProgress(timeline: readonly Segment[], snap: Snapshot): number {
  if (snap.finished || timeline.length === 0) return 1;
  const manual = timeline.some((segment) => segment.durationMs === null);
  if (manual) return clamp((snap.segment + phaseProgress(timeline, snap)) / timeline.length);
  // Sem etapa manual: toda duração é número.
  const total = timeline.reduce((sum, segment) => sum + Number(segment.durationMs), 0);
  return clamp(1 - snap.totalRemainingMs / total);
}

export type RowState = 'done' | 'current' | 'next';

/** Situação de cada linha na visualização Lista. */
export function rowState(index: number, snap: Snapshot): RowState {
  if (snap.finished || index < snap.segment) return 'done';
  return index === snap.segment ? 'current' : 'next';
}
