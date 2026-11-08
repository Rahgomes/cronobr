// Migrações por PRAGMA user_version. Cada passo roda numa transação junto com a troca de
// versão: se o app morrer no meio, o banco fica inteiro na versão anterior e o passo
// roda de novo na próxima abertura.
import { StorageError, type SqlDb, type SqlTx } from './sql';

type Migration = (tx: SqlTx) => Promise<void>;

const V1: Migration = (tx) =>
  tx.exec(`
    CREATE TABLE routines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      modality TEXT NOT NULL,
      version INTEGER NOT NULL,
      origin TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE history (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('completed', 'interrupted')),
      started_at INTEGER NOT NULL,
      ended_at INTEGER NOT NULL,
      active_ms INTEGER NOT NULL,
      work_done INTEGER NOT NULL,
      work_total INTEGER NOT NULL,
      source TEXT NOT NULL,
      routine TEXT NOT NULL
    ) STRICT;
    CREATE INDEX history_by_end ON history (ended_at DESC, id);
    CREATE TABLE active_session (
      slot INTEGER PRIMARY KEY CHECK (slot = 1),
      id TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE prefs (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
    CREATE TABLE legacy_problems (
      id INTEGER PRIMARY KEY,
      key TEXT NOT NULL,
      reason TEXT NOT NULL,
      raw TEXT NOT NULL
    ) STRICT;
  `);

export const MIGRATIONS: readonly Migration[] = [V1];

export async function schemaVersion(db: SqlDb): Promise<number> {
  const row = await db.first<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

export async function migrate(
  db: SqlDb,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<void> {
  const current = await schemaVersion(db);
  if (current > migrations.length) {
    throw new StorageError(
      'Os dados foram gravados por uma versão mais nova do app. Atualize o CronôBR.',
      'newer-version',
    );
  }
  for (const [offset, step] of migrations.slice(current).entries()) {
    const version = current + offset + 1;
    await db.transaction(async (tx) => {
      await step(tx);
      await tx.exec(`PRAGMA user_version = ${String(version)}`);
    });
  }
}
