import { nodeSqlite } from '@/test/node-sqlite';

import { LEGACY_DONE_KEY } from './legacy-import';
import { openData } from './open-data';
import { serialDb } from './sql';

describe('abrir os dados', () => {
  it('migra, importa e entrega os repositórios', async () => {
    const repos = await openData({
      open: () => Promise.resolve(serialDb(nodeSqlite())),
      readLegacy: (keys) => Promise.resolve(keys.map((k) => [k, null] as const)),
      now: () => 5,
    });
    expect(await repos.prefs.get(LEGACY_DONE_KEY)).toMatchObject({ at: 5 });
  });

  it('importação falhou: o app abre assim mesmo e tenta de novo depois', async () => {
    const repos = await openData({
      open: () => Promise.resolve(serialDb(nodeSqlite())),
      readLegacy: () => Promise.reject(new Error('off')),
    });
    expect(await repos.history.count()).toBe(0);
    expect(await repos.prefs.get(LEGACY_DONE_KEY)).toBeUndefined();
  });

  it('armazenamento indisponível: o erro sobe para a tela mostrar [PRD 10]', async () => {
    await expect(openData({ open: () => Promise.reject(new Error('sem disco')) })).rejects.toThrow(
      'sem disco',
    );
  });
});
