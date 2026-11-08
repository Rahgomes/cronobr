// Limites explícitos e mensagens úteis. O mesmo schema valida o editor (E04) e o
// arquivo importado (E05), então nada inválido chega ao motor por nenhuma porta.
import { z } from 'zod';

import { MODALITIES, type Routine } from './routine';
import { buildTimeline, summarize } from './timeline';

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

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Dê um nome ${label}.`)
    .max(LIMITS.nameMax, `O nome ${label} pode ter até ${String(LIMITS.nameMax)} letras.`);

const seconds = (label: string, min: number, max: number) =>
  z
    .number({ error: `Informe ${label}.` })
    .int(`${capital(label)} precisa ser em segundos inteiros.`)
    .min(
      min,
      min === 0
        ? `${capital(label)} não pode ser menor que zero.`
        : `${capital(label)} precisa ter pelo menos ${String(min)} s.`,
    )
    .max(max, `${capital(label)} pode ter até ${formatLimit(max)}.`);

function capital(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Os limites são sempre horas ou minutos redondos (ver LIMITS). */
function formatLimit(totalSeconds: number): string {
  if (totalSeconds % 3600 === 0) return `${String(totalSeconds / 3600)} h`;
  return `${String(totalSeconds / 60)} min`;
}

const stepSchema = z
  .object({
    id: z.string().min(1),
    name: name('da etapa'),
    kind: z.enum(['work', 'rest']),
    seconds: seconds('o tempo da etapa', LIMITS.stepMinSeconds, LIMITS.stepMaxSeconds).nullable(),
    reps: z
      .number()
      .int('As repetições precisam ser um número inteiro.')
      .min(1, 'Informe pelo menos 1 repetição.')
      .max(LIMITS.repsMax, `As repetições podem ir até ${String(LIMITS.repsMax)}.`)
      .nullable(),
  })
  .refine((step) => step.seconds !== null || step.reps !== null, {
    message: 'Etapa sem tempo precisa de repetições.',
    path: ['reps'],
  })
  .refine((step) => step.seconds !== null || step.kind === 'work', {
    message: 'Descanso precisa de tempo.',
    path: ['seconds'],
  });

const blockSchema = z
  .object({
    id: z.string().min(1),
    name: name('do bloco'),
    repeat: z
      .number()
      .int('As rodadas precisam ser um número inteiro.')
      .min(1, 'O bloco precisa de pelo menos 1 rodada.')
      .max(LIMITS.repeatMax, `O bloco pode ter até ${String(LIMITS.repeatMax)} rodadas.`),
    steps: z
      .array(stepSchema)
      .min(1, 'O bloco precisa de pelo menos 1 etapa.')
      .max(
        LIMITS.stepsPerBlockMax,
        `O bloco pode ter até ${String(LIMITS.stepsPerBlockMax)} etapas.`,
      ),
    restAfterSeconds: seconds('o descanso entre blocos', 0, LIMITS.blockRestMaxSeconds),
  })
  .refine((block) => block.steps.length === 0 || block.steps.some((step) => step.kind === 'work'), {
    message: 'O bloco precisa de pelo menos 1 etapa de exercício.',
    path: ['steps'],
  });

const routineSchema = z
  .object({
    id: z.string().min(1),
    name: name('da rotina'),
    modality: z.enum(MODALITIES),
    version: z.number().int().min(1),
    origin: z.enum(['preset', 'custom', 'legacy']),
    prepSeconds: seconds('a preparação', 0, LIMITS.prepMaxSeconds),
    blocks: z
      .array(blockSchema)
      .min(1, 'A rotina precisa de pelo menos 1 bloco.')
      .max(LIMITS.blocksMax, `A rotina pode ter até ${String(LIMITS.blocksMax)} blocos.`),
    cooldownSeconds: seconds('o desaquecimento', 0, LIMITS.cooldownMaxSeconds),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
  })
  .superRefine((routine, ctx) => {
    const summary = summarize(buildTimeline(routine));
    if (summary.segments > LIMITS.segmentsMax) {
      ctx.addIssue({
        code: 'custom',
        message: `A rotina ficou com ${String(summary.segments)} etapas no total; o máximo é ${String(LIMITS.segmentsMax)}. Diminua as rodadas.`,
        path: ['blocks'],
      });
    }
    if (summary.knownMs > LIMITS.totalMaxMs) {
      ctx.addIssue({
        code: 'custom',
        message: `A rotina passa de ${formatLimit(LIMITS.totalMaxMs / 1000)}. Divida em duas.`,
        path: ['blocks'],
      });
    }
  });

export interface RoutineIssue {
  path: string;
  message: string;
}

export type RoutineCheck = { ok: true; routine: Routine } | { ok: false; issues: RoutineIssue[] };

export function checkRoutine(input: unknown): RoutineCheck {
  const result = routineSchema.safeParse(input);
  if (result.success) return { ok: true, routine: result.data };
  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  };
}
