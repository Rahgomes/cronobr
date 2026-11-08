// Porta do banco. As telas e repositórios falam com SqlDb; o adaptador (expo-sqlite no app,
// node:sqlite nos testes) fica atrás de RawDb. Uma conexão só, com fila: duas gravações
// concorrentes nunca se intercalam, e uma transação segura a fila até o COMMIT.

export type SqlValue = string | number | null;

export interface SqlTx {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlValue[]): Promise<{ changes: number }>;
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  first<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
}

export interface SqlDb extends SqlTx {
  /**
   * Tudo dentro de `work` é atômico: um erro desfaz todas as gravações.
   * Dentro de `work` use SÓ o `tx` recebido: chamar o próprio `db` ali espera a fila que a
   * transação segura e trava tudo.
   */
  transaction<T>(work: (tx: SqlTx) => Promise<T>): Promise<T>;
}

/** O mínimo que um adaptador precisa oferecer. */
export type RawDb = SqlTx;

export class StorageError extends Error {
  constructor(
    message: string,
    readonly reason: 'unavailable' | 'newer-version' | 'corrupt',
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'StorageError';
  }
}

export function serialDb(raw: RawDb): SqlDb {
  let tail: Promise<unknown> = Promise.resolve();
  // ROLLBACK que falha deixa a conexão num estado desconhecido (transação talvez aberta).
  // Daí em diante tudo recusa: melhor reabrir o app do que gravar dentro dela.
  let broken: unknown = null;
  const guarded =
    <T>(work: () => Promise<T>) =>
    () => {
      if (broken !== null) {
        return Promise.reject(
          new StorageError(
            'O armazenamento parou de responder. Feche e abra o app.',
            'unavailable',
            {
              cause: broken,
            },
          ),
        );
      }
      return work();
    };
  const queue = <T>(job: () => Promise<T>): Promise<T> => {
    const work = guarded(job);
    const result = tail.then(work, work);
    tail = result.catch(() => undefined);
    return result;
  };
  return {
    exec: (sql) => queue(() => raw.exec(sql)),
    run: (sql, params) => queue(() => raw.run(sql, params)),
    all: (sql, params) => queue(() => raw.all(sql, params)),
    first: (sql, params) => queue(() => raw.first(sql, params)),
    transaction: (work) =>
      queue(async () => {
        await raw.exec('BEGIN IMMEDIATE');
        try {
          const value = await work(raw);
          await raw.exec('COMMIT');
          return value;
        } catch (error) {
          try {
            await raw.exec('ROLLBACK');
          } catch (rollbackError) {
            // O erro que sobe é o original; a conexão fica marcada como quebrada.
            broken = rollbackError;
          }
          throw error;
        }
      }),
  };
}
