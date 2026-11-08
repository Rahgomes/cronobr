// Linha do tempo: a rotina "desenrolada" em segmentos. A prévia (total) e a execução (motor)
// leem a MESMA lista, então não podem discordar sobre o descanso final.
import type { Routine, Step } from './routine';

export type Phase = 'prep' | 'work' | 'rest' | 'blockRest' | 'cooldown';

export interface Segment {
  index: number;
  phase: Phase;
  name: string;
  /** null = etapa manual (por repetições). */
  durationMs: number | null;
  reps: number | null;
  /** Posição do bloco (0..n-1) e rodada (1..repeat); null fora dos blocos. */
  block: number | null;
  round: number | null;
  rounds: number | null;
  /** EMOM: "Terminei" antes do fim transforma o resto em descanso. */
  early?: boolean | undefined;
}

type Draft = Omit<Segment, 'index'>;

const SECOND = 1000;
const SIDES = ['lado esquerdo', 'lado direito'] as const;

function stepDraft(step: Step, block: number, round: number, rounds: number, side?: string): Draft {
  return {
    phase: step.kind,
    name: side ? `${step.name}, ${side}` : step.name,
    ...(step.early && step.kind === 'work' && step.seconds !== null ? { early: true } : {}),
    durationMs: step.seconds === null ? null : step.seconds * SECOND,
    reps: step.reps,
    block,
    round,
    rounds,
  };
}

function plain(phase: Phase, name: string, seconds: number): Draft {
  return {
    phase,
    name,
    durationMs: seconds * SECOND,
    reps: null,
    block: null,
    round: null,
    rounds: null,
  };
}

/**
 * Regra do descanso final (D11): na ÚLTIMA rodada de cada bloco, descansos depois do último
 * trabalho não entram. Entre blocos vale o `restAfterSeconds`; depois do último bloco, nada
 * (o desaquecimento, se houver, é a etapa final). Segmentos de duração zero nunca entram.
 */
export function buildTimeline(routine: Routine): Segment[] {
  const drafts: Draft[] = [];
  if (routine.prepSeconds > 0) drafts.push(plain('prep', 'Preparação', routine.prepSeconds));

  // Etapa desativada some da execução; bloco sem etapa ativa também.
  const blocks = routine.blocks
    .map((block, index) => ({ block, index, steps: block.steps.filter((s) => !s.disabled) }))
    .filter(({ block, steps }) => steps.length > 0 && block.repeat > 0);
  blocks.forEach(({ block, index: blockIndex, steps }, position) => {
    const lastWork = steps.map((step) => step.kind).lastIndexOf('work');
    for (let round = 1; round <= block.repeat; round += 1) {
      const isLastRound = round === block.repeat;
      steps.forEach((step, stepIndex) => {
        if (isLastRound && step.kind === 'rest' && stepIndex > lastWork) return;
        // Mobilidade: a mesma etapa para cada lado, na ordem esquerdo e direito.
        if (step.sides) {
          for (const side of SIDES)
            drafts.push(stepDraft(step, blockIndex, round, block.repeat, side));
        } else {
          drafts.push(stepDraft(step, blockIndex, round, block.repeat));
        }
      });
    }
    const isLastBlock = position === blocks.length - 1;
    if (!isLastBlock && block.restAfterSeconds > 0) {
      drafts.push(plain('blockRest', 'Descanso entre blocos', block.restAfterSeconds));
    }
  });

  if (routine.cooldownSeconds > 0) {
    drafts.push(plain('cooldown', 'Desaquecimento', routine.cooldownSeconds));
  }
  return drafts
    .filter((draft) => draft.durationMs !== 0)
    .map((draft, index) => ({ ...draft, index }));
}

export interface TimelineSummary {
  /** Soma das etapas com tempo. */
  knownMs: number;
  /** Etapas por repetições: o total real depende da pessoa. */
  manualCount: number;
  segments: number;
  /** Rodadas de trabalho (segmentos `work`). */
  workCount: number;
}

export function summarize(timeline: readonly Segment[]): TimelineSummary {
  let knownMs = 0;
  let manualCount = 0;
  let workCount = 0;
  for (const segment of timeline) {
    if (segment.durationMs === null) manualCount += 1;
    else knownMs += segment.durationMs;
    if (segment.phase === 'work') workCount += 1;
  }
  return { knownMs, manualCount, segments: timeline.length, workCount };
}
