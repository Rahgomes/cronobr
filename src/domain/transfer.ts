// Formato .cronobr (E05): arquivo JSON em UTF-8, versionado, igual no Android, no iPhone e na web.
// Especificação em docs/spec/formato-cronobr.md. O arquivo é só dado: nada nele é executado, e
// tudo passa por schema e pelos mesmos limites do editor antes de chegar ao banco.
import { z } from 'zod';

import type { HistoryEntry } from './history';
import { checkRoutine } from './limits';
import { MODALITIES, type Routine } from './routine';

const FORMAT_ID = 'cronobr';
export const SCHEMA_VERSION = 1;
const FILE_EXTENSION = '.cronobr';
/** Maior arquivo aceito. Um backup com 5 mil treinos fica perto de 6 MB. */
export const MAX_FILE_BYTES = 16 * 1024 * 1024;
const MAX_ROUTINES = 1000;
const MAX_HISTORY = 20_000;

export interface FileMeta {
  schemaVersion: number;
  appVersion: string;
  /** ISO 8601 em UTC. */
  exportedAt: string;
}

export type TransferFile =
  | { kind: 'routine'; meta: FileMeta; routine: Routine }
  | {
      kind: 'backup';
      meta: FileMeta;
      routines: Routine[];
      /** Só as preferências portáveis (ver PORTABLE_PREFS na camada de recursos). */
      prefs: Record<string, unknown>;
      /** null: o backup foi feito sem histórico. */
      history: HistoryEntry[] | null;
    };

// ---------- forma no arquivo ----------

const iso = z.iso.datetime({ offset: true });
const count = z.number().int().nonnegative();
const shortText = (max: number) => z.string().min(1).max(max);

const stepFile = z.object({
  id: shortText(100),
  name: z.string().max(200),
  kind: z.enum(['work', 'rest']),
  seconds: count.nullable(),
  reps: count.nullable(),
  disabled: z.boolean().optional(),
  sides: z.boolean().optional(),
  early: z.boolean().optional(),
});

const blockFile = z.object({
  id: shortText(100),
  name: z.string().max(200),
  repeat: count,
  restAfterSeconds: count,
  steps: z.array(stepFile).max(500),
});

/** Rotina compartilhada: só o necessário para rodar (sem datas, sem origem). */
const routineFile = z.object({
  id: shortText(100),
  name: z.string().max(200),
  modality: z.enum(MODALITIES),
  version: z.number().int().min(1),
  prepSeconds: count,
  cooldownSeconds: count,
  blocks: z.array(blockFile).max(100),
});

/** No backup a rotina leva também origem e datas. */
const libraryRoutineFile = routineFile.extend({
  origin: z.enum(['preset', 'custom', 'legacy']),
  createdAt: iso,
  updatedAt: iso,
});

const historyFile = z.object({
  id: shortText(100),
  routine: libraryRoutineFile,
  status: z.enum(['completed', 'interrupted']),
  startedAt: iso,
  endedAt: iso,
  activeMs: count,
  workDone: count,
  workTotal: count,
  source: z.enum(['app', 'legacy']),
  adjusted: z.literal(true).optional(),
  rounds: count.optional(),
  note: z.string().min(1).max(280).optional(),
});

const header = z.object({
  format: z.literal(FORMAT_ID),
  schemaVersion: z.number().int(),
  appVersion: z.string().max(40),
  exportedAt: iso,
  kind: z.enum(['routine', 'backup']),
});

const routineEnvelope = header.extend({ kind: z.literal('routine'), routine: routineFile });

const backupEnvelope = header.extend({
  kind: z.literal('backup'),
  routines: z.array(libraryRoutineFile).max(MAX_ROUTINES),
  preferences: z.record(z.string().max(60), z.unknown()),
  history: z.array(historyFile).max(MAX_HISTORY).optional(),
});

type RoutineFile = z.infer<typeof routineFile>;
type LibraryRoutineFile = z.infer<typeof libraryRoutineFile>;

// ---------- gravar ----------

const isoOf = (ms: number) => new Date(ms).toISOString();

function routineBody(routine: Routine): RoutineFile {
  return {
    id: routine.id,
    name: routine.name,
    modality: routine.modality,
    version: routine.version,
    prepSeconds: routine.prepSeconds,
    cooldownSeconds: routine.cooldownSeconds,
    blocks: routine.blocks.map((block) => ({
      id: block.id,
      name: block.name,
      repeat: block.repeat,
      restAfterSeconds: block.restAfterSeconds,
      steps: block.steps.map((step) => ({
        id: step.id,
        name: step.name,
        kind: step.kind,
        seconds: step.seconds,
        reps: step.reps,
        ...(step.disabled ? { disabled: true } : {}),
        ...(step.sides ? { sides: true } : {}),
        ...(step.early ? { early: true } : {}),
      })),
    })),
  };
}

function libraryBody(routine: Routine): LibraryRoutineFile {
  return {
    ...routineBody(routine),
    origin: routine.origin,
    createdAt: isoOf(routine.createdAt),
    updatedAt: isoOf(routine.updatedAt),
  };
}

function head(kind: 'routine' | 'backup', appVersion: string, now: number) {
  return {
    format: FORMAT_ID,
    schemaVersion: SCHEMA_VERSION,
    appVersion,
    exportedAt: isoOf(now),
    kind,
  };
}

/** Texto do arquivo de uma rotina para mandar a alguém: sem histórico nem dado pessoal. */
export function routineFileText(routine: Routine, appVersion: string, now: number): string {
  return JSON.stringify({ ...head('routine', appVersion, now), routine: routineBody(routine) });
}

export function backupFileText(
  content: {
    routines: readonly Routine[];
    prefs: Record<string, unknown>;
    history: readonly HistoryEntry[] | null;
  },
  appVersion: string,
  now: number,
): string {
  return JSON.stringify({
    ...head('backup', appVersion, now),
    routines: content.routines.map(libraryBody),
    preferences: content.prefs,
    ...(content.history
      ? {
          history: content.history.map((entry) => ({
            id: entry.id,
            routine: libraryBody(entry.routine),
            status: entry.status,
            startedAt: isoOf(entry.startedAt),
            endedAt: isoOf(entry.endedAt),
            activeMs: entry.activeMs,
            workDone: entry.workDone,
            workTotal: entry.workTotal,
            source: entry.source,
            ...(entry.adjusted ? { adjusted: true } : {}),
            ...(entry.rounds === undefined ? {} : { rounds: entry.rounds }),
            ...(entry.note ? { note: entry.note } : {}),
          })),
        }
      : {}),
  });
}

/** "Treino de perna" → "treino-de-perna.cronobr"; sem letras sobrando, um nome padrão. */
export function fileName(base: string): string {
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return `${slug || 'rotina'}${FILE_EXTENSION}`;
}

// ---------- ler ----------

export type ReadFailure =
  'tooBig' | 'notJson' | 'notCronobr' | 'newerVersion' | 'olderVersion' | 'invalid';

export type ReadResult =
  | { ok: true; file: TransferFile }
  | { ok: false; reason: ReadFailure; message: string; details: string[] };

const fail = (reason: ReadFailure, message: string, details: string[] = []): ReadResult => ({
  ok: false,
  reason,
  message,
  details,
});

function routineFrom(
  body: RoutineFile,
  extra: { origin: Routine['origin']; createdAt: number; updatedAt: number },
): Routine {
  return {
    id: body.id,
    name: body.name,
    modality: body.modality,
    version: body.version,
    prepSeconds: body.prepSeconds,
    cooldownSeconds: body.cooldownSeconds,
    blocks: body.blocks.map((block) => ({
      id: block.id,
      name: block.name,
      repeat: block.repeat,
      restAfterSeconds: block.restAfterSeconds,
      steps: block.steps.map((step) => ({
        id: step.id,
        name: step.name,
        kind: step.kind,
        seconds: step.seconds,
        reps: step.reps,
        ...(step.disabled ? { disabled: true } : {}),
        ...(step.sides ? { sides: true } : {}),
        ...(step.early ? { early: true } : {}),
      })),
    })),
    ...extra,
  };
}

const libraryFrom = (body: LibraryRoutineFile) =>
  routineFrom(body, {
    origin: body.origin,
    createdAt: Date.parse(body.createdAt),
    updatedAt: Date.parse(body.updatedAt),
  });

/** Rotina que vai para a biblioteca passa pelos limites do editor: o motor nunca vê nada pior. */
function checked(routine: Routine, details: string[]): Routine | null {
  const check = checkRoutine(routine);
  if (check.ok) return check.routine;
  const reasons = check.issues.map((issue) => issue.message).join('; ');
  details.push(`"${routine.name || routine.id}": ${reasons}`);
  return null;
}

function issuesOf(error: z.ZodError): string[] {
  return error.issues
    .slice(0, 5)
    .map((issue) => [issue.path.map(String).join('.'), issue.message].filter(Boolean).join(': '));
}

/**
 * Lê o texto de um arquivo. Tudo ou nada: se alguma parte não passa, nada é aproveitado e a
 * mensagem diz o motivo em português. `now` só entra na rotina compartilhada (sem datas).
 */
export function readTransferFile(text: string, byteSize: number, now: number): ReadResult {
  if (byteSize > MAX_FILE_BYTES) {
    return fail(
      'tooBig',
      `O arquivo passa de ${String(MAX_FILE_BYTES / 1024 / 1024)} MB. Exporte de novo sem o histórico.`,
    );
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail('notJson', 'O arquivo está incompleto ou não é do CronôBR.');
  }
  const top = header.safeParse(raw);
  if (!top.success) {
    const format = (raw as { format?: unknown } | null)?.format;
    return format === FORMAT_ID
      ? fail('invalid', 'O arquivo do CronôBR está com o cabeçalho estragado.', issuesOf(top.error))
      : fail('notCronobr', 'Este arquivo não é do CronôBR.');
  }
  if (top.data.schemaVersion > SCHEMA_VERSION) {
    return fail(
      'newerVersion',
      `Este arquivo foi feito por uma versão mais nova do CronôBR (${top.data.appVersion}). Atualize o app para abrir.`,
    );
  }
  if (top.data.schemaVersion < 1) {
    return fail('olderVersion', 'Versão do arquivo desconhecida.');
  }
  const meta: FileMeta = {
    schemaVersion: top.data.schemaVersion,
    appVersion: top.data.appVersion,
    exportedAt: top.data.exportedAt,
  };
  const details: string[] = [];

  if (top.data.kind === 'routine') {
    const parsed = routineEnvelope.safeParse(raw);
    if (!parsed.success)
      return fail('invalid', 'A rotina do arquivo está com dados errados.', issuesOf(parsed.error));
    const routine = checked(
      routineFrom(parsed.data.routine, { origin: 'custom', createdAt: now, updatedAt: now }),
      details,
    );
    if (!routine) return fail('invalid', 'A rotina do arquivo passa dos limites do app.', details);
    return { ok: true, file: { kind: 'routine', meta, routine } };
  }

  const parsed = backupEnvelope.safeParse(raw);
  if (!parsed.success)
    return fail('invalid', 'O backup está com dados errados.', issuesOf(parsed.error));
  const routines = parsed.data.routines.map((body) => checked(libraryFrom(body), details));
  if (details.length > 0)
    return fail('invalid', 'Há rotinas no backup que passam dos limites do app.', details);
  const ids = new Set<string>();
  for (const routine of parsed.data.routines) {
    if (ids.has(routine.id)) details.push(`Rotina repetida no arquivo: "${routine.name}"`);
    ids.add(routine.id);
  }
  if (details.length > 0) return fail('invalid', 'O backup tem rotinas repetidas.', details);
  const history = parsed.data.history?.map((entry): HistoryEntry => ({
    id: entry.id,
    routine: libraryFrom(entry.routine),
    status: entry.status,
    startedAt: Date.parse(entry.startedAt),
    endedAt: Date.parse(entry.endedAt),
    activeMs: entry.activeMs,
    workDone: entry.workDone,
    workTotal: entry.workTotal,
    source: entry.source,
    ...(entry.adjusted ? { adjusted: true as const } : {}),
    ...(entry.rounds === undefined ? {} : { rounds: entry.rounds }),
    ...(entry.note ? { note: entry.note } : {}),
  }));
  return {
    ok: true,
    file: {
      kind: 'backup',
      meta,
      routines: routines.filter((routine): routine is Routine => routine !== null),
      prefs: parsed.data.preferences,
      history: history ?? null,
    },
  };
}

/**
 * O que uma rotina faz, sem ids nem datas: duas rotinas com a mesma impressão são o mesmo treino
 * (duplicata por conteúdo, mesmo com id diferente).
 */
export function fingerprint(routine: Routine): string {
  const { name, modality, prepSeconds, cooldownSeconds, blocks } = routine;
  return JSON.stringify([
    name.trim(),
    modality,
    prepSeconds,
    cooldownSeconds,
    blocks.map((block) => [
      block.name,
      block.repeat,
      block.restAfterSeconds,
      block.steps.map((step) => [
        step.name,
        step.kind,
        step.seconds,
        step.reps,
        !!step.disabled,
        !!step.sides,
        !!step.early,
      ]),
    ]),
  ]);
}
