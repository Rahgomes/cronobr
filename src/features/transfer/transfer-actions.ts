// Exportar e preparar importação (E05): junta banco, formato e plano. As telas só mostram.
import type { Repos } from '@/data/repos';
import { dayKey } from '@/domain/calendar';
import type { HistoryEntry } from '@/domain/history';
import { PRESETS } from '@/domain/presets';
import type { Routine } from '@/domain/routine';
import {
  backupFileText,
  fileName,
  MAX_FILE_BYTES,
  readTransferFile,
  routineFileText,
  type FileMeta,
  type ReadResult,
} from '@/domain/transfer';
import { classify, summarize, type BackupSummary, type RoutineItem } from '@/domain/transfer-plan';

import { APP_VERSION, type FilePort } from './file-port';
import { PORTABLE_PREF_KEYS, portablePrefs } from './portable-prefs';

export async function shareRoutine(port: FilePort, routine: Routine, now = Date.now()) {
  await port.share(fileName(routine.name), routineFileText(routine, APP_VERSION, now));
}

/** Texto de um backup completo do estado atual (também é o ponto de restauração). */
export async function backupText(repos: Repos, withHistory: boolean, now = Date.now()) {
  const snap = await repos.transfer.snapshot(PORTABLE_PREF_KEYS, withHistory);
  return backupFileText(snap, APP_VERSION, now);
}

export async function exportBackup(
  repos: Repos,
  port: FilePort,
  withHistory: boolean,
  now = Date.now(),
) {
  const text = await backupText(repos, withHistory, now);
  await port.share(`cronobr-backup-${dayKey(now)}.cronobr`, text);
}

export type Prepared =
  | { kind: 'error'; message: string; details: string[] }
  | { kind: 'routine'; meta: FileMeta; item: RoutineItem }
  | {
      kind: 'backup';
      meta: FileMeta;
      items: RoutineItem[];
      routines: Routine[];
      history: HistoryEntry[] | null;
      summary: BackupSummary;
      /** Preferências já adaptadas a este aparelho (usadas só ao substituir). */
      prefs: Record<string, unknown>;
      notes: string[];
      prefCount: number;
      /** Há treino em andamento: substituir fica bloqueado até ele acabar. */
      sessionActive: boolean;
    };

const presetIds = PRESETS.map((preset) => preset.id);

async function prepareFromText(
  repos: Repos,
  text: string,
  size: number,
  now = Date.now(),
): Promise<Prepared> {
  const read: ReadResult = readTransferFile(text, size, now);
  if (!read.ok) return { kind: 'error', message: read.message, details: read.details };
  const library = await repos.routines.list();
  const { file } = read;
  if (file.kind === 'routine') {
    const [item] = classify([file.routine], library);
    return {
      kind: 'routine',
      meta: file.meta,
      item: item ?? { routine: file.routine, status: 'new' },
    };
  }
  const items = classify(file.routines, library);
  const known = new Set([...presetIds, ...file.routines.map((routine) => routine.id)]);
  const { prefs, notes } = portablePrefs(file.prefs, known);
  const [historyIds, session] = await Promise.all([
    repos.transfer.historyIds(),
    repos.session.load(),
  ]);
  return {
    kind: 'backup',
    meta: file.meta,
    items,
    routines: file.routines,
    history: file.history,
    summary: summarize(items, file.history, historyIds),
    prefs,
    notes,
    prefCount: Object.keys(prefs).length,
    sessionActive: session !== null,
  };
}

export async function prepareFromUri(
  repos: Repos,
  port: FilePort,
  uri: string,
  now = Date.now(),
): Promise<Prepared> {
  try {
    const { text, size } = await port.read(uri, MAX_FILE_BYTES);
    return await prepareFromText(repos, text, size, now);
  } catch {
    return {
      kind: 'error',
      message: 'Não deu para abrir o arquivo. Tente escolher de novo pelo CronôBR.',
      details: [],
    };
  }
}
