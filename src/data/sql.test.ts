import { nodeSqlite } from '@/test/node-sqlite';

import { serialDb } from './sql';

async function setup() {
  const raw = nodeSqlite();
  const db = serialDb(raw);
  await db.exec('CREATE TABLE t (n INTEGER) STRICT');
  return { raw, db };
}

describe('fila e transação', () => {
  it('gravações concorrentes não se intercalam com uma transação aberta', async () => {
    const { db } = await setup();
    const order: string[] = [];
    const tx = db.transaction(async (t) => {
      order.push('tx-início');
      await t.run('INSERT INTO t (n) VALUES (1)');
      await new Promise((resolve) => setTimeout(resolve, 5));
      await t.run('INSERT INTO t (n) VALUES (2)');
      order.push('tx-fim');
    });
    const outside = db.run('INSERT INTO t (n) VALUES (3)').then(() => order.push('fora'));
    await Promise.all([tx, outside]);
    expect(order).toEqual(['tx-início', 'tx-fim', 'fora']);
    expect(await db.all('SELECT n FROM t ORDER BY rowid')).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
  });

  it('erro no meio desfaz tudo e a fila continua andando [PRD 10]', async () => {
    const { db } = await setup();
    await expect(
      db.transaction(async (t) => {
        await t.run('INSERT INTO t (n) VALUES (1)');
        throw new Error('app morreu');
      }),
    ).rejects.toThrow('app morreu');
    expect(await db.first('SELECT COUNT(*) AS c FROM t')).toEqual({ c: 0 });
    await db.run('INSERT INTO t (n) VALUES (9)');
    expect(await db.first('SELECT n FROM t')).toEqual({ n: 9 });
  });

  it('se o ROLLBACK também falhar: sobe o erro original e a conexão passa a recusar tudo', async () => {
    const { db, raw } = await setup();
    await expect(
      db.transaction(async (t) => {
        await t.run('INSERT INTO t (n) VALUES (1)');
        raw.failOn('ROLLBACK');
        throw new Error('disco cheio');
      }),
    ).rejects.toThrow('disco cheio');
    await expect(db.run('INSERT INTO t (n) VALUES (2)')).rejects.toThrow(
      'O armazenamento parou de responder. Feche e abra o app.',
    );
  });
});
