import type { HistoryEntry } from '@/domain/history';
import type { Routine } from '@/domain/routine';

import { decode, historyFromRow, routineShape, sessionShape, type HistoryRow } from './codecs';
import {
  ActiveSessionError,
  type HistoryRepo,
  type PrefsRepo,
  type Repos,
  type RoutinesRepo,
  type SessionRepo,
  type TransferRepo,
} from './repos';
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
    entry.adjusted ? 1 : 0,
    entry.rounds ?? null,
    entry.note ?? null,
  ];
  const result = await tx.run(
    `INSERT OR IGNORE INTO history
       (id, status, started_at, ended_at, active_ms, work_done, work_total, source, routine,
        adjusted, rounds_logged, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    async endedBetween(from, to) {
      const rows = await db.all<{ ended_at: number }>(
        'SELECT ended_at FROM history WHERE ended_at >= ? AND ended_at < ? ORDER BY ended_at',
        [from, to],
      );
      return rows.map((row) => row.ended_at);
    },
    async between(from, to) {
      const rows = await db.all<HistoryRow>(
        `SELECT * FROM history WHERE ended_at >= ? AND ended_at < ?
         ORDER BY ended_at DESC, id DESC`,
        [from, to],
      );
      return rows.flatMap((row) => historyFromRow(row) ?? []);
    },
    async setNote(id, note) {
      await db.run('UPDATE history SET note = ? WHERE id = ?', [note, id]);
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

function transferRepo(db: SqlDb, now: () => number): TransferRepo {
  return {
    async snapshot(prefKeys, withHistory) {
      const routines = await routinesRepo(db).list();
      const prefs: Record<string, unknown> = {};
      const reader = prefsRepo(db);
      for (const key of prefKeys) {
        const value = await reader.get(key);
        if (value !== undefined) prefs[key] = value;
      }
      const history = withHistory
        ? (await db.all<HistoryRow>('SELECT * FROM history ORDER BY ended_at, id')).flatMap(
            (row) => historyFromRow(row) ?? [],
          )
        : null;
      return { routines, prefs, history };
    },
    async historyIds() {
      const rows = await db.all<{ id: string }>('SELECT id FROM history');
      return new Set(rows.map((row) => row.id));
    },
    apply: (ops, prefKeys, restorePoint) =>
      db.transaction(async (tx) => {
        if (ops.replace && (await tx.first('SELECT 1 AS x FROM active_session WHERE slot = 1'))) {
          throw new ActiveSessionError();
        }
        if (restorePoint !== null) {
          await tx.run(
            `INSERT INTO restore_point (slot, created_at, data) VALUES (1, ?, ?)
             ON CONFLICT (slot) DO UPDATE SET created_at = excluded.created_at, data = excluded.data`,
            [now(), restorePoint],
          );
        }
        if (ops.replace) {
          await tx.run('DELETE FROM routines');
          for (const key of prefKeys) await tx.run('DELETE FROM prefs WHERE key = ?', [key]);
        }
        if (ops.replaceHistory) await tx.run('DELETE FROM history');
        // Cada nova entra no topo: gravar de trás para frente mantém a ordem do arquivo.
        for (const routine of [...ops.routines].reverse()) await upsertRoutine(tx, routine);
        for (const entry of ops.history) await insertHistory(tx, entry);
        for (const [key, value] of Object.entries(ops.prefs ?? {})) await setPref(tx, key, value);
      }),
    async restorePoint() {
      const row = await db.first<{ created_at: number; data: string }>(
        'SELECT created_at, data FROM restore_point WHERE slot = 1',
      );
      return row ? { createdAt: row.created_at, text: row.data } : null;
    },
    async dropRestorePoint() {
      await db.run('DELETE FROM restore_point WHERE slot = 1');
    },
  };
}

export function sqliteRepos(db: SqlDb, now: () => number = Date.now): Repos {
  return {
    routines: routinesRepo(db),
    history: historyRepo(db),
    session: sessionRepo(db, now),
    prefs: prefsRepo(db),
    transfer: transferRepo(db, now),
  };
}
