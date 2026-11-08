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
  /** Houve salto pela lista ou o tempo foi recalculado pelo relógio: vale, mas não é limpo. */
  adjusted?: true | undefined;
  /** AMRAP: rodadas registradas na sessão. */
  rounds?: number | undefined;
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
    ...(session.adjusted || session.jumped ? { adjusted: true as const } : {}),
    ...(session.tally === undefined ? {} : { rounds: session.tally }),
  };
}

export interface RecentRoutine {
  /** Registro de onde veio: "Repetir" usa a cópia exata que rodou. */
  entryId: string;
  routine: Routine;
  lastEndedAt: number;
}

/**
 * Rotinas feitas por último, sem repetir (a mais recente de cada id), na ordem do histórico.
 * Recebe o histórico já do mais novo para o mais velho.
 */
export function recentRoutines(entries: readonly HistoryEntry[], max: number): RecentRoutine[] {
  const seen = new Set<string>();
  const result: RecentRoutine[] = [];
  for (const entry of entries) {
    if (result.length >= max) break;
    if (seen.has(entry.routine.id)) continue;
    seen.add(entry.routine.id);
    result.push({ entryId: entry.id, routine: entry.routine, lastEndedAt: entry.endedAt });
  }
  return result;
}
