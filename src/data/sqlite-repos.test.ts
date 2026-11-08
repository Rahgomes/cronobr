import { createSession, settle, start, stop } from '@/domain/engine';
import { historyFromSession, type HistoryEntry } from '@/domain/history';
import { PRESETS } from '@/domain/presets';
import { buildTimeline } from '@/domain/timeline';
import { testDb } from '@/test/data';
import { clockAt, must, routine } from '@/test/domain';

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
