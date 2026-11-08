import type { Phase, Segment } from '@/domain/timeline';

export const PHASE_LABEL: Record<Phase, string> = {
  prep: 'Preparação',
  work: 'Exercício',
  rest: 'Descanso',
  blockRest: 'Descanso entre blocos',
  cooldown: 'Desaquecimento',
};

/** "Exercício" ou "Exercício · Agachamento" quando a etapa tem nome próprio. */
export function segmentTitle(segment: Segment): string {
  const label = PHASE_LABEL[segment.phase];
  return segment.name === label ? label : `${label} · ${segment.name}`;
}

export function roundLabel(segment: Segment): string | null {
  if (segment.round === null || segment.rounds === null) return null;
  return `Rodada ${String(segment.round)} de ${String(segment.rounds)}`;
}
