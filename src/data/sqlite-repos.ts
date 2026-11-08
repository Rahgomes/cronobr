import type { HistoryEntry } from '@/domain/history';
import type { Routine } from '@/domain/routine';

import { decode, historyFromRow, routineShape, sessionShape, type HistoryRow } from './codecs';
import type { HistoryRepo, PrefsRepo, Repos, RoutinesRepo, SessionRepo } from './repos';
import type { SqlDb, SqlTx, SqlValue } from './sql';

const HISTORY_PAGE = 50;

/** INSERT OR IGNORE: o id é a chave, então a mesma conclusão nunca entra duas vezes. */
export async function insertHistory(tx: SqlTx, entry: HistoryEntry): Promise<boolean> {
  const params: SqlValue[] = [
    entry.id,
    entry.status,
    entry.startedAt,
    entry.endedAt,
    entry.activeMs,
    entry.workDone,
    entry.workTotal,
    entry.source,
    JSON.stringify(entry.routine),
  ];
  const result = await tx.run(
    `INSERT OR IGNORE INTO history
       (id, status, started_at, ended_at, active_ms, work_done, work_total, source, routine)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params,
  );
  return result.changes > 0;
}

export async function upsertRoutine(
  tx: SqlTx,
  routine: Routine,
  mode: 'replace' | 'keep' = 'replace',
) {
  await tx.run(
    `INSERT INTO routines
       (id, name, modality, version, origin, data, created_at, updated_at, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MIN(position), 0) - 1 FROM routines))
     ON CONFLICT (id) DO ${
       mode === 'replace'
         ? `UPDATE SET name = excluded.name, modality = excluded.modality,
              version = excluded.version, origin = excluded.origin, data = excluded.data,
              updated_at = excluded.updated_at`
         : 'NOTHING'
     }`,
    [
      routine.id,
      routine.name,
      routine.modality,
      routine.version,
      routine.origin,
      JSON.stringify(routine),
      routine.createdAt,
      routine.updatedAt,
    ],
  );
}

export async function setPref(tx: SqlTx, key: string, value: unknown) {
  // undefined não é JSON: gravar "nada" é apagar a chave (o leitor volta ao padrão).
  if (value === undefined) {
    await tx.run('DELETE FROM prefs WHERE key = ?', [key]);
    return;
  }
  await tx.run(
    'INSERT INTO prefs (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    [key, JSON.stringify(value)],
  );
}

function routinesRepo(db: SqlDb): RoutinesRepo {
  return {
    async list() {
      const rows = await db.all<{ data: string }>(
        'SELECT data FROM routines ORDER BY position, updated_at DESC, id',
      );
      return rows.flatMap((row) => decode(routineShape, row.data) ?? []);
    },
    async get(id) {
      const row = await db.first<{ data: string }>('SELECT data FROM routines WHERE id = ?', [id]);
      return row ? decode(routineShape, row.data) : null;
    },
    save: (routine) => db.transaction((tx) => upsertRoutine(tx, routine)),
    async remove(id) {
      await db.run('DELETE FROM routines WHERE id = ?', [id]);
    },
    reorder: (ids) =>
      db.transaction(async (tx) => {
        for (const [position, id] of ids.entries()) {
          await tx.run('UPDATE routines SET position = ? WHERE id = ?', [position, id]);
        }
      }),
  };
}

function historyRepo(db: SqlDb): HistoryRepo {
  return {
    async page({ limit = HISTORY_PAGE, before } = {}) {
      const rows = before
        ? await db.all<HistoryRow>(
            `SELECT * FROM history WHERE (ended_at, id) < (?, ?)
             ORDER BY ended_at DESC, id DESC LIMIT ?`,
            [before.endedAt, before.id, limit + 1],
          )
        : await db.all<HistoryRow>(
            'SELECT * FROM history ORDER BY ended_at DESC, id DESC LIMIT ?',
            [limit + 1],
          );
      const pageRows = rows.slice(0, limit);
      const last = pageRows.at(-1);
      return {
        entries: pageRows.flatMap((row) => historyFromRow(row) ?? []),
        next: rows.length > limit && last ? { endedAt: last.ended_at, id: last.id } : null,
      };
    },
    async count() {
      const row = await db.first<{ total: number }>('SELECT COUNT(*) AS total FROM history');
      return row?.total ?? 0;
    },
    async get(id) {
      const row = await db.first<HistoryRow>('SELECT * FROM history WHERE id = ?', [id]);
      return row ? historyFromRow(row) : null;
    },
    async remove(id) {
      await db.run('DELETE FROM history WHERE id = ?', [id]);
    },
  };
}

function sessionRepo(db: SqlDb, now: () => number): SessionRepo {
  return {
    async load() {
      const row = await db.first<{ data: string }>(
        'SELECT data FROM active_session WHERE slot = 1',
      );
      if (!row) return null;
      const session = decode(sessionShape, row.data);
      // Sessão ilegível não pode travar o app em todo início: descarta. Só se ainda for a
      // mesma linha lida, para não apagar uma sessão nova gravada no meio do caminho.
      if (!session) {
        await db.run('DELETE FROM active_session WHERE slot = 1 AND data = ?', [row.data]);
      }
      return session;
    },
    async save(session) {
      await db.run(
        `INSERT INTO active_session (slot, id, data, updated_at) VALUES (1, ?, ?, ?)
         ON CONFLICT (slot) DO UPDATE SET id = excluded.id, data = excluded.data,
           updated_at = excluded.updated_at`,
        [session.id, JSON.stringify(session), now()],
      );
    },
    finish: (entry) =>
      db.transaction(async (tx) => {
        await insertHistory(tx, entry);
        await tx.run('DELETE FROM active_session WHERE slot = 1 AND id = ?', [entry.id]);
      }),
    async discard() {
      await db.run('DELETE FROM active_session WHERE slot = 1');
    },
  };
}

function prefsRepo(db: SqlDb): PrefsRepo {
  return {
    async get(key) {
      const row = await db.first<{ value: string }>('SELECT value FROM prefs WHERE key = ?', [key]);
      if (!row) return undefined;
      try {
        return JSON.parse(row.value) as unknown;
      } catch {
        return undefined; // preferência corrompida: quem lê aplica o padrão
      }
    },
    set: (key, value) => db.transaction((tx) => setPref(tx, key, value)),
  };
}

export function sqliteRepos(db: SqlDb, now: () => number = Date.now): Repos {
  return {
    routines: routinesRepo(db),
    history: historyRepo(db),
    session: sessionRepo(db, now),
    prefs: prefsRepo(db),
  };
}
