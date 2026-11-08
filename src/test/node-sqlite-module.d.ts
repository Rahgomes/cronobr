// Tipos mínimos do node:sqlite (Node 22.13+). O projeto não usa @types/node para não
// misturar os globais do Node com os do React Native; só os testes tocam este módulo.
declare module 'node:sqlite' {
  type Param = string | number | null;
  interface StatementSync {
    run(...params: Param[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    all(...params: Param[]): unknown[];
    get(...params: Param[]): unknown;
  }
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
