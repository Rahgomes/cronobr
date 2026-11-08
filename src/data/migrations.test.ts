import { nodeSqlite } from '@/test/node-sqlite';

import { MIGRATIONS, migrate, schemaVersion } from './migrations';
import { serialDb, StorageError } from './sql';

const tables = async (db: ReturnType<typeof serialDb>) =>
  (
    await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    )
  ).map((row) => row.name);

describe('migrações', () => {
  it('banco novo sobe para a última versão; rodar de novo não faz nada', async () => {
    const db = serialDb(nodeSqlite());
    await migrate(db);
    expect(await schemaVersion(db)).toBe(MIGRATIONS.length);
    expect(await tables(db)).toEqual([
      'active_session',
      'history',
      'legacy_problems',
      'prefs',
      'routines',
    ]);
    await migrate(db);
    expect(await schemaVersion(db)).toBe(MIGRATIONS.length);
  });

  it('falha no meio de um passo: versão e tabelas ficam como estavam, e dá para tentar de novo', async () => {
    const raw = nodeSqlite();
    const db = serialDb(raw);
    raw.failOn('PRAGMA user_version = 1');
    await expect(migrate(db)).rejects.toThrow('falha simulada');
    expect(await schemaVersion(db)).toBe(0);
    expect(await tables(db)).toEqual([]);
    await migrate(db);
    expect(await schemaVersion(db)).toBe(MIGRATIONS.length);
  });

  it('passos seguintes rodam em ordem a partir da versão atual', async () => {
    const db = serialDb(nodeSqlite());
    await migrate(db);
    const v2 = jest.fn((tx: Parameters<(typeof MIGRATIONS)[number]>[0]) =>
      tx.exec('CREATE TABLE extra (x INTEGER)'),
    );
    await migrate(db, [...MIGRATIONS, v2]);
    expect(v2).toHaveBeenCalledTimes(1);
    expect(await schemaVersion(db)).toBe(MIGRATIONS.length + 1);
  });

  it('V2: banco da E02 (v1) com rotinas ganha a ordem sem perder nada', async () => {
    const db = serialDb(nodeSqlite());
    await migrate(db, MIGRATIONS.slice(0, 1));
    await db.run("INSERT INTO routines VALUES ('r', 'R', 'hiit', 1, 'custom', '{}', 0, 0)");
    await migrate(db);
    expect(await db.all('SELECT id, position FROM routines')).toEqual([{ id: 'r', position: 0 }]);
  });

  it('banco de versão mais nova (app voltou de versão): recusa com mensagem clara', async () => {
    const db = serialDb(nodeSqlite());
    await db.exec('PRAGMA user_version = 99');
    const error = await migrate(db).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StorageError);
    expect(error).toMatchObject({ reason: 'newer-version' });
    expect((error as StorageError).message).toContain('Atualize');
  });
});
