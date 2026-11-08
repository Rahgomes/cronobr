// Adaptador node:sqlite para os testes: o mesmo SQL do app, num banco em memória de verdade.
import { DatabaseSync } from 'node:sqlite';

import type { RawDb, SqlValue } from '@/data/sql';

export interface TestDb extends RawDb {
  /** Faz a próxima chamada cujo SQL contém `match` falhar (simula disco cheio, app morto). */
  failOn(match: string, error?: Error): void;
  close(): void;
}

export function nodeSqlite(path = ':memory:'): TestDb {
  const db = new DatabaseSync(path);
  let failure: { match: string; error: Error } | null = null;
  const guard = (sql: string) => {
    if (failure && sql.includes(failure.match)) {
      const { error } = failure;
      failure = null;
      throw error;
    }
  };
  const bind = (params: SqlValue[] = []) => params;
  const call = <T>(sql: string, work: () => T) =>
    new Promise<T>((resolve) => {
      guard(sql);
      resolve(work());
    });
  return {
    // Como no expo-sqlite: erro vira promessa rejeitada, nunca exceção síncrona.
    exec: (sql) =>
      call(sql, () => {
        db.exec(sql);
      }),
    run: (sql, params) =>
      call(sql, () => ({ changes: Number(db.prepare(sql).run(...bind(params)).changes) })),
    all: <T>(sql: string, params?: SqlValue[]) =>
      call(sql, () => db.prepare(sql).all(...bind(params)) as T[]),
    first: <T>(sql: string, params?: SqlValue[]) =>
      call(sql, () => (db.prepare(sql).get(...bind(params)) ?? null) as T | null),
    failOn(match, error = new Error(`falha simulada em ${match}`)) {
      failure = { match, error };
    },
    close() {
      db.close();
    },
  };
}
