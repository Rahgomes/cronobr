import { PHASE_LABEL } from '@/domain/cues';
import type { Segment } from '@/domain/timeline';

/** "Exercício" ou "Exercício · Agachamento" quando a etapa tem nome próprio. */
export function segmentTitle(segment: Segment): string {
  const label = PHASE_LABEL[segment.phase];
  return segment.name === label ? label : `${label} · ${segment.name}`;
}

export function roundLabel(segment: Segment): string | null {
  if (segment.round === null || segment.rounds === null) return null;
  return `Rodada ${String(segment.round)} de ${String(segment.rounds)}`;
}
