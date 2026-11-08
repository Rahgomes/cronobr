import { pt } from '@/i18n/messages/pt';
import { clockAt } from '@/test/domain';

import { stopwatchTime } from './format';
import { DEFAULT_INTERVAL, DEFAULT_TIMER, parseQuick, quickParams, quickRoutine } from './quick';
import {
  elapsed,
  IDLE,
  lap,
  lapRows,
  LAPS_MAX,
  parseStopwatch,
  pause,
  rebase,
  reset,
  startOrResume,
  type Stopwatch,
} from './stopwatch';
import { buildTimeline, summarize } from './timeline';

const W = pt.words;

describe('início rápido', () => {
  it('temporizador: uma etapa só, nome opcional e duração certa', () => {
    const plain = quickRoutine(DEFAULT_TIMER, W);
    if (!plain.ok) throw new Error(plain.message);
    expect(plain.routine).toMatchObject({
      id: 'rapido-t-300',
      name: 'Temporizador 5:00',
      modality: 'temporizador',
      prepSeconds: 0,
    });
    expect(buildTimeline(plain.routine).map((s) => [s.phase, s.name])).toEqual([['work', 'Tempo']]);
    const named = quickRoutine({ kind: 'temporizador', seconds: 90, name: '  Prancha ' }, W);
    expect(named.ok && named.routine.name).toBe('Prancha');
  });

  it('intervalado: id pela configuração e nome que diz o que é', () => {
    const r = quickRoutine(DEFAULT_INTERVAL, W);
    if (!r.ok) throw new Error(r.message);
    expect(r.routine.id).toBe('rapido-i-10-30-15-8');
    expect(r.routine.name).toBe('Intervalado 0:30/0:15 × 8');
    // 10 + 8 × 30 + 7 × 15 (sem descanso depois da última rodada)
    expect(summarize(buildTimeline(r.routine)).knownMs).toBe(355_000);
  });

  it('fora dos limites: a mensagem do editor, em português', () => {
    const r = quickRoutine({ kind: 'temporizador', seconds: 0, name: '' }, W);
    expect(r).toEqual({ ok: false, message: expect.stringMatching(/pelo menos 1 s/) as unknown });
    const many = quickRoutine({ ...DEFAULT_INTERVAL, rounds: 500 }, W);
    expect(many.ok).toBe(false);
  });

  it('ida e volta pelos parâmetros da rota', () => {
    const timer = { kind: 'temporizador', seconds: 45, name: 'Prancha' } as const;
    expect(quickParams(timer)).toEqual({ rapido: 't', s: '45', nome: 'Prancha' });
    expect(parseQuick(quickParams(timer))).toEqual(timer);
    expect(quickParams(DEFAULT_TIMER)).toEqual({ rapido: 't', s: '300' });
    expect(parseQuick(quickParams(DEFAULT_TIMER))).toEqual(DEFAULT_TIMER);
    expect(parseQuick(quickParams(DEFAULT_INTERVAL))).toEqual(DEFAULT_INTERVAL);
  });

  it('parâmetro faltando ou que não é número: não é rotina rápida', () => {
    expect(parseQuick({})).toBeNull();
    expect(parseQuick({ rapido: 't', s: '1e3' })).toBeNull();
    expect(parseQuick({ rapido: 't' })).toBeNull();
    expect(parseQuick({ rapido: 'i', p: '10', t: '20', d: '10' })).toBeNull();
    expect(parseQuick({ rapido: 'x' })).toBeNull();
  });
});

describe('cronômetro', () => {
  const at = (ms: number) => clockAt(ms);

  it('conta, pausa congelado, retoma somando', () => {
    let sw = startOrResume(IDLE, at(0));
    expect(elapsed(sw, at(5_000))).toBe(5_000);
    sw = pause(sw, at(5_000));
    expect(elapsed(sw, at(60_000))).toBe(5_000);
    sw = startOrResume(sw, at(60_000));
    expect(elapsed(sw, at(62_500))).toBe(7_500);
    expect(startOrResume(sw, at(70_000))).toBe(sw);
    expect(pause(IDLE, at(1))).toBe(IDLE);
  });

  it('voltas: duração de cada uma e total, a mais recente primeiro', () => {
    let sw = startOrResume(IDLE, at(0));
    sw = lap(sw, at(30_000));
    sw = lap(sw, at(75_000));
    expect(lapRows(sw)).toEqual([
      { number: 2, lapMs: 45_000, totalMs: 75_000 },
      { number: 1, lapMs: 30_000, totalMs: 30_000 },
    ]);
    // Parado não marca volta; e há um teto.
    expect(lap(pause(sw, at(80_000)), at(90_000)).laps).toHaveLength(2);
    const full: Stopwatch = { ...sw, laps: Array.from({ length: LAPS_MAX }, (_, i) => i) };
    expect(lap(full, at(100_000))).toBe(full);
  });

  it('zerar só parado', () => {
    const running = startOrResume(IDLE, at(0));
    expect(reset(running)).toBe(running);
    expect(reset(pause(running, at(10)))).toEqual(IDLE);
  });

  it('reabrir recalcula pelo relógio civil (mono recomeça a cada processo)', () => {
    const sw = startOrResume(IDLE, { mono: 900_000, wall: 1_000_000 });
    const now = { mono: 50, wall: 1_030_000 };
    expect(elapsed(rebase(sw, now), now)).toBe(30_000);
    const back = { mono: 50, wall: 900_000 };
    expect(elapsed(rebase(sw, back), back)).toBe(0);
    expect(rebase(IDLE, now)).toBe(IDLE);
  });

  it('gravado estragado volta zerado; válido passa', () => {
    const ok = startOrResume(IDLE, at(0));
    expect(parseStopwatch(JSON.parse(JSON.stringify(ok)))).toEqual(ok);
    expect(parseStopwatch({ ...IDLE, status: 'paused', accumulatedMs: 5 })).toMatchObject({
      status: 'paused',
      since: null,
    });
    for (const bad of [
      null,
      'x',
      { ...IDLE, status: 'voando' },
      { ...IDLE, accumulatedMs: -1 },
      { ...IDLE, laps: 'a' },
      { ...IDLE, laps: [1, Number.NaN] },
      { ...IDLE, status: 'running', since: null },
      { ...IDLE, since: { mono: 'a', wall: 1 } },
    ]) {
      expect(parseStopwatch(bad)).toEqual(IDLE);
    }
  });
});

describe('tempo do cronômetro', () => {
  it.each([
    [0, '0:00.0'],
    [5_399, '0:05.3'],
    [754_560, '12:34.5'],
    [3_723_400, '1:02:03.4'],
    [-5, '0:00.0'],
  ])('%i ms = %s', (ms, text) => {
    expect(stopwatchTime(ms)).toBe(text);
  });
});
