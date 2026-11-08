// Ajudantes só de teste: rotina mínima e relógio controlado.
import type { Instant } from '@/domain/engine';
import type { Block, Routine, Step } from '@/domain/routine';

export function step(over: Partial<Step> & Pick<Step, 'kind'>): Step {
  return {
    id: `s-${over.kind}-${String(over.seconds)}`,
    name: over.kind === 'work' ? 'Trabalho' : 'Pausa',
    seconds: 10,
    reps: null,
    ...over,
  };
}

export function block(over: Partial<Block> = {}): Block {
  return {
    id: 'b',
    name: 'Bloco',
    repeat: 2,
    steps: [step({ kind: 'work', seconds: 20 }), step({ kind: 'rest', seconds: 10 })],
    restAfterSeconds: 0,
    ...over,
  };
}

export function routine(over: Partial<Routine> = {}): Routine {
  return {
    id: 'r1',
    name: 'Teste',
    modality: 'personalizada',
    version: 1,
    origin: 'custom',
    prepSeconds: 0,
    blocks: [block()],
    cooldownSeconds: 0,
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

/** Relógio de teste: `mono` e `wall` andam juntos, a não ser que o teste os separe. */
export function clockAt(mono: number, wallOffset = 1_700_000_000_000): Instant {
  return { mono, wall: mono + wallOffset };
}

/** Para testes: falha com mensagem clara em vez do `!` (proibido pelo lint). */
export function must<T>(value: T | null | undefined, what = 'valor'): T {
  if (value === null || value === undefined) throw new Error(`${what} ausente no teste`);
  return value;
}
