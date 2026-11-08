// Operações do editor de rotinas (E04, C02). Puras: recebem a rotina em edição e devolvem
// outra, sem mexer na original (o rascunho e o "descartar" dependem disso). Ids vêm de fora.
import { LIMITS } from './limits';
import type { Block, Modality, Routine, Step, StepKind } from './routine';
import type { Words } from './words';

export type NewId = () => string;

function stepOf(kind: StepKind, id: string, w: Words): Step {
  return kind === 'work'
    ? { id, name: w.newWork, kind, seconds: 30, reps: null }
    : { id, name: w.newRest, kind, seconds: 15, reps: null };
}

function blockOf(newId: NewId, number: number, w: Words): Block {
  return {
    id: newId(),
    name: w.newBlock(number),
    repeat: 3,
    steps: [stepOf('work', newId(), w), stepOf('rest', newId(), w)],
    restAfterSeconds: 60,
  };
}

export function newRoutine(modality: Modality, newId: NewId, now: number, w: Words): Routine {
  return {
    id: newId(),
    name: '',
    modality,
    version: 1,
    origin: 'custom',
    prepSeconds: 10,
    blocks: [blockOf(newId, 1, w)],
    cooldownSeconds: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/** "Treino (cópia)", sem passar do limite de letras do nome. */
function copyName(name: string, w: Words): string {
  const base = name.slice(0, LIMITS.nameMax - w.copySuffix.length).trimEnd();
  return `${base}${w.copySuffix}`;
}

/**
 * Cópia editável (de modelo pronto ou rotina própria): ids novos, versão 1, sempre "custom".
 * Modelo pronto mantém o nome; rotina própria ganha "(cópia)".
 */
export function copyRoutine(source: Routine, newId: NewId, now: number, w: Words): Routine {
  return {
    ...source,
    id: newId(),
    name: source.origin === 'preset' ? source.name : copyName(source.name, w),
    origin: 'custom',
    version: 1,
    createdAt: now,
    updatedAt: now,
    blocks: source.blocks.map((block) => ({
      ...block,
      id: newId(),
      steps: block.steps.map((step) => ({ ...step, id: newId() })),
    })),
  };
}

/** Ponto de partida do editor: modelo pronto vira cópia; sem modelo, uma rotina nova. */
export function startFrom(
  preset: Routine | undefined,
  modality: Modality,
  newId: NewId,
  now: number,
  w: Words,
): Routine {
  return preset ? copyRoutine(preset, newId, now, w) : newRoutine(modality, newId, now, w);
}

/** Gravar: versão sobe só quando a rotina já existia. */
export function stamp(routine: Routine, existed: boolean, now: number): Routine {
  return {
    ...routine,
    name: routine.name.trim(),
    version: existed ? routine.version + 1 : routine.version,
    updatedAt: now,
  };
}

function move<T>(list: readonly T[], from: number, to: number): T[] {
  const outside = (i: number) => i < 0 || i >= list.length;
  if (outside(from) || outside(to) || from === to) return [...list];
  const next = [...list];
  // `from` está dentro da lista: o splice devolve exatamente um item.
  const [item] = next.splice(from, 1) as [T];
  next.splice(to, 0, item);
  return next;
}

function withBlock(routine: Routine, at: number, change: (block: Block) => Block): Routine {
  return {
    ...routine,
    blocks: routine.blocks.map((block, i) => (i === at ? change(block) : block)),
  };
}

export const edit = {
  routine(
    routine: Routine,
    patch: Partial<Pick<Routine, 'name' | 'modality' | 'prepSeconds' | 'cooldownSeconds'>>,
  ): Routine {
    return { ...routine, ...patch };
  },
  block(
    routine: Routine,
    at: number,
    patch: Partial<Pick<Block, 'name' | 'repeat' | 'restAfterSeconds'>>,
  ): Routine {
    return withBlock(routine, at, (block) => ({ ...block, ...patch }));
  },
  addBlock(routine: Routine, newId: NewId, w: Words): Routine {
    return {
      ...routine,
      blocks: [...routine.blocks, blockOf(newId, routine.blocks.length + 1, w)],
    };
  },
  removeBlock(routine: Routine, at: number): Routine {
    if (routine.blocks.length <= 1) return routine;
    return { ...routine, blocks: routine.blocks.filter((_, i) => i !== at) };
  },
  moveBlock(routine: Routine, at: number, to: number): Routine {
    return { ...routine, blocks: move(routine.blocks, at, to) };
  },
  /** Insere depois de `after` (-1 = no começo). */
  addStep(
    routine: Routine,
    block: number,
    after: number,
    kind: StepKind,
    newId: NewId,
    w: Words,
  ): Routine {
    return withBlock(routine, block, (b) => {
      const steps = [...b.steps];
      steps.splice(after + 1, 0, stepOf(kind, newId(), w));
      return { ...b, steps };
    });
  },
  step(routine: Routine, block: number, at: number, patch: Partial<Omit<Step, 'id'>>): Routine {
    return withBlock(routine, block, (b) => ({
      ...b,
      steps: b.steps.map((step, i) => (i === at ? normalize({ ...step, ...patch }) : step)),
    }));
  },
  duplicateStep(routine: Routine, block: number, at: number, newId: NewId): Routine {
    return withBlock(routine, block, (b) => {
      const source = b.steps[at];
      if (!source) return b;
      const steps = [...b.steps];
      steps.splice(at + 1, 0, { ...source, id: newId() });
      return { ...b, steps };
    });
  },
  removeStep(routine: Routine, block: number, at: number): Routine {
    return withBlock(routine, block, (b) =>
      b.steps.length <= 1 ? b : { ...b, steps: b.steps.filter((_, i) => i !== at) },
    );
  },
  moveStep(routine: Routine, block: number, at: number, to: number): Routine {
    return withBlock(routine, block, (b) => ({ ...b, steps: move(b.steps, at, to) }));
  },
};

/**
 * Coerência da etapa depois de uma mudança: descanso é sempre por tempo; trocar para
 * repetições zera o tempo e vice-versa, com um valor de partida razoável.
 */
function normalize(step: Step): Step {
  if (step.kind === 'rest' && step.seconds === null) return { ...step, seconds: 15, reps: null };
  if (step.seconds === null) return { ...step, reps: step.reps ?? 10 };
  return { ...step, reps: null };
}
