// Abertura do app: banco, migrações e importação do app antigo, nessa ordem.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { openExpoDb } from './expo-db';
import { importLegacy, type ReadLegacy } from './legacy-import';
import { migrate } from './migrations';
import type { Repos } from './repos';
import type { SqlDb } from './sql';
import { sqliteRepos } from './sqlite-repos';

export interface OpenDeps {
  open: () => Promise<SqlDb>;
  readLegacy: ReadLegacy;
  now: () => number;
}

const defaults: OpenDeps = {
  open: () => openExpoDb(),
  readLegacy: (keys) => AsyncStorage.multiGet(keys),
  now: Date.now,
};

export async function openData(deps: Partial<OpenDeps> = {}): Promise<Repos> {
  const { open, readLegacy, now } = { ...defaults, ...deps };
  const db = await open();
  await migrate(db);
  try {
    await importLegacy(db, readLegacy, now);
  } catch {
    // Importação é recuperável: nada foi marcado, tenta de novo na próxima abertura.
    // O app abre mesmo assim, com o que já está no banco novo.
  }
  return sqliteRepos(db, now);
}
