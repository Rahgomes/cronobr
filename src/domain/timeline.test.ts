import { block, routine, step } from '@/test/domain';

import { buildTimeline, summarize } from './timeline';

const phases = (r = routine()) => buildTimeline(r).map((s) => s.phase);

describe('linha do tempo', () => {
  it('descanso final: a última rodada termina no trabalho (D11)', () => {
    expect(phases()).toEqual(['work', 'rest', 'work']);
  });

  it('preparação e desaquecimento entram só quando têm tempo', () => {
    expect(phases(routine({ prepSeconds: 10, cooldownSeconds: 60 }))).toEqual([
      'prep',
      'work',
      'rest',
      'work',
      'cooldown',
    ]);
    expect(buildTimeline(routine({ prepSeconds: 10 }))[0]).toMatchObject({
      name: 'Preparação',
      durationMs: 10_000,
      block: null,
      round: null,
    });
  });

  it('descanso entre blocos só entre eles, nunca depois do último', () => {
    const r = routine({
      blocks: [
        block({ id: 'a', restAfterSeconds: 60 }),
        block({ id: 'b', repeat: 1, restAfterSeconds: 90 }),
      ],
    });
    expect(phases(r)).toEqual(['work', 'rest', 'work', 'blockRest', 'work']);
    expect(buildTimeline(r)[3]).toMatchObject({
      name: 'Descanso entre blocos',
      durationMs: 60_000,
    });
  });

  it('bloco vazio ou com zero rodadas não gera etapa nem descanso', () => {
    const r = routine({
      blocks: [
        block({ restAfterSeconds: 30 }),
        block({ id: 'vazio', steps: [], restAfterSeconds: 30 }),
        block({ id: 'zero', repeat: 0 }),
      ],
    });
    expect(phases(r)).toEqual(['work', 'rest', 'work']);
  });

  it('descanso no meio do bloco continua na última rodada; só o que vem depois do último trabalho sai', () => {
    const r = routine({
      blocks: [
        block({
          repeat: 2,
          steps: [
            step({ kind: 'work', name: 'Agachamento' }),
            step({ kind: 'rest', name: 'Troca' }),
            step({ kind: 'work', name: 'Flexão' }),
            step({ kind: 'rest', name: 'Respira' }),
            step({ kind: 'rest', name: 'Água' }),
          ],
        }),
      ],
    });
    expect(buildTimeline(r).map((s) => s.name)).toEqual([
      'Agachamento',
      'Troca',
      'Flexão',
      'Respira',
      'Água',
      'Agachamento',
      'Troca',
      'Flexão',
    ]);
  });

  it('etapas de duração zero são puladas e os índices continuam seguidos', () => {
    const r = routine({
      blocks: [
        block({
          repeat: 1,
          steps: [step({ kind: 'work', seconds: 0 }), step({ kind: 'work', seconds: 5 })],
        }),
      ],
    });
    const timeline = buildTimeline(r);
    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toMatchObject({ index: 0, durationMs: 5000 });
  });

  it('rodada, total de rodadas e repetições vão para o segmento', () => {
    const r = routine({
      blocks: [block({ repeat: 3, steps: [step({ kind: 'work', seconds: null, reps: 12 })] })],
    });
    expect(buildTimeline(r)[2]).toMatchObject({
      durationMs: null,
      reps: 12,
      block: 0,
      round: 3,
      rounds: 3,
    });
  });

  it('resumo soma o que tem tempo e conta o que é manual', () => {
    const r = routine({
      prepSeconds: 5,
      blocks: [
        block({
          steps: [
            step({ kind: 'work', seconds: 20 }),
            step({ kind: 'work', seconds: null, reps: 10 }),
          ],
        }),
      ],
    });
    expect(summarize(buildTimeline(r))).toEqual({
      knownMs: 45_000,
      manualCount: 2,
      segments: 5,
      workCount: 4,
    });
  });
});
