import { en } from '@/i18n/messages/en';
import { pt } from '@/i18n/messages/pt';

import { checkRoutine } from './limits';
import {
  withNames,
  LINE_MAX,
  parseSequence,
  SEQUENCE_SETS_MAX,
  sequenceRoutine,
  type SequenceItem,
} from './sequence';
import { buildTimeline } from './timeline';

const W = pt.sequence.words;
const BASE = { id: 'seq', name: 'Joelho', now: 5 };

const one = (line: string) => {
  const { items, issues } = parseSequence(line);
  expect(issues).toEqual([]);
  return items[0];
};

describe('lê a sequência como foi escrita', () => {
  it.each([
    ['Ponte de glúteo 30s', 'Ponte de glúteo', 30, null, 1],
    ['Prancha 20 seg', 'Prancha', 20, null, 1],
    ['Prancha 20 segundos', 'Prancha', 20, null, 1],
    ['Plank 45 seconds', 'Plank', 45, null, 1],
    ['Gainage 30 secondes', 'Gainage', 30, null, 1],
    ['Isometria 20"', 'Isometria', 20, null, 1],
    ['Bicicleta 2 min', 'Bicicleta', 120, null, 1],
    ["Bicicleta 2'", 'Bicicleta', 120, null, 1],
    ['Caminhada 1min30s', 'Caminhada', 90, null, 1],
    ['Caminhada 1m30', 'Caminhada', 90, null, 1],
    ['Caminhada 1:30', 'Caminhada', 90, null, 1],
    ['Agachamento 3x12', 'Agachamento', null, 12, 3],
    ['Agachamento 3 x 12 reps', 'Agachamento', null, 12, 3],
    ['Sentadilla 3×10 repeticiones', 'Sentadilla', null, 10, 3],
    ['Abdominal 15 repetições', 'Abdominal', null, 15, 1],
    ['Abdominal 15x', 'Abdominal', null, 15, 1],
    ['Abdominal x15', 'Abdominal', null, 15, 1],
    ['Squats 12 reps', 'Squats', null, 12, 1],
    ['Prancha 3x30s', 'Prancha', 30, null, 3],
    ['Corrida 4x1min', 'Corrida', 60, null, 4],
    ['Corrida 2 x 1min30s', 'Corrida', 90, null, 2],
    ['Ponte - 30s', 'Ponte', 30, null, 1],
    ['Ponte: 30s', 'Ponte', 30, null, 1],
    ['Ponte (30s)', 'Ponte', 30, null, 1],
  ])('%s', (line, name, seconds, reps, sets) => {
    expect(one(line)).toEqual({ name, kind: 'work', seconds, reps, sides: false, sets });
  });

  it('marcadores de lista, espaços e linhas vazias não atrapalham', () => {
    const { items, issues } = parseSequence(
      '- Ponte 30s\n\n  2) Prancha   20s\r\n• Ponte 10s\n3. Ponte 5s\n',
    );
    expect(issues).toEqual([]);
    expect(items.map((i) => [i.name, i.seconds])).toEqual([
      ['Ponte', 30],
      ['Prancha', 20],
      ['Ponte', 10],
      ['Ponte', 5],
    ]);
  });

  it('"cada lado" em qualquer ponto da linha e nas 4 línguas', () => {
    for (const line of [
      'Concha 12 reps cada lado',
      'Concha de cada lado 12 reps',
      'Concha 12 reps (por lado)',
      'Clamshell 12 reps each side',
      'Clamshell 12 reps per side',
      'Coquillage 12 reps chaque côté',
    ]) {
      expect(one(line)).toMatchObject({ reps: 12, sides: true });
      expect(one(line)?.name).toMatch(/^(Concha|Clamshell|Coquillage)$/);
    }
  });

  it('descanso pelo nome; acento e maiúscula tanto faz', () => {
    expect(one('Descanso 30s')).toMatchObject({ kind: 'rest', name: 'Descanso', seconds: 30 });
    expect(one('RECUPERAÇÃO 1 min')).toMatchObject({ kind: 'rest', seconds: 60 });
    expect(one('Rest 20s')).toMatchObject({ kind: 'rest' });
    expect(one('Repos 20s')).toMatchObject({ kind: 'rest' });
    // "Pausa" no meio não é descanso: é o nome do exercício.
    expect(one('Agachamento com pausa 20s')).toMatchObject({ kind: 'work' });
  });

  it('linha só com o tempo fica sem nome (o app dá um)', () => {
    expect(one('30s')).toMatchObject({ name: '', seconds: 30 });
  });

  it('o que não entende volta com a linha certa, e o resto segue', () => {
    const long = `Ponte ${'a'.repeat(LINE_MAX)} 30s`;
    const text = [
      'Ponte 30s',
      'Prancha',
      '',
      'Descanso 10 reps',
      `Agachamento ${String(SEQUENCE_SETS_MAX + 1)}x10`,
      long,
    ].join('\n');
    const { items, issues } = parseSequence(text);
    expect(items).toHaveLength(1);
    expect(issues.map((i) => [i.line, i.kind])).toEqual([
      [2, 'noAmount'],
      [4, 'restNeedsTime'],
      [5, 'tooManySets'],
      [6, 'tooLong'],
    ]);
    expect(issues[0]?.text).toBe('Prancha');
    expect(issues[3]?.text).toHaveLength(41);
  });

  it('0 séries conta como uma', () => {
    expect(one('Ponte 0x30s')).toMatchObject({ sets: 1, seconds: 30 });
  });

  it('texto enorme não trava (linha longa nem passa pela regex)', () => {
    const start = Date.now();
    parseSequence(`${'1 '.repeat(50_000)}x`);
    parseSequence(Array.from({ length: 500 }, () => 'Ponte 3x1min30s cada lado').join('\n'));
    expect(Date.now() - start).toBeLessThan(2000);
  });
});

describe('monta a rotina', () => {
  const items = (text: string): SequenceItem[] => parseSequence(text).items;

  it('descanso entre exercícios depois de cada um; a última sobra sai (D11)', () => {
    const routine = sequenceRoutine(
      BASE,
      items('Ponte 30s\nPrancha 20s'),
      { repeat: 2, restBetweenSeconds: 15 },
      W,
    );
    expect(routine).toMatchObject({
      id: 'seq',
      name: 'Joelho',
      modality: 'profissional',
      origin: 'custom',
      createdAt: 5,
      updatedAt: 5,
    });
    expect(routine.blocks[0]?.steps.map((s) => [s.name, s.seconds])).toEqual([
      ['Ponte', 30],
      ['Descanso', 15],
      ['Prancha', 20],
      ['Descanso', 15],
    ]);
    expect(checkRoutine(routine, pt.words).ok).toBe(true);
    const phases = buildTimeline(routine).map((s) => s.phase);
    expect(phases.at(-1)).toBe('work');
  });

  it('linha de descanso escrita substitui o automático', () => {
    const routine = sequenceRoutine(
      BASE,
      items('Ponte 30s\nDescanso 1min\nPrancha 20s'),
      { repeat: 1, restBetweenSeconds: 15 },
      W,
    );
    expect(routine.blocks[0]?.steps.map((s) => [s.kind, s.seconds])).toEqual([
      ['work', 30],
      ['rest', 60],
      ['work', 20],
      ['rest', 15],
    ]);
  });

  it('séries viram etapas numeradas; lados e repetições passam; sem descanso automático', () => {
    const routine = sequenceRoutine(
      BASE,
      items('Agachamento 2x12\nConcha 10 reps cada lado\n30s\n45s'),
      { repeat: 1, restBetweenSeconds: 0 },
      W,
    );
    const steps = routine.blocks[0]?.steps ?? [];
    expect(steps.map((s) => s.name)).toEqual([
      'Agachamento (série 1 de 2)',
      'Agachamento (série 2 de 2)',
      'Concha',
      'Exercício 1',
      'Exercício 2',
    ]);
    expect(steps[0]).toMatchObject({ reps: 12, seconds: null });
    expect(steps[2]).toMatchObject({ sides: true });
    expect(steps[0]).not.toHaveProperty('sides');
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
  });

  it('nomes padrão na língua de quem cadastra', () => {
    const unnamedRest: SequenceItem = {
      name: '',
      kind: 'rest',
      seconds: 10,
      reps: null,
      sides: false,
      sets: 1,
    };
    const list = [...items('30s\nPonte 5s'), unnamedRest, ...items('20s')];
    expect(withNames(list, en.sequence.words).map((i) => i.name)).toEqual([
      'Exercise 1',
      'Ponte',
      'Rest',
      'Exercise 2',
    ]);
  });
});
