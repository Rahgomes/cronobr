import type { Instant } from './engine';
import {
  canAdd,
  collide,
  createTimer,
  DURATION_MAX_MS,
  endsAt,
  parseTimers,
  pause,
  rebase,
  remaining,
  repeat,
  reset,
  start,
  tick,
  TIMERS_MAX,
  type Timer,
} from './timers';

const at = (mono: number, wall = 1_000_000 + mono): Instant => ({ mono, wall });
const egg = () => createTimer('ovo', '  Ovo  ', 5 * 60_000);

describe('temporizador', () => {
  it('nasce parado, com nome limpo e tempo cheio', () => {
    expect(egg()).toMatchObject({ name: 'Ovo', status: 'ready', remainingMs: 300_000 });
    expect(createTimer('x', 'a'.repeat(60), 1).name).toHaveLength(40);
    expect(createTimer('x', 'x', 1).durationMs).toBe(1000);
    expect(createTimer('x', 'x', 10 * DURATION_MAX_MS).durationMs).toBe(DURATION_MAX_MS);
  });

  it('rodando, o que falta é derivado do marco (callback atrasado não perde tempo)', () => {
    const t = start(egg(), at(0));
    expect(remaining(t, at(60_000))).toBe(240_000);
    expect(remaining(t, at(400_000))).toBe(0);
    expect(endsAt(t)).toBe(1_000_000 + 300_000);
  });

  it('pausar congela; retomar segue de onde parou', () => {
    const paused = pause(start(egg(), at(0)), at(100_000));
    expect(paused).toMatchObject({ status: 'paused', remainingMs: 200_000, since: null });
    expect(remaining(paused, at(999_999))).toBe(200_000);
    expect(endsAt(paused)).toBeNull();
    const resumed = start(paused, at(500_000));
    expect(remaining(resumed, at(550_000))).toBe(150_000);
  });

  it('começar rodando ou concluído e pausar parado não mudam nada', () => {
    const running = start(egg(), at(0));
    expect(start(running, at(10))).toBe(running);
    expect(pause(egg(), at(10))).toEqual(egg());
    const done = must(tick([running], at(400_000)).done[0]);
    expect(start(done, at(500_000))).toBe(done);
  });

  it('a leitura marca a conclusão com a hora exata do fim, uma vez só', () => {
    const list = [start(egg(), at(0)), createTimer('cha', 'Chá', 60_000)];
    const first = tick(list, at(299_999));
    expect(first.done).toEqual([]);
    expect(first.timers).toEqual(list);
    const second = tick(list, at(310_000));
    expect(second.done.map((t) => t.id)).toEqual(['ovo']);
    expect(second.timers[0]).toMatchObject({ status: 'done', doneAt: 1_300_000, remainingMs: 0 });
    expect(tick(second.timers, at(320_000)).done).toEqual([]);
    // Rodando sem marco (dado torto): o fim é a própria leitura.
    const odd: Timer = { ...egg(), status: 'running', since: null, remainingMs: 0 };
    expect(tick([odd], at(5)).done[0]?.doneAt).toBe(1_000_005);
  });

  it('repetir recomeça do tempo cheio; zerar volta parado', () => {
    const done = must(tick([start(egg(), at(0))], at(300_000)).done[0]);
    const again = repeat(done, at(400_000));
    expect(again).toMatchObject({ status: 'running', remainingMs: 300_000, doneAt: null });
    expect(remaining(again, at(460_000))).toBe(240_000);
    expect(reset(again)).toMatchObject({ status: 'ready', remainingMs: 300_000, since: null });
  });

  it('reabrir o app recalcula pelo relógio civil (outro processo, outro mono)', () => {
    const running = start(egg(), at(1000, 5_000_000));
    // Processo novo: mono recomeçou em 50, e passaram 2 min no relógio civil.
    const back = rebase(running, { mono: 50, wall: 5_120_000 });
    expect(remaining(back, { mono: 50, wall: 5_120_000 })).toBe(180_000);
    expect(rebase(egg(), at(0))).toEqual(egg());
    // Relógio civil para trás conta como zero.
    expect(remaining(rebase(running, { mono: 0, wall: 4_000_000 }), at(0))).toBe(300_000);
  });

  it(`limite de ${String(TIMERS_MAX)}`, () => {
    const many = Array.from({ length: TIMERS_MAX }, (_, i) => createTimer(String(i), 'x', 1000));
    expect(canAdd(many.slice(1))).toBe(true);
    expect(canAdd(many)).toBe(false);
  });
});

describe('colisão (D98)', () => {
  it('fins a menos de 1 s viram um grupo; o resto fica separado, em ordem de hora', () => {
    const items = [
      { id: 'c', at: 5000 },
      { id: 'a', at: 1000 },
      { id: 'b', at: 1999 },
      { id: 'd', at: 5500 },
      { id: 'e', at: 9000 },
    ];
    expect(collide(items).map((g) => g.map((i) => i.id))).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
  });

  it('o grupo conta a partir do primeiro (não encadeia sem fim)', () => {
    const chain = [0, 600, 1200, 1800].map((ms, i) => ({ id: String(i), at: ms }));
    expect(collide(chain).map((g) => g.length)).toEqual([2, 2]);
  });
});

describe('leitura do gravado', () => {
  const ok: Timer = start(egg(), at(0));

  it('mantém o que é válido e tira o estranho, sem repetir id nem passar do limite', () => {
    const raw = [
      ok,
      { ...ok },
      { ...ok, id: 'b', status: 'voando' },
      { ...ok, id: 'c', since: null },
      { ...ok, id: 'd', remainingMs: -1 },
      { ...ok, id: 'e', doneAt: 'ontem' },
      'lixo',
      null,
      { ...reset(ok), id: 'f', remainingMs: 999_999_999 },
    ];
    const parsed = parseTimers(raw);
    expect(parsed.map((t) => t.id)).toEqual(['ovo', 'f']);
    expect(parsed[1]?.remainingMs).toBe(300_000);
    const many = Array.from({ length: 15 }, (_, i) => ({ ...ok, id: String(i) }));
    expect(parseTimers(many)).toHaveLength(TIMERS_MAX);
  });

  it('qualquer coisa que não é lista vira lista vazia', () => {
    expect(parseTimers(undefined)).toEqual([]);
    expect(parseTimers({ a: 1 })).toEqual([]);
  });
});

function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('faltou');
  return value;
}
