import { block, routine, step } from '@/test/domain';

import { eventsBetween } from './events';
import { buildTimeline } from './timeline';

// prep 10 · work 40 · rest 10 · work 40
const tl = buildTimeline(
  routine({
    prepSeconds: 10,
    blocks: [
      block({ steps: [step({ kind: 'work', seconds: 40 }), step({ kind: 'rest', seconds: 10 })] }),
    ],
  }),
);
const read = (segment: number, seconds: number, finished = false) => ({
  segment,
  elapsedMs: seconds * 1000,
  finished,
});

/** Simula ticks regulares de 250 ms do início ao fim e devolve tudo que disparou. */
function run(stepMs = 250) {
  const events = [];
  let prev = read(0, 0);
  const offsets = [0, 10, 50, 60];
  for (let tick = stepMs; tick < 100_000 + stepMs; tick += stepMs) {
    const ms = Math.min(tick, 100_000);
    const segment = offsets.filter((o) => o * 1000 <= ms).length - 1;
    const next =
      ms >= 100_000 ? read(4, 0, true) : read(segment, ms / 1000 - (offsets[segment] ?? 0));
    events.push(...eventsBetween(tl, prev, next));
    prev = next;
  }
  return events;
}

describe('eventos', () => {
  it('sessão inteira com ticks regulares: cada aviso uma vez, na ordem', () => {
    const events = run();
    const types = events.map((e) =>
      e.type === 'countdown' ? `${e.type}${String(e.value)}` : e.type,
    );
    expect(types).toEqual([
      ...['countdown3', 'countdown2', 'countdown1', 'phase'],
      ...['halfway', 'countdown3', 'countdown2', 'countdown1', 'phase'],
      ...['countdown3', 'countdown2', 'countdown1', 'phase'],
      ...['halfway', 'countdown3', 'countdown2', 'countdown1', 'completed'],
    ]);
    expect(events.filter((e) => e.type === 'phase').every((e) => !e.late)).toBe(true);
  });

  it('ticks irregulares não mudam o resultado (1 s e 37 ms)', () => {
    expect(run(1000)).toEqual(run());
    expect(run(37).map((e) => e.type)).toEqual(run().map((e) => e.type));
  });

  it('a mesma leitura duas vezes não dispara nada', () => {
    expect(eventsBetween(tl, read(1, 5), read(1, 5))).toEqual([]);
  });

  it('volta da suspensão no meio da fase: só a fase atual, marcada como atrasada', () => {
    expect(eventsBetween(tl, read(0, 2), read(2, 4))).toEqual([
      { type: 'phase', segment: 2, phase: 'rest', late: true },
    ]);
  });

  it('volta perto do fim da fase: contagem que ainda vale toca, a vencida não', () => {
    // rest de 10 s: 3 em 7 s, 2 em 8 s, 1 em 9 s; leitura em 8,6 s
    expect(eventsBetween(tl, read(0, 2), read(2, 8.6))).toEqual([
      { type: 'phase', segment: 2, phase: 'rest', late: true },
      { type: 'countdown', segment: 2, value: 2 },
    ]);
  });

  it('metade só em trabalho de 30 s ou mais', () => {
    const short = buildTimeline(
      routine({ blocks: [block({ repeat: 1, steps: [step({ kind: 'work', seconds: 20 })] })] }),
    );
    expect(eventsBetween(short, read(0, 9), read(0, 10.2))).toEqual([]);
    expect(eventsBetween(tl, read(1, 19.9), read(1, 20.1))).toEqual([
      { type: 'halfway', segment: 1 },
    ]);
  });

  it('reiniciar a etapa (voltar) anuncia a fase de novo', () => {
    expect(eventsBetween(tl, read(1, 15), read(1, 0))).toEqual([
      { type: 'phase', segment: 1, phase: 'work', late: false },
    ]);
  });

  it('etapa manual: anuncia a fase e não conta', () => {
    const manual = buildTimeline(
      routine({
        blocks: [block({ repeat: 1, steps: [step({ kind: 'work', seconds: null, reps: 8 })] })],
      }),
    );
    expect(eventsBetween(manual, read(0, 0), read(0, 999))).toEqual([]);
    expect(eventsBetween(manual, read(0, 0, true), read(0, 1))).toEqual([
      { type: 'phase', segment: 0, phase: 'work', late: false },
    ]);
  });

  it('concluído uma vez; leitura fora da linha do tempo não quebra', () => {
    expect(eventsBetween(tl, read(4, 0, true), read(4, 0, true))).toEqual([]);
    expect(eventsBetween(tl, read(0, 0), read(99, 0))).toEqual([]);
  });
});
