import { LEGACY_KEYS } from '@/domain/legacy';
import { testDb } from '@/test/data';
import { must } from '@/test/domain';
import { LEGADO_V1 } from '@/test/fixtures/legado-v1';

import { importLegacy, LEGACY_DONE_KEY, type ReadLegacy } from './legacy-import';
import { sqliteRepos } from './sqlite-repos';

/** AsyncStorage de mentira com o dump v1, no formato do multiGet. */
const storage = new Map<string, string | null>(
  Object.entries(LEGADO_V1).map(([name, value]) => [
    LEGACY_KEYS[name as keyof typeof LEGACY_KEYS],
    value ?? null,
  ]),
);
const readV1: ReadLegacy = (keys) =>
  Promise.resolve(keys.map((key) => [key, storage.get(key) ?? null] as const));

describe('importação do app antigo [PRD 9]', () => {
  it('traz rotinas, histórico, configuração rápida, preferências e problemas numa vez só', async () => {
    const { db } = await testDb();
    const repos = sqliteRepos(db);
    const report = await importLegacy(db, readV1, () => 7);
    expect(report).toEqual({ at: 7, routines: 2, history: 2, problems: 3 });

    expect((await repos.routines.list()).map((r) => r.id).sort()).toEqual([
      'legacy-p-1',
      'legacy-p-2',
    ]);
    expect((await repos.history.page()).entries.map((e) => e.id)).toEqual([
      'legacy-h-2',
      'legacy-h-1',
    ]);
    expect(await repos.prefs.get('quickConfig')).toEqual({
      prepSeconds: 5,
      workSeconds: 30,
      restSeconds: 20,
      rounds: 99,
    });
    expect(await repos.prefs.get('legacy.settings')).toMatchObject({
      language: 'en',
      theme: 'dark',
    });
    expect(await repos.prefs.get(LEGACY_DONE_KEY)).toEqual(report);
    const problems = await db.all<{ key: string; raw: string }>(
      'SELECT key, raw FROM legacy_problems ORDER BY id',
    );
    expect(problems[0]).toEqual({ key: 'appPreferences', raw: LEGADO_V1.appPreferences });
  });

  it('roda uma vez: a segunda abertura não lê nem duplica', async () => {
    const { db } = await testDb();
    await importLegacy(db, readV1);
    const read = jest.fn(readV1);
    expect(await importLegacy(db, read)).toBeNull();
    expect(read).not.toHaveBeenCalled();
    expect(await sqliteRepos(db).history.count()).toBe(2);
  });

  it('AsyncStorage indisponível: nada é marcado e a próxima abertura tenta de novo [PRD 10]', async () => {
    const { db } = await testDb();
    await expect(importLegacy(db, () => Promise.reject(new Error('storage off')))).rejects.toThrow(
      'storage off',
    );
    expect(await sqliteRepos(db).prefs.get(LEGACY_DONE_KEY)).toBeUndefined();
    expect(await importLegacy(db, readV1)).not.toBeNull();
  });

  it('gravação falha no meio: tudo desfeito, nada pela metade, e a nova tentativa completa', async () => {
    const { db, raw } = await testDb();
    raw.failOn('INSERT INTO legacy_problems');
    await expect(importLegacy(db, readV1)).rejects.toThrow('falha simulada');
    const repos = sqliteRepos(db);
    expect(await repos.history.count()).toBe(0);
    expect(await repos.routines.list()).toEqual([]);
    expect(await importLegacy(db, readV1)).toMatchObject({ history: 2 });
  });

  it('não sobrescreve rotina que já existe no banco novo', async () => {
    const { db } = await testDb();
    const repos = sqliteRepos(db);
    const [mine] = (
      await (async () => {
        await importLegacy(db, readV1);
        return repos.routines.list();
      })()
    ).filter((r) => r.id === 'legacy-p-1');
    await repos.routines.save({ ...must(mine), name: 'Editada depois', version: 2 });
    await db.run('DELETE FROM prefs WHERE key = ?', [LEGACY_DONE_KEY]);
    await importLegacy(db, readV1);
    expect(await repos.routines.get('legacy-p-1')).toMatchObject({ name: 'Editada depois' });
  });

  it('aparelho sem app antigo: marca como feito sem gravar nada', async () => {
    const { db } = await testDb();
    const report = await importLegacy(
      db,
      (keys) => Promise.resolve(keys.map((k) => [k, null] as const)),
      () => 1,
    );
    expect(report).toEqual({ at: 1, routines: 0, history: 0, problems: 0 });
    expect(await sqliteRepos(db).prefs.get('quickConfig')).toBeUndefined();
  });
});
