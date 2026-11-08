import { pt } from '@/i18n/messages/pt';
import { must, routine } from '@/test/domain';

import type { HistoryEntry } from './history';
import type { Routine } from './routine';
import type { TransferFile } from './transfer';
import {
  asCopy,
  classify,
  mergeOps,
  replaceOps,
  shareOps,
  summarize,
  type RoutineItem,
} from './transfer-plan';

const W = pt.words;

const NOW = 5_000;
const ids = () => {
  let n = 0;
  return () => `n${String((n += 1))}`;
};

const mine = routine({ id: 'a', name: 'Pernas', version: 2, createdAt: 10 });
const other = routine({ id: 'b', name: 'Braços' });

describe('classificar o que chega', () => {
  it('novo, igual pelo id, igual pelo conteúdo (id diferente) e conflito', () => {
    const items = classify(
      [
        routine({ id: 'novo', name: 'Nova' }),
        { ...mine },
        { ...other, id: 'b-de-outro-aparelho' },
        { ...mine, prepSeconds: 30 },
      ],
      [mine, other],
    );
    expect(items.map((item) => [item.routine.id, item.status, item.existing?.id])).toEqual([
      ['novo', 'new', undefined],
      ['a', 'same', 'a'],
      ['b-de-outro-aparelho', 'same', 'b'],
      ['a', 'conflict', 'a'],
    ]);
  });
});

describe('rotina compartilhada', () => {
  const incoming = { ...mine, prepSeconds: 30, origin: 'custom' as const };
  const [conflict] = classify([incoming], [mine]);
  const item = must(conflict);

  it('nova entra como própria, com o id do arquivo', () => {
    const fresh: RoutineItem = { routine: { ...other, origin: 'preset' }, status: 'new' };
    expect(shareOps(fresh, 'add', ids(), NOW, W).routines).toEqual([
      { ...other, origin: 'custom' },
    ]);
  });

  it('cópia: ids novos e "(cópia)" no nome; nada daqui muda', () => {
    const [copy] = shareOps(item, 'copy', ids(), NOW, W).routines;
    expect(copy).toMatchObject({ id: 'n1', name: 'Pernas (cópia)', version: 1, createdAt: NOW });
    expect(copy?.blocks[0]?.id).not.toBe(mine.blocks[0]?.id);
  });

  it('já existente sem escolher "atualizar" vira cópia (nunca sobrescreve sozinho)', () => {
    expect(shareOps(item, 'add', ids(), NOW, W).routines[0]?.name).toBe('Pernas (cópia)');
  });

  it('atualizar: mesmo id, versão sobe, data de criação mantida, conteúdo do arquivo', () => {
    expect(shareOps(item, 'update', ids(), NOW, W)).toEqual({
      replace: false,
      routines: [{ ...incoming, version: 3, createdAt: 10, updatedAt: NOW }],
      history: [],
      replaceHistory: false,
      prefs: null,
    });
  });

  it('cópia de nome longo não passa de 60 letras', () => {
    const copy = asCopy(routine({ name: `${'x'.repeat(58)} y` }), ids(), NOW, W);
    expect(copy.name).toHaveLength(60);
    expect(copy.name.endsWith(' (cópia)')).toBe(true);
  });
});

const historyEntry = (id: string): HistoryEntry => ({
  id,
  routine: mine,
  status: 'completed',
  startedAt: 0,
  endedAt: 1,
  activeMs: 1,
  workDone: 1,
  workTotal: 1,
  source: 'app',
});

describe('backup', () => {
  const incoming: Routine[] = [
    routine({ id: 'novo', name: 'Nova' }),
    { ...other },
    { ...mine, prepSeconds: 30 },
  ];
  const items = classify(incoming, [mine, other]);
  const history = [historyEntry('h1'), historyEntry('h2')];

  it('juntar: nova entra, igual fica, conflito vira cópia; histórico vai por id', () => {
    const ops = mergeOps(items, history, 'copy', ids(), NOW, W);
    expect(ops.routines.map((r) => [r.id, r.name])).toEqual([
      ['novo', 'Nova'],
      ['n1', 'Pernas (cópia)'],
    ]);
    expect(ops).toMatchObject({ replace: false, replaceHistory: false, prefs: null, history });
  });

  it('juntar com "usar a do arquivo": conflito atualiza a daqui', () => {
    const ops = mergeOps(items, null, 'update', ids(), NOW, W);
    expect(ops.routines[1]).toMatchObject({ id: 'a', prepSeconds: 30, version: 3, updatedAt: NOW });
    expect(ops.history).toEqual([]);
  });

  it('conflito sem a daqui registrada (defensivo) usa a versão do arquivo', () => {
    const lone: RoutineItem = { routine: mine, status: 'conflict' };
    expect(mergeOps([lone], null, 'update', ids(), NOW, W).routines[0]?.version).toBe(3);
  });

  it('restaurar: biblioteca e preferências iguais às do arquivo; histórico só se veio', () => {
    const file: Extract<TransferFile, { kind: 'backup' }> = {
      kind: 'backup',
      meta: { schemaVersion: 1, appVersion: '2.0.0', exportedAt: '' },
      routines: incoming,
      prefs: { sessao: { view: 'foco' } },
      history,
    };
    expect(replaceOps(file)).toEqual({
      replace: true,
      routines: incoming,
      history,
      replaceHistory: true,
      prefs: { sessao: { view: 'foco' } },
    });
    expect(replaceOps({ ...file, history: null })).toMatchObject({
      history: [],
      replaceHistory: false,
    });
  });

  it('resumo conta cada situação e os treinos que ainda não estão aqui', () => {
    expect(summarize(items, history, new Set(['h1']))).toEqual({
      routines: { new: 1, same: 1, conflict: 1 },
      history: { total: 2, fresh: 1 },
    });
    expect(summarize([], null, new Set()).history).toBeNull();
  });
});
