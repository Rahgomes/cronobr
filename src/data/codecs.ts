// Leitura do que está gravado. Regra: validar LIMITES na entrada (editor, importação) e só a
// FORMA na leitura. Se um limite apertar no futuro, o que já foi gravado continua abrindo.
import { z } from 'zod';

import { NOTE_MAX } from '@/domain/calendar';
import type { Session } from '@/domain/engine';
import type { HistoryEntry } from '@/domain/history';
import { MODALITIES, type Routine } from '@/domain/routine';

const int = z.number().int();

const stepShape = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['work', 'rest']),
  seconds: int.nullable(),
  reps: int.nullable(),
  disabled: z.boolean().optional(),
  sides: z.boolean().optional(),
  early: z.boolean().optional(),
  bpm: int.optional(),
});

export const routineShape: z.ZodType<Routine> = z.object({
  id: z.string(),
  name: z.string(),
  modality: z.enum(MODALITIES),
  version: int,
  origin: z.enum(['preset', 'custom', 'legacy']),
  prepSeconds: int,
  blocks: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      repeat: int,
      steps: z.array(stepShape),
      restAfterSeconds: int,
    }),
  ),
  cooldownSeconds: int,
  createdAt: z.number(),
  updatedAt: z.number(),
});

const instant = z.object({ mono: z.number(), wall: z.number() });

export const sessionShape: z.ZodType<Session> = z.object({
  id: z.string(),
  routine: routineShape,
  status: z.enum(['ready', 'running', 'paused', 'completed', 'interrupted']),
  position: z.object({ segment: int.nonnegative(), elapsedMs: z.number().nonnegative() }),
  since: instant.nullable(),
  activeMs: z.number().nonnegative(),
  startedAt: z.number().nullable(),
  endedAt: z.number().nullable(),
  adjusted: z.boolean(),
  jumped: z.boolean().optional(),
  early: z.object({ segment: int.nonnegative() }).optional(),
  tally: int.nonnegative().optional(),
});

export interface HistoryRow {
  id: string;
  status: string;
  started_at: number;
  ended_at: number;
  active_ms: number;
  work_done: number;
  work_total: number;
  source: string;
  routine: string;
  /** 1 = ajustado; ausente em banco antes da V3. */
  adjusted?: number;
  /** AMRAP: rodadas registradas; null fora do AMRAP ou antes da V4. */
  rounds_logged?: number | null;
  /** Nota da pessoa; null sem nota ou antes da V5. */
  note?: string | null;
}

const historyShape = z.object({
  id: z.string(),
  status: z.enum(['completed', 'interrupted']),
  startedAt: z.number(),
  endedAt: z.number(),
  activeMs: z.number(),
  workDone: z.number(),
  workTotal: z.number(),
  source: z.enum(['app', 'legacy']),
  routine: routineShape,
  adjusted: z.literal(true).optional(),
  rounds: z.number().int().nonnegative().optional(),
  note: z.string().min(1).max(NOTE_MAX).optional(),
});

/** JSON ou forma inválida viram null: quem lê decide pular, sem derrubar a tela. */
export function decode<T>(schema: z.ZodType<T>, text: string): T | null {
  try {
    const result = schema.safeParse(JSON.parse(text));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function historyFromRow(row: HistoryRow): HistoryEntry | null {
  const routine = decode(routineShape, row.routine);
  if (!routine) return null;
  const parsed = historyShape.safeParse({
    id: row.id,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    activeMs: row.active_ms,
    workDone: row.work_done,
    workTotal: row.work_total,
    source: row.source,
    routine,
    // Ausente = não ajustado: o registro de sempre continua igual.
    ...(row.adjusted === 1 ? { adjusted: true } : {}),
    ...(typeof row.rounds_logged === 'number' ? { rounds: row.rounds_logged } : {}),
    ...(typeof row.note === 'string' && row.note !== '' ? { note: row.note } : {}),
  });
  return parsed.success ? parsed.data : null;
}
