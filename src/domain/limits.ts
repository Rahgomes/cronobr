// Limites explícitos e mensagens úteis. O mesmo schema valida o editor (E04) e o
// arquivo importado (E05), então nada inválido chega ao motor por nenhuma porta.
import { z } from 'zod';

import { BPM_MAX, BPM_MIN } from './metronome';
import { MODALITIES, type Routine } from './routine';
import { buildTimeline, summarize } from './timeline';
import type { LimitWords, Words } from './words';

export const LIMITS = {
  nameMax: 60,
  stepMinSeconds: 1,
  stepMaxSeconds: 3 * 60 * 60,
  prepMaxSeconds: 10 * 60,
  cooldownMaxSeconds: 30 * 60,
  blockRestMaxSeconds: 60 * 60,
  repsMax: 999,
  repeatMax: 99,
  blocksMax: 20,
  stepsPerBlockMax: 50,
  segmentsMax: 2000,
  totalMaxMs: 6 * 60 * 60 * 1000,
} as const;

/** Os limites são sempre horas ou minutos redondos (ver LIMITS). */
function formatLimit(totalSeconds: number, m: LimitWords): string {
  if (totalSeconds % 3600 === 0) return m.hours(totalSeconds / 3600);
  return m.minutes(totalSeconds / 60);
}

function capital(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** O schema com as mensagens de uma língua. Montado uma vez por língua. */
function schemaFor(m: LimitWords) {
  const name = (label: string) =>
    z
      .string()
      .trim()
      .min(1, m.nameEmpty(label))
      .max(LIMITS.nameMax, m.nameLong(label, LIMITS.nameMax));

  const seconds = (label: string, min: number, max: number) =>
    z
      .number({ error: m.required(label) })
      .int(capital(m.wholeSeconds(label)))
      .min(min, capital(min === 0 ? m.negative(label) : m.atLeast(label, min)))
      .max(max, capital(m.atMost(label, formatLimit(max, m))));

  const { subject } = m;
  const stepSchema = z
    .object({
      id: z.string().min(1),
      name: name(subject.stepName),
      kind: z.enum(['work', 'rest']),
      seconds: seconds(subject.stepTime, LIMITS.stepMinSeconds, LIMITS.stepMaxSeconds).nullable(),
      reps: z
        .number()
        .int(m.repsWhole)
        .min(1, m.repsMin)
        .max(LIMITS.repsMax, m.repsMax(LIMITS.repsMax))
        .nullable(),
      disabled: z.boolean().optional(),
      sides: z.boolean().optional(),
      early: z.boolean().optional(),
      bpm: z
        .number()
        .int(m.bpmRange(BPM_MIN, BPM_MAX))
        .min(BPM_MIN, m.bpmRange(BPM_MIN, BPM_MAX))
        .max(BPM_MAX, m.bpmRange(BPM_MIN, BPM_MAX))
        .optional(),
    })
    .refine((step) => step.seconds !== null || step.reps !== null, {
      message: m.repsNeeded,
      path: ['reps'],
    })
    .refine((step) => step.seconds !== null || step.kind === 'work', {
      message: m.restNeedsTime,
      path: ['seconds'],
    });

  const blockSchema = z
    .object({
      id: z.string().min(1),
      name: name(subject.blockName),
      repeat: z
        .number()
        .int(m.roundsWhole)
        .min(1, m.roundsMin)
        .max(LIMITS.repeatMax, m.roundsMax(LIMITS.repeatMax)),
      steps: z
        .array(stepSchema)
        .min(1, m.stepsMin)
        .max(LIMITS.stepsPerBlockMax, m.stepsMax(LIMITS.stepsPerBlockMax)),
      restAfterSeconds: seconds(subject.blockRest, 0, LIMITS.blockRestMaxSeconds),
    })
    .refine(
      (block) =>
        block.steps.length === 0 ||
        block.steps.some((step) => step.kind === 'work' && !step.disabled),
      { message: m.activeWork, path: ['steps'] },
    );

  return z
    .object({
      id: z.string().min(1),
      name: name(subject.routineName),
      modality: z.enum(MODALITIES),
      version: z.number().int().min(1),
      origin: z.enum(['preset', 'custom', 'legacy']),
      prepSeconds: seconds(subject.prep, 0, LIMITS.prepMaxSeconds),
      blocks: z
        .array(blockSchema)
        .min(1, m.blocksMin)
        .max(LIMITS.blocksMax, m.blocksMax(LIMITS.blocksMax)),
      cooldownSeconds: seconds(subject.cooldown, 0, LIMITS.cooldownMaxSeconds),
      createdAt: z.number().int().nonnegative(),
      updatedAt: z.number().int().nonnegative(),
    })
    .superRefine((routine, ctx) => {
      const summary = summarize(buildTimeline(routine));
      if (summary.segments > LIMITS.segmentsMax) {
        ctx.addIssue({
          code: 'custom',
          message: m.segments(summary.segments, LIMITS.segmentsMax),
          path: ['blocks'],
        });
      }
      if (summary.knownMs > LIMITS.totalMaxMs) {
        ctx.addIssue({
          code: 'custom',
          message: m.total(formatLimit(LIMITS.totalMaxMs / 1000, m)),
          path: ['blocks'],
        });
      }
    });
}

const schemas = new WeakMap<LimitWords, ReturnType<typeof schemaFor>>();

export interface RoutineIssue {
  path: string;
  message: string;
}

export type RoutineCheck = { ok: true; routine: Routine } | { ok: false; issues: RoutineIssue[] };

export function checkRoutine(input: unknown, w: Words): RoutineCheck {
  let schema = schemas.get(w.limits);
  if (!schema) {
    schema = schemaFor(w.limits);
    schemas.set(w.limits, schema);
  }
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, routine: result.data };
  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  };
}
