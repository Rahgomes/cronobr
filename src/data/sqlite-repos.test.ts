import { createSession, settle, start, stop } from '@/domain/engine';
import { historyFromSession, type HistoryEntry } from '@/domain/history';
import { PRESETS } from '@/domain/presets';
import { buildTimeline } from '@/domain/timeline';
import type { TransferOps } from '@/domain/transfer-plan';
import { testDb } from '@/test/data';
import { clockAt, must, routine } from '@/test/domain';

import { ActiveSessionError } from './repos';
import { sqliteRepos } from './sqlite-repos';

const preset = must(PRESETS[0]);
const tl = buildTimeline(preset);

function finished(id: string, endSeconds: number): HistoryEntry {
  const s = start(createSession(id, preset), tl, clockAt(0));
  return must(historyFromSession(settle(s, tl, clockAt(endSeconds * 1000)), tl));
}

async function setup() {
  const { db, raw } = await testDb();
  return { db, raw, repos: sqliteRepos(db, () => 42) };
}

describe('rotinas', () => {
  it('salva, lista, busca e atualiza mantendo a data de criação', async () => {
    const { repos } = await setup();
    await repos.routines.save(routine({ id: 'a', name: 'A', updatedAt: 1 }));
    await repos.routines.save(routine({ id: 'b', name: 'B', updatedAt: 2 }));
    await repos.routines.save(routine({ id: 'a', name: 'A2', version: 2, updatedAt: 3 }));
    // Nova entra no topo; atualizar mantém o lugar.
    expect((await repos.routines.list()).map((r) => [r.id, r.name, r.version])).toEqual([
      ['b', 'B', 1],
      ['a', 'A2', 2],
    ]);
    expect(await repos.routines.get('b')).toMatchObject({ name: 'B' });
    expect(await repos.routines.get('nada')).toBeNull();
  });

  it('linha corrompida é pulada, não derruba a lista', async () => {
    const { db, repos } = await setup();
    await repos.routines.save(routine({ id: 'ok' }));
    await db.run(
      "INSERT INTO routines (id, name, modality, version, origin, data, created_at, updated_at) VALUES ('ruim', 'x', 'tabata', 1, 'custom', '{quebrado', 0, 0)",
    );
    expect((await repos.routines.list()).map((r) => r.id)).toEqual(['ok']);
    expect(await repos.routines.get('ruim')).toBeNull();
  });
});

describe('rotinas: ordem e exclusão', () => {
  it('reordenar grava a ordem escolhida; apagar some da lista e o histórico fica', async () => {
    const { repos } = await setup();
    for (const id of ['a', 'b', 'c']) await repos.routines.save(routine({ id, name: id }));
    expect((await repos.routines.list()).map((r) => r.id)).toEqual(['c', 'b', 'a']);
    await repos.routines.reorder(['a', 'c', 'b']);
    expect((await repos.routines.list()).map((r) => r.id)).toEqual(['a', 'c', 'b']);
    await repos.session.finish({
      id: 'h',
      routine: routine({ id: 'c', name: 'c' }),
      status: 'completed',
      startedAt: 0,
      endedAt: 1,
      activeMs: 1,
      workDone: 1,
      workTotal: 1,
      source: 'app',
    });
    await repos.routines.remove('c');
    expect((await repos.routines.list()).map((r) => r.id)).toEqual(['a', 'b']);
    expect((await repos.history.get('h'))?.routine.name).toBe('c');
  });

  it('reordenar é tudo ou nada', async () => {
    const { raw, repos } = await setup();
    for (const id of ['a', 'b']) await repos.routines.save(routine({ id, name: id }));
    raw.failOn('position = ? WHERE id = ?');
    await expect(repos.routines.reorder(['a', 'b'])).rejects.toThrow();
    expect((await repos.routines.list()).map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('etapa desativada sobrevive à gravação', async () => {
    const { repos } = await setup();
    const r = routine({ id: 'd' });
    const off = {
      ...r,
      blocks: r.blocks.map((b) => ({
        ...b,
        steps: b.steps.map((s, i) => (i === 1 ? { ...s, disabled: true } : s)),
      })),
    };
    await repos.routines.save(off);
    expect((await repos.routines.get('d'))?.blocks[0]?.steps[1]?.disabled).toBe(true);
  });
});

describe('histórico', () => {
  it('sem truncar: 250 treinos saem todos, página a página, do mais novo ao mais velho', async () => {
    const { db, repos } = await setup();
    await db.transaction(async (tx) => {
      for (let i = 0; i < 250; i += 1) {
        const entry = {
          ...finished(`s${String(i).padStart(3, '0')}`, 300),
          endedAt: 1000 + Math.floor(i / 2),
        };
        await tx.run(
          `INSERT INTO history (id, status, started_at, ended_at, active_ms, work_done, work_total, source, routine) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.status,
            entry.startedAt,
            entry.endedAt,
            entry.activeMs,
            entry.workDone,
            entry.workTotal,
            entry.source,
            JSON.stringify(entry.routine),
          ],
        );
      }
    });
    const seen: string[] = [];
    let page = await repos.history.page({ limit: 60 });
    seen.push(...page.entries.map((e) => e.id));
    while (page.next) {
      page = await repos.history.page({ limit: 60, before: page.next });
      seen.push(...page.entries.map((e) => e.id));
    }
    expect(seen).toHaveLength(250);
    expect(new Set(seen).size).toBe(250);
    expect(seen[0]).toBe('s249');
    expect(seen.at(-1)).toBe('s000');
    expect(await repos.history.count()).toBe(250);
    expect((await repos.history.page()).entries).toHaveLength(50);
  });

  it('busca e apaga um registro; registro corrompido some da lista sem erro', async () => {
    const { db, repos } = await setup();
    await repos.session.finish(finished('s1', 300));
    expect(await repos.history.get('s1')).toMatchObject({
      status: 'completed',
      routine: { id: preset.id },
    });
    await db.run(
      "INSERT INTO history (id, status, started_at, ended_at, active_ms, work_done, work_total, source, routine) VALUES ('ruim', 'completed', 0, 0, 0, 0, 0, 'app', '{}')",
    );
    expect((await repos.history.page()).entries.map((e) => e.id)).toEqual(['s1']);
    expect(await repos.history.get('ruim')).toBeNull();
    await repos.history.remove('s1');
    expect(await repos.history.get('s1')).toBeNull();
  });

  it('treino ajustado (salto ou relógio) volta marcado; o limpo volta sem a marca', async () => {
    const { repos } = await setup();
    await repos.session.finish({ ...finished('aj', 300), adjusted: true });
    await repos.session.finish(finished('limpo', 400));
    expect((await repos.history.get('aj'))?.adjusted).toBe(true);
    expect(await repos.history.get('limpo')).not.toHaveProperty('adjusted');
  });

  it('AMRAP: as rodadas registradas voltam; sem elas, nada', async () => {
    const { repos } = await setup();
    await repos.session.finish({ ...finished('amrap', 300), rounds: 7 });
    await repos.session.finish({ ...finished('zero', 400), rounds: 0 });
    expect((await repos.history.get('amrap'))?.rounds).toBe(7);
    expect((await repos.history.get('zero'))?.rounds).toBe(0);
    await repos.session.finish(finished('sem', 500));
    expect(await repos.history.get('sem')).not.toHaveProperty('rounds');
  });

  it('nota: grava, troca, apaga com null; registro sem nota volta sem o campo', async () => {
    const { repos } = await setup();
    await repos.session.finish(finished('n', 300));
    expect(await repos.history.get('n')).not.toHaveProperty('note');
    await repos.history.setNote('n', 'pesado');
    expect((await repos.history.get('n'))?.note).toBe('pesado');
    expect((await repos.history.page()).entries[0]?.note).toBe('pesado');
    await repos.history.setNote('n', 'leve');
    expect((await repos.history.get('n'))?.note).toBe('leve');
    await repos.history.setNote('n', null);
    expect(await repos.history.get('n')).not.toHaveProperty('note');
  });

  it('nota que já vem no registro (importação) entra junto', async () => {
    const { repos } = await setup();
    await repos.session.finish({ ...finished('imp', 300), note: 'do backup' });
    expect((await repos.history.get('imp'))?.note).toBe('do backup');
  });

  it('período [from, to): fins para o calendário e treinos do dia, mais novo primeiro', async () => {
    const { repos } = await setup();
    const [a, b, c] = [1000, 2000, 3000];
    for (const [id, endedAt] of [
      ['a', a],
      ['b', b],
      ['c', c],
    ] as const)
      await repos.session.finish({ ...finished(id, 300), endedAt });
    expect(await repos.history.endedBetween(a, c)).toEqual([a, b]);
    expect(await repos.history.endedBetween(c + 1, c + 2)).toEqual([]);
    expect((await repos.history.between(a, c + 1)).map((e) => e.id)).toEqual(['c', 'b', 'a']);
    expect((await repos.history.between(b, c)).map((e) => e.id)).toEqual(['b']);
  });
});

describe('sessão em andamento', () => {
  it('grava, recarrega igual e substitui', async () => {
    const { repos } = await setup();
    expect(await repos.session.load()).toBeNull();
    const s = start(createSession('s1', preset), tl, clockAt(0));
    await repos.session.save(s);
    expect(await repos.session.load()).toEqual(s);
    const later = stop(s, tl, clockAt(5000));
    await repos.session.save(later);
    expect(await repos.session.load()).toEqual(later);
  });

  it('conclusão registrada uma única vez, mesmo chamando de novo [PRD 8]', async () => {
    const { repos } = await setup();
    const s = start(createSession('s1', preset), tl, clockAt(0));
    await repos.session.save(s);
    const entry = finished('s1', 999);
    await Promise.all([repos.session.finish(entry), repos.session.finish(entry)]);
    await repos.session.finish(entry);
    expect(await repos.history.count()).toBe(1);
    expect(await repos.session.load()).toBeNull();
  });

  it('finish de outra sessão não apaga a que está em andamento', async () => {
    const { repos } = await setup();
    const current = start(createSession('nova', preset), tl, clockAt(0));
    await repos.session.save(current);
    await repos.session.finish(finished('velha', 300));
    expect(await repos.session.load()).toEqual(current);
  });

  it('gravação interrompida no meio: nem histórico nem sessão mudam [PRD 10]', async () => {
    const { raw, repos } = await setup();
    const s = start(createSession('s1', preset), tl, clockAt(0));
    await repos.session.save(s);
    raw.failOn('DELETE FROM active_session');
    await expect(repos.session.finish(finished('s1', 999))).rejects.toThrow('falha simulada');
    expect(await repos.history.count()).toBe(0);
    expect(await repos.session.load()).toEqual(s);
    // Na próxima tentativa fecha certo.
    await repos.session.finish(finished('s1', 999));
    expect(await repos.history.count()).toBe(1);
  });

  it('sessão ilegível é descartada para não travar todo início', async () => {
    const { db, repos } = await setup();
    await db.run('INSERT INTO active_session VALUES (1, \'x\', \'{"status":"voando"}\', 0)');
    expect(await repos.session.load()).toBeNull();
    expect(await db.first('SELECT COUNT(*) AS c FROM active_session')).toEqual({ c: 0 });
  });

  it('descartar apaga sem registrar', async () => {
    const { repos } = await setup();
    await repos.session.save(createSession('s1', preset));
    await repos.session.discard();
    expect(await repos.session.load()).toBeNull();
    expect(await repos.history.count()).toBe(0);
  });
});

describe('preferências', () => {
  it('guarda qualquer JSON por chave e sobrescreve', async () => {
    const { repos } = await setup();
    expect(await repos.prefs.get('tema')).toBeUndefined();
    await repos.prefs.set('tema', { modo: 'escuro' });
    await repos.prefs.set('tema', { modo: 'claro' });
    expect(await repos.prefs.get('tema')).toEqual({ modo: 'claro' });
    await repos.prefs.set('tema', undefined);
    expect(await repos.prefs.get('tema')).toBeUndefined();
  });

  it('preferência corrompida volta como ausente, sem derrubar quem lê', async () => {
    const { db, repos } = await setup();
    await db.run("INSERT INTO prefs VALUES ('x', '{quebrado')");
    expect(await repos.prefs.get('x')).toBeUndefined();
  });
});

describe('transferência (E05)', () => {
  const ops = (over: Partial<TransferOps> = {}): TransferOps => ({
    replace: false,
    routines: [],
    history: [],
    replaceHistory: false,
    prefs: null,
    ...over,
  });
  const KEYS = ['avisos', 'favoritos'];

  async function seeded() {
    const env = await setup();
    await env.repos.routines.save(routine({ id: 'a', name: 'A' }));
    await env.repos.routines.save(routine({ id: 'b', name: 'B' }));
    await env.repos.prefs.set('avisos', { voice: false });
    await env.repos.prefs.set('cronometro', { laps: [1] });
    await env.repos.session.finish(finished('h1', 300));
    return env;
  }

  it('retrato: rotinas na ordem da lista, só as preferências pedidas, histórico se pedido', async () => {
    const { repos } = await seeded();
    const snap = await repos.transfer.snapshot(KEYS, true);
    expect(snap.routines.map((r) => r.id)).toEqual(['b', 'a']);
    expect(snap.prefs).toEqual({ avisos: { voice: false } });
    expect(snap.history?.map((e) => e.id)).toEqual(['h1']);
    expect((await repos.transfer.snapshot(KEYS, false)).history).toBeNull();
    expect(await repos.transfer.historyIds()).toEqual(new Set(['h1']));
  });

  it('juntar: grava na ordem do arquivo no topo, histórico por id sem duplicar', async () => {
    const { repos } = await seeded();
    const plan = ops({
      routines: [routine({ id: 'x', name: 'X' }), routine({ id: 'y', name: 'Y' })],
      history: [finished('h1', 300), finished('h2', 300)],
    });
    await repos.transfer.apply(plan, KEYS, null);
    await repos.transfer.apply(plan, KEYS, null); // de novo: mesmo resultado
    expect((await repos.routines.list()).map((r) => r.id)).toEqual(['x', 'y', 'b', 'a']);
    expect(await repos.history.count()).toBe(2);
    expect(await repos.prefs.get('avisos')).toEqual({ voice: false });
  });

  it('substituir: troca rotinas e preferências portáveis; o resto do aparelho fica', async () => {
    const { repos } = await seeded();
    await repos.transfer.apply(
      ops({
        replace: true,
        routines: [routine({ id: 'z', name: 'Z' })],
        prefs: { favoritos: ['z'] },
      }),
      KEYS,
      'estado anterior',
    );
    expect((await repos.routines.list()).map((r) => r.id)).toEqual(['z']);
    expect(await repos.prefs.get('avisos')).toBeUndefined();
    expect(await repos.prefs.get('favoritos')).toEqual(['z']);
    expect(await repos.prefs.get('cronometro')).toEqual({ laps: [1] });
    // Sem histórico no arquivo, o daqui fica.
    expect(await repos.history.count()).toBe(1);
    expect(await repos.transfer.restorePoint()).toEqual({ createdAt: 42, text: 'estado anterior' });
    await repos.transfer.dropRestorePoint();
    expect(await repos.transfer.restorePoint()).toBeNull();
  });

  it('substituir com histórico troca o histórico também', async () => {
    const { repos } = await seeded();
    await repos.transfer.apply(
      ops({ replace: true, replaceHistory: true, history: [finished('h9', 300)] }),
      KEYS,
      null,
    );
    expect((await repos.history.page()).entries.map((e) => e.id)).toEqual(['h9']);
  });

  it('falha no meio: nada fica aplicado pela metade, nem o ponto de restauração', async () => {
    const { raw, repos } = await seeded();
    raw.failOn('INSERT OR IGNORE INTO history');
    await expect(
      repos.transfer.apply(
        ops({ replace: true, routines: [routine({ id: 'z' })], history: [finished('h2', 300)] }),
        KEYS,
        'anterior',
      ),
    ).rejects.toThrow();
    expect((await repos.routines.list()).map((r) => r.id)).toEqual(['b', 'a']);
    expect(await repos.prefs.get('avisos')).toEqual({ voice: false });
    expect(await repos.transfer.restorePoint()).toBeNull();
  });

  it('treino em andamento: substituir é recusado sem mudar nada; juntar pode', async () => {
    const { repos } = await seeded();
    const s = start(createSession('ativa', preset), tl, clockAt(0));
    await repos.session.save(s);
    await expect(
      repos.transfer.apply(ops({ replace: true }), KEYS, 'anterior'),
    ).rejects.toBeInstanceOf(ActiveSessionError);
    expect(await repos.routines.list()).toHaveLength(2);
    expect(await repos.transfer.restorePoint()).toBeNull();
    await repos.transfer.apply(ops({ routines: [routine({ id: 'x' })] }), KEYS, null);
    expect(await repos.routines.list()).toHaveLength(3);
  });
});
