// Adaptador expo-sqlite (Android, iOS e web via wasm). Abre uma conexão só e entrega a fila.
import { openDatabaseAsync } from 'expo-sqlite';

import { serialDb, StorageError, type SqlDb } from './sql';

const DB_NAME = 'cronobr.db';

export async function openExpoDb(name = DB_NAME): Promise<SqlDb> {
  try {
    const db = await openDatabaseAsync(name);
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    return serialDb({
      exec: (sql) => db.execAsync(sql),
      run: async (sql, params = []) => {
        const result = await db.runAsync(sql, params);
        return { changes: result.changes };
      },
      all: (sql, params = []) => db.getAllAsync(sql, params),
      first: (sql, params = []) => db.getFirstAsync(sql, params),
    });
  } catch (error) {
    throw new StorageError('Não deu para abrir o armazenamento do aparelho.', 'unavailable', {
      cause: error,
    });
  }
}
