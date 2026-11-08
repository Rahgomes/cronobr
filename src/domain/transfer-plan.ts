// O que importar um arquivo vai fazer, decidido antes de tocar no banco (E05). A tela mostra este
// plano como prévia; o banco aplica as operações numa transação só.
import { copyRoutine, type NewId } from './editor';
import type { HistoryEntry } from './history';
import type { Routine } from './routine';
import { fingerprint, type TransferFile } from './transfer';
import type { Words } from './words';

/** new: não existe aqui · same: já existe igual (pelo id ou pelo conteúdo) · conflict: mesmo id, conteúdo diferente. */
export type RoutineStatus = 'new' | 'same' | 'conflict';

export interface RoutineItem {
  routine: Routine;
  status: RoutineStatus;
  /** A rotina daqui que casou (same ou conflict). */
  existing?: Routine | undefined;
}

export function classify(incoming: readonly Routine[], library: readonly Routine[]): RoutineItem[] {
  const byId = new Map(library.map((routine) => [routine.id, routine]));
  const byContent = new Map(library.map((routine) => [fingerprint(routine), routine]));
  return incoming.map((routine) => {
    const sameId = byId.get(routine.id);
    if (sameId) {
      const status = fingerprint(sameId) === fingerprint(routine) ? 'same' : 'conflict';
      return { routine, status, existing: sameId };
    }
    const sameContent = byContent.get(fingerprint(routine));
    return sameContent
      ? { routine, status: 'same', existing: sameContent }
      : { routine, status: 'new' };
  });
}

/** Operações que o banco aplica de uma vez (tudo ou nada). */
export interface TransferOps {
  /** Substituir: apaga as rotinas e as preferências portáveis antes de gravar. */
  replace: boolean;
  /** Gravadas por id (atualiza se existir), na ordem: a primeira fica no topo. */
  routines: Routine[];
  /** Entram por id: o que já existe fica como está (importar de novo não duplica). */
  history: HistoryEntry[];
  /** Substituir também o histórico (só quando o backup trouxe histórico). */
  replaceHistory: boolean;
  /** Preferências gravadas por chave; null não mexe. */
  prefs: Record<string, unknown> | null;
}

/** Cópia com ids novos e "(cópia)" no nome, sem passar do limite de letras. */
export function asCopy(routine: Routine, newId: NewId, now: number, w: Words): Routine {
  return copyRoutine({ ...routine, origin: 'custom' }, newId, now, w);
}

export type ShareChoice = 'add' | 'copy' | 'update';

/** Rotina compartilhada: adicionar (nova), adicionar como cópia, ou atualizar a existente. */
export function shareOps(
  item: RoutineItem,
  choice: ShareChoice,
  newId: NewId,
  now: number,
  w: Words,
): TransferOps {
  const base = { replace: false, history: [], replaceHistory: false, prefs: null };
  if (choice === 'update' && item.existing) {
    const updated: Routine = {
      ...item.routine,
      id: item.existing.id,
      origin: 'custom',
      version: item.existing.version + 1,
      createdAt: item.existing.createdAt,
      updatedAt: now,
    };
    return { ...base, routines: [updated] };
  }
  if (choice === 'copy' || item.status !== 'new')
    return { ...base, routines: [asCopy(item.routine, newId, now, w)] };
  return { ...base, routines: [{ ...item.routine, origin: 'custom' }] };
}

export type ConflictChoice = 'copy' | 'update';

/**
 * Juntar o backup com o que já existe: rotinas novas entram, iguais ficam, conflito vira cópia ou
 * atualiza (escolha explícita). Histórico entra por id. Preferências daqui não mudam.
 */
export function mergeOps(
  items: readonly RoutineItem[],
  history: readonly HistoryEntry[] | null,
  conflicts: ConflictChoice,
  newId: NewId,
  now: number,
  w: Words,
): TransferOps {
  const routines = items.flatMap((item): Routine[] => {
    if (item.status === 'new') return [item.routine];
    if (item.status === 'same') return [];
    if (conflicts === 'copy') return [asCopy(item.routine, newId, now, w)];
    const existing = item.existing ?? item.routine;
    return [{ ...item.routine, version: existing.version + 1, updatedAt: now }];
  });
  return {
    replace: false,
    routines,
    history: [...(history ?? [])],
    replaceHistory: false,
    prefs: null,
  };
}

/** Restaurar: a biblioteca e as preferências ficam iguais às do arquivo. */
export function replaceOps(file: Extract<TransferFile, { kind: 'backup' }>): TransferOps {
  return {
    replace: true,
    routines: file.routines,
    history: file.history ?? [],
    replaceHistory: file.history !== null,
    prefs: file.prefs,
  };
}

export interface BackupSummary {
  routines: Record<RoutineStatus, number>;
  /** null: backup sem histórico. */
  history: { total: number; fresh: number } | null;
}

export function summarize(
  items: readonly RoutineItem[],
  history: readonly HistoryEntry[] | null,
  historyIds: ReadonlySet<string>,
): BackupSummary {
  const routines = { new: 0, same: 0, conflict: 0 };
  for (const item of items) routines[item.status] += 1;
  return {
    routines,
    history: history
      ? {
          total: history.length,
          fresh: history.filter((entry) => !historyIds.has(entry.id)).length,
        }
      : null,
  };
}
