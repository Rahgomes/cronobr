import type { Segment } from '@/domain/timeline';
import type { Words } from '@/domain/words';

/** "Rodada 2 de 8"; null fora dos blocos. */
export function roundLabel(segment: Segment, w: Words): string | null {
  if (segment.round === null || segment.rounds === null) return null;
  return w.round(segment.round, segment.rounds);
}
