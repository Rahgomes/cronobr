// Banco de teste pronto: node:sqlite em memória + fila + migrações.
import { migrate } from '@/data/migrations';
import { serialDb, type SqlDb } from '@/data/sql';

import { nodeSqlite, type TestDb } from './node-sqlite';

export async function testDb(): Promise<{ db: SqlDb; raw: TestDb }> {
  const raw = nodeSqlite();
  const db = serialDb(raw);
  await migrate(db);
  return { db, raw };
}
