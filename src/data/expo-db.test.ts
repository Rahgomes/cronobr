import { openDatabaseAsync } from 'expo-sqlite';

import { openExpoDb } from './expo-db';
import { StorageError } from './sql';

const fake = {
  execAsync: jest.fn(() => Promise.resolve()),
  runAsync: jest.fn(() => Promise.resolve({ changes: 2, lastInsertRowId: 1 })),
  getAllAsync: jest.fn(() => Promise.resolve([{ a: 1 }])),
  getFirstAsync: jest.fn(() => Promise.resolve({ a: 1 })),
};

it('liga WAL e repassa as chamadas para o expo-sqlite', async () => {
  jest.mocked(openDatabaseAsync).mockResolvedValue(fake as never);
  const db = await openExpoDb('t.db');
  expect(openDatabaseAsync).toHaveBeenCalledWith('t.db');
  expect(fake.execAsync).toHaveBeenCalledWith(expect.stringContaining('journal_mode = WAL'));
  expect(await db.run('UPDATE x', [1])).toEqual({ changes: 2 });
  expect(await db.all('SELECT')).toEqual([{ a: 1 }]);
  expect(await db.first('SELECT', ['p'])).toEqual({ a: 1 });
  expect(fake.getFirstAsync).toHaveBeenCalledWith('SELECT', ['p']);
  await db.transaction((tx) => tx.exec('X'));
  expect(fake.execAsync.mock.calls.map((call: unknown[]) => call[0])).toEqual(
    expect.arrayContaining(['BEGIN IMMEDIATE', 'X', 'COMMIT']),
  );
});

it('falha ao abrir vira StorageError com mensagem em português', async () => {
  jest.mocked(openDatabaseAsync).mockRejectedValue(new Error('SQLITE_CANTOPEN'));
  const error = await openExpoDb().catch((e: unknown) => e);
  expect(error).toBeInstanceOf(StorageError);
  expect((error as StorageError).reason).toBe('unavailable');
  expect((error as StorageError).message).toBe('Não deu para abrir o armazenamento do aparelho.');
});
