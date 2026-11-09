import { pt } from '@/i18n/messages/pt';

import { relativeDay } from './format';
import { recentRoutines, type HistoryEntry } from './history';
import { PRESET_MODALITIES, PRESETS, presetsOf } from './presets';

const W = pt.words;

function entry(id: string, routineId: string, endedAt: number): HistoryEntry {
  const routine = { ...PRESETS[0], id: routineId } as HistoryEntry['routine'];
  return {
    id,
    routine,
    status: 'completed',
    startedAt: 0,
    endedAt,
    activeMs: 0,
    workDone: 0,
    workTotal: 0,
    source: 'app',
  };
}

describe('recentes', () => {
  it('uma por rotina, a mais nova de cada, até o máximo', () => {
    const list = [
      entry('a', 'r1', 50),
      entry('b', 'r2', 40),
      entry('c', 'r1', 30),
      entry('d', 'r3', 20),
    ];
    expect(recentRoutines(list, 5).map((r) => [r.entryId, r.routine.id, r.lastEndedAt])).toEqual([
      ['a', 'r1', 50],
      ['b', 'r2', 40],
      ['d', 'r3', 20],
    ]);
    expect(recentRoutines(list, 2)).toHaveLength(2);
    expect(recentRoutines([], 3)).toEqual([]);
  });
});

describe('modalidades com modelos', () => {
  it('na ordem da lista, sem repetir, e o filtro por modalidade', () => {
    expect(PRESET_MODALITIES).toEqual([
      'tabata',
      'hiit',
      'emom',
      'amrap',
      'boxe',
      'circuito',
      'corrida',
      'mobilidade',
      'foco',
      'tarefas',
      'profissional',
    ]);
    expect(presetsOf('boxe').map((p) => p.id)).toEqual(['boxe-beginner', 'boxe-pro']);
    expect(presetsOf('personalizada')).toEqual([]);
  });
});

describe('dia relativo', () => {
  const now = new Date(2026, 10, 7, 9, 0).getTime();
  it.each([
    [new Date(2026, 10, 7, 0, 5), 'hoje'],
    [new Date(2026, 10, 6, 23, 50), 'ontem'],
    [new Date(2026, 10, 2, 12, 0), 'há 5 dias'],
    [new Date(2026, 9, 20, 12, 0), 'há 2 semanas'],
    [new Date(2026, 5, 1, 12, 0), 'há 5 meses'],
    [new Date(2026, 10, 9, 12, 0), 'hoje'],
  ])('%s → %s', (when, text) => {
    expect(relativeDay(when.getTime(), now, W)).toBe(text);
  });
});
