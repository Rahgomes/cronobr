// Registro de treino: cópia da rotina que rodou (editar a rotina depois não muda o passado).
import type { Session } from './engine';
import type { Routine } from './routine';
import type { Segment } from './timeline';

export type HistoryStatus = 'completed' | 'interrupted';

export interface HistoryEntry {
  /** Mesmo id da sessão: gravar duas vezes a mesma conclusão é impossível por chave. */
  id: string;
  routine: Routine;
  status: HistoryStatus;
  startedAt: number;
  endedAt: number;
  activeMs: number;
  workDone: number;
  workTotal: number;
  source: 'app' | 'legacy';
}

/** null enquanto a sessão não terminou (ou terminou sem nunca ter começado). */
export function historyFromSession(
  session: Session,
  timeline: readonly Segment[],
): HistoryEntry | null {
  if (session.status !== 'completed' && session.status !== 'interrupted') return null;
  if (session.startedAt === null || session.endedAt === null) return null;
  const work = timeline.filter((segment) => segment.phase === 'work');
  const workDone = work.filter((segment) => segment.index < session.position.segment).length;
  return {
    id: session.id,
    routine: session.routine,
    status: session.status,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    activeMs: Math.round(session.activeMs),
    workDone: session.status === 'completed' ? work.length : workDone,
    workTotal: work.length,
    source: 'app',
  };
}
