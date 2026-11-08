// Importa os dados do app antigo uma vez, numa transação só. As chaves antigas NÃO são
// apagadas: se algo der errado depois, uma versão futura ainda consegue reler.
import { convertLegacy, LEGACY_KEYS, type LegacyKey, type LegacyRaw } from '@/domain/legacy';

import type { SqlDb } from './sql';
import { insertHistory, setPref, upsertRoutine } from './sqlite-repos';

export const LEGACY_DONE_KEY = 'legacy.import';

export interface LegacyReport {
  at: number;
  routines: number;
  history: number;
  problems: number;
}

export type ReadLegacy = (keys: string[]) => Promise<readonly (readonly [string, string | null])[]>;

/**
 * Leitura falhou (AsyncStorage indisponível): nada é marcado e a próxima abertura tenta de novo.
 * Gravação falhou: a transação desfaz tudo e também tenta de novo.
 */
export async function importLegacy(
  db: SqlDb,
  read: ReadLegacy,
  now: () => number = Date.now,
): Promise<LegacyReport | null> {
  const done = await db.first('SELECT 1 FROM prefs WHERE key = ?', [LEGACY_DONE_KEY]);
  if (done) return null;

  const names = Object.keys(LEGACY_KEYS) as LegacyKey[];
  const pairs = await read(names.map((name) => LEGACY_KEYS[name]));
  const byStorageKey = new Map(pairs);
  const raw: LegacyRaw = {};
  for (const name of names) raw[name] = byStorageKey.get(LEGACY_KEYS[name]) ?? null;

  const data = convertLegacy(raw);
  const report: LegacyReport = {
    at: now(),
    routines: data.routines.length,
    history: data.history.length,
    problems: data.problems.length,
  };
  await db.transaction(async (tx) => {
    for (const routine of data.routines) await upsertRoutine(tx, routine, 'keep');
    for (const entry of data.history) await insertHistory(tx, entry);
    if (data.quickConfig) await setPref(tx, 'quickConfig', data.quickConfig);
    for (const [key, value] of Object.entries(data.prefs))
      await setPref(tx, `legacy.${key}`, value);
    for (const problem of data.problems) {
      await tx.run('INSERT INTO legacy_problems (key, reason, raw) VALUES (?, ?, ?)', [
        problem.key,
        problem.reason,
        problem.raw,
      ]);
    }
    await setPref(tx, LEGACY_DONE_KEY, report);
  });
  return report;
}
