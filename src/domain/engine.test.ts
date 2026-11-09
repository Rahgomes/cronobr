// Os 10 cenários do super PRD 02 estão marcados com [PRD n].
import { block, clockAt, routine, step } from '@/test/domain';

import {
  advanceManual,
  back,
  checkpoint,
  createSession,
  finishEarly,
  jumpTo,
  logRound,
  restingEarly,
  MAX_GAP_MS,
  pause,
  restore,
  resume,
  resync,
  settle,
  skip,
  snapshot,
  start,
  stop,
  type Instant,
  type Session,
} from './engine';
import { historyFromSession } from './history';
import { PRESETS } from './presets';
import { buildTimeline, summarize } from './timeline';

// work 20 · rest 10 · work 20  => 50 s
const r = routine();
const tl = buildTimeline(r);
const t = (seconds: number, wallShift = 0): Instant => {
  const base = clockAt(seconds * 1000);
  return { mono: base.mono, wall: base.wall + wallShift };
};
const started = () => start(createSession('s1', r), tl, t(0));
const at = (session: Session, seconds: number) => snapshot(session, tl, t(seconds));

describe('estados', () => {
  it('pronto → executando → pausado → executando → concluído', () => {
    const ready = createSession('s1', r);
    expect(ready.status).toBe('ready');
    expect(at(ready, 99)).toMatchObject({ segment: 0, elapsedMs: 0, finished: false });

    const running = start(ready, tl, t(0));
    expect(running).toMatchObject({ status: 'running', startedAt: t(0).wall });
    expect(start(running, tl, t(5))).toBe(running);

    const paused = pause(running, tl, t(5));
    expect(paused).toMatchObject({ status: 'paused', since: null, activeMs: 5000 });
    expect(resume(running, t(6))).toBe(running);

    const done = settle(resume(paused, t(100)), tl, t(200));
    expect(done).toMatchObject({ status: 'completed', activeMs: 50_000, endedAt: t(145).wall });
  });

  it('pausar e retomar várias vezes não perde nem ganha tempo [PRD 1]', () => {
    let s = started();
    for (let i = 0; i < 10; i += 1) {
      s = pause(s, tl, t(i * 10 + 3));
      s = resume(s, t(i * 10 + 10));
    }
    // 10 trechos de 3 s ativos = 30 s; a última retomada foi em 100 s.
    expect(at(s, 100)).toMatchObject({ segment: 2, elapsedMs: 0, activeMs: 30_000 });
    expect(at(s, 110)).toMatchObject({ segment: 2, elapsedMs: 10_000, remainingMs: 10_000 });
  });

  it('pausado não anda e pausar de novo não muda nada', () => {
    const paused = pause(started(), tl, t(4));
    expect(at(paused, 999)).toMatchObject({ segment: 0, elapsedMs: 4000, remainingMs: 16_000 });
    expect(pause(paused, tl, t(10))).toEqual(paused);
  });
});

describe('tempo derivado do relógio', () => {
  it('callback atrasado atravessa várias fases numa leitura só [PRD 2]', () => {
    expect(at(started(), 34)).toMatchObject({ segment: 2, elapsedMs: 4000, remainingMs: 16_000 });
  });

  it('retorno depois do horário de conclusão fecha no horário exato [PRD 3]', () => {
    const snap = at(started(), 80);
    expect(snap).toMatchObject({
      finished: true,
      overshootMs: 30_000,
      activeMs: 50_000,
      remainingMs: null,
    });
    expect(settle(started(), tl, t(80))).toMatchObject({
      status: 'completed',
      endedAt: t(50).wall,
      position: { segment: tl.length, elapsedMs: 0 },
    });
  });

  it('mudar o relógio civil com o app aberto não mexe na sessão [PRD 4]', () => {
    const s = started();
    expect(snapshot(s, tl, t(12, 3_600_000))).toMatchObject({ segment: 0, elapsedMs: 12_000 });
    expect(snapshot(s, tl, t(12, -3_600_000))).toMatchObject({ segment: 0, elapsedMs: 12_000 });
    // Relógio civil atrasado ao voltar do segundo plano: vale o monotônico.
    expect(resync(s, t(12, -3_600_000))).toBe(s);
  });

  it('aparelho dormiu (monotônico parado): ao voltar vale o relógio civil', () => {
    const s = started();
    const synced = resync(s, t(5, 25_000)); // mono andou 5 s, civil andou 30 s
    expect(synced.adjusted).toBe(true);
    expect(snapshot(synced, tl, t(5, 25_000))).toMatchObject({ segment: 2, elapsedMs: 0 });
    expect(resync(s, t(5, MAX_GAP_MS))).toBe(s);
    expect(resync(pause(s, tl, t(1)), t(5, 25_000)).adjusted).toBe(false);
  });

  it('tempo monotônico voltando (relógio novo sem restore) não anda para trás', () => {
    const s = start(createSession('s', r), tl, t(10));
    expect(snapshot(s, tl, t(3))).toMatchObject({ segment: 0, elapsedMs: 0 });
  });

  it('prévia e execução têm a mesma duração total [PRD 7]', () => {
    // Modelo com etapa por repetições espera o toque: não tem duração total para comparar.
    const timed = PRESETS.filter((preset) => summarize(buildTimeline(preset)).manualCount === 0);
    expect(timed.length).toBe(PRESETS.length - 1);
    for (const preset of timed) {
      const timeline = buildTimeline(preset);
      const total = summarize(timeline).knownMs;
      const s = start(createSession(preset.id, preset), timeline, t(0));
      expect(snapshot(s, timeline, t(total / 1000 - 0.001)).finished).toBe(false);
      expect(snapshot(s, timeline, t(total / 1000))).toMatchObject({
        finished: true,
        overshootMs: 0,
      });
      expect(snapshot(s, timeline, t(0)).totalRemainingMs).toBe(total);
    }
  });

  it('descanso final: termina no fim do último trabalho [PRD 6]', () => {
    expect(at(started(), 49.999)).toMatchObject({ segment: 2, finished: false });
    expect(at(started(), 50).finished).toBe(true);
  });
});

describe('reabrir o app', () => {
  const persisted = () => checkpoint(started(), tl, t(12)); // marco em 12 s

  it('processo novo: recalcula pelo relógio civil', () => {
    // Novo processo: mono recomeça perto de zero, civil seguiu 10 s depois do marco.
    const now = { mono: 500, wall: t(22).wall };
    const s = restore(persisted(), tl, now);
    expect(s.adjusted).toBe(true);
    expect(snapshot(s, tl, now)).toMatchObject({ segment: 1, elapsedMs: 2000 });
  });

  it('aparelho reiniciado depois do fim: conclui na hora certa', () => {
    const s = restore(persisted(), tl, { mono: 1, wall: t(4000).wall });
    expect(s).toMatchObject({ status: 'completed', endedAt: t(50).wall });
  });

  it('relógio civil para trás ou intervalo enorme: interrompe no último marco', () => {
    for (const wall of [t(5).wall, t(12).wall + MAX_GAP_MS + 1]) {
      expect(restore(persisted(), tl, { mono: 0, wall })).toMatchObject({
        status: 'interrupted',
        endedAt: t(12).wall,
        position: { segment: 0, elapsedMs: 12_000 },
        activeMs: 12_000,
        adjusted: true,
      });
    }
  });

  it('pausada continua pausada', () => {
    const paused = pause(started(), tl, t(3));
    expect(restore(paused, tl, { mono: 0, wall: t(9999).wall })).toBe(paused);
  });
});

describe('ações', () => {
  it('pular vai ao início da próxima; na última conclui', () => {
    let s = skip(started(), tl, t(5));
    expect(at(s, 5)).toMatchObject({ segment: 1, elapsedMs: 0 });
    s = skip(skip(s, tl, t(6)), tl, t(7));
    expect(s).toMatchObject({ status: 'completed', endedAt: t(7).wall, activeMs: 7000 });
  });

  it('pular pausado continua pausado', () => {
    const s = skip(pause(started(), tl, t(2)), tl, t(4));
    expect(s).toMatchObject({
      status: 'paused',
      since: null,
      position: { segment: 1, elapsedMs: 0 },
    });
  });

  it('voltar: até 3 s volta para a anterior; depois reinicia a atual (P3)', () => {
    const inRest = skip(started(), tl, t(1));
    expect(back(inRest, tl, t(3)).position).toEqual({ segment: 0, elapsedMs: 0 });
    expect(back(inRest, tl, t(4.5)).position).toEqual({ segment: 1, elapsedMs: 0 });
    expect(back(started(), tl, t(1)).position).toEqual({ segment: 0, elapsedMs: 0 });
  });

  it('encerrar grava interrompido; ações em sessão terminada não fazem nada', () => {
    const stopped = stop(started(), tl, t(25));
    expect(stopped).toMatchObject({ status: 'interrupted', endedAt: t(25).wall, activeMs: 25_000 });
    expect(stop(stopped, tl, t(30))).toEqual(stopped);
    expect(skip(stopped, tl, t(30))).toEqual(stopped);
    expect(back(stopped, tl, t(30))).toEqual(stopped);
    expect(pause(stopped, tl, t(30))).toEqual(stopped);
    expect(stop(createSession('x', r), tl, t(1)).status).toBe('ready');
  });

  it('salto pela lista: vai ao início da etapa, marca ajustado e o histórico registra (P3)', () => {
    // r tem 3 etapas: work 20 · rest 10 · work 20 (2 rodadas, sem descanso final)
    const s = jumpTo(started(), tl, t(5), 2);
    expect(s).toMatchObject({
      status: 'running',
      jumped: true,
      position: { segment: 2, elapsedMs: 0 },
    });
    expect(at(s, 7)).toMatchObject({ segment: 2, elapsedMs: 2000 });
    // Para trás também, e pausado continua pausado.
    const back0 = jumpTo(pause(s, tl, t(8)), tl, t(9), 0);
    expect(back0).toMatchObject({ status: 'paused', position: { segment: 0, elapsedMs: 0 } });
    // O tempo ativo conta só o que correu: 5 s + 3 s.
    expect(back0.activeMs).toBe(8000);
    const done = stop(back0, tl, t(10));
    expect(historyFromSession(done, tl)?.adjusted).toBe(true);
    expect(historyFromSession(stop(started(), tl, t(3)), tl)?.adjusted).toBeUndefined();
  });

  it('salto fora da lista ou em sessão parada não faz nada', () => {
    const s = started();
    expect(jumpTo(s, tl, t(1), 99).position).toEqual({ segment: 0, elapsedMs: 1000 });
    expect(jumpTo(s, tl, t(1), -1).jumped).toBeUndefined();
    const ready = createSession('x', r);
    expect(jumpTo(ready, tl, t(1), 1)).toEqual(ready);
  });

  it('EMOM: "Terminei" vira descanso até a virada do minuto; a próxima rodada não muda de hora', () => {
    const emom = routine({
      blocks: [block({ repeat: 2, steps: [step({ kind: 'work', seconds: 60, early: true })] })],
    });
    const etl = buildTimeline(emom);
    const s = start(createSession('e', emom), etl, t(0));
    const early = finishEarly(s, etl, t(25));
    expect(early.early).toEqual({ segment: 0 });
    expect(restingEarly(early, snapshot(early, etl, t(30)))).toBe(true);
    // Repetir o toque não muda nada; a rodada 2 começa no minuto 1, como sem o toque.
    expect(finishEarly(early, etl, t(26))).toBe(early);
    expect(snapshot(early, etl, t(61))).toMatchObject({ segment: 1, elapsedMs: 1000 });
    expect(restingEarly(early, snapshot(early, etl, t(61)))).toBe(false);
    // Fora de etapa EMOM, ou parada, não faz nada.
    expect(finishEarly(started(), tl, t(5))).toEqual(started());
    const ready = createSession('x', emom);
    expect(finishEarly(ready, etl, t(1))).toBe(ready);
    const done = stop(early, etl, t(70));
    expect(finishEarly(done, etl, t(71))).toBe(done);
    expect(
      finishEarly(start(createSession('e2', emom), etl, t(0)), etl, t(200)).early,
    ).toBeUndefined();
  });

  it('AMRAP: rodadas registradas sobem, descem até zero e vão para o histórico', () => {
    let s = logRound(logRound(started(), 1), 1);
    s = logRound(logRound(logRound(s, -1), -1), -1);
    expect(s.tally).toBe(0);
    s = logRound(s, 1);
    const done = stop(s, tl, t(10));
    expect(historyFromSession(done, tl)?.rounds).toBe(1);
    expect(logRound(done, 1)).toBe(done);
    expect(historyFromSession(stop(started(), tl, t(3)), tl)).not.toHaveProperty('rounds');
  });

  it('encerrar depois do fim registra concluído, não interrompido', () => {
    expect(stop(started(), tl, t(70)).status).toBe('completed');
  });

  it('etapa por repetições espera o "Concluí"', () => {
    const manual = routine({
      blocks: [
        block({
          repeat: 1,
          steps: [
            step({ kind: 'work', seconds: null, reps: 15 }),
            step({ kind: 'work', seconds: 5 }),
          ],
        }),
      ],
    });
    const mtl = buildTimeline(manual);
    const s = start(createSession('m', manual), mtl, t(0));
    expect(snapshot(s, mtl, t(600))).toMatchObject({
      segment: 0,
      elapsedMs: 600_000,
      remainingMs: null,
      totalRemainingMs: 5000,
    });
    const next = advanceManual(s, mtl, t(600));
    expect(snapshot(next, mtl, t(602))).toMatchObject({ segment: 1, remainingMs: 3000 });
    expect(advanceManual(next, mtl, t(602))).toBe(next);
    expect(advanceManual(settle(next, mtl, t(700)), mtl, t(700)).status).toBe('completed');
  });

  it('total restante ignora as etapas manuais que vêm depois', () => {
    const mixed = routine({
      blocks: [
        block({
          repeat: 1,
          steps: [
            step({ kind: 'work', seconds: 5 }),
            step({ kind: 'work', seconds: null, reps: 3 }),
          ],
        }),
      ],
    });
    const mtl = buildTimeline(mixed);
    expect(snapshot(start(createSession('x', mixed), mtl, t(0)), mtl, t(1)).totalRemainingMs).toBe(
      4000,
    );
  });

  it('rotina sem etapas conclui ao iniciar', () => {
    const empty = routine({ blocks: [block({ steps: [] })] });
    expect(start(createSession('e', empty), [], t(1))).toMatchObject({
      status: 'completed',
      startedAt: t(1).wall,
      endedAt: t(1).wall,
    });
  });
});

describe('conclusão registrada uma única vez [PRD 8]', () => {
  it('o registro usa o id da sessão e só existe depois do fim', () => {
    expect(historyFromSession(started(), tl)).toBeNull();
    const done = settle(started(), tl, t(60));
    const first = historyFromSession(done, tl);
    const again = historyFromSession(settle(done, tl, t(90)), tl);
    expect(first).toEqual(again);
    expect(first).toMatchObject({
      id: 's1',
      status: 'completed',
      workDone: 2,
      workTotal: 2,
      activeMs: 50_000,
    });
  });

  it('interrompido conta só os trabalhos terminados', () => {
    expect(historyFromSession(stop(started(), tl, t(35)), tl)).toMatchObject({
      status: 'interrupted',
      workDone: 1,
      workTotal: 2,
    });
    const neverStarted = { ...createSession('n', r), status: 'interrupted' as const };
    expect(historyFromSession(neverStarted, tl)).toBeNull();
  });
});
