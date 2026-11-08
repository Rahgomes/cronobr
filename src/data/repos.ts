// Fronteira de dados: as telas falam com estes repositórios, nunca com SQL.
import type { Session } from '@/domain/engine';
import type { HistoryEntry } from '@/domain/history';
import type { Routine } from '@/domain/routine';
import type { TransferOps } from '@/domain/transfer-plan';

export interface RoutinesRepo {
  list(): Promise<Routine[]>;
  get(id: string): Promise<Routine | null>;
  /** Nova entra no topo; atualizar mantém o lugar. */
  save(routine: Routine): Promise<void>;
  /** Apaga a rotina. O histórico guarda a cópia que rodou, então nada some de lá. */
  remove(id: string): Promise<void>;
  /** Grava a ordem da lista (ids na ordem desejada). */
  reorder(ids: readonly string[]): Promise<void>;
}

export interface HistoryPage {
  entries: HistoryEntry[];
  /** Passe em `before` para a próxima página; null quando acabou. */
  next: { endedAt: number; id: string } | null;
}

export interface HistoryRepo {
  /** Do mais recente para o mais antigo, paginado. Nada é cortado: o limite é por página. */
  page(options?: {
    limit?: number;
    before?: { endedAt: number; id: string };
  }): Promise<HistoryPage>;
  count(): Promise<number>;
  get(id: string): Promise<HistoryEntry | null>;
  /** Fim (`endedAt`) de cada treino no período [from, to): só os números, para o calendário. */
  endedBetween(from: number, to: number): Promise<number[]>;
  /** Treinos do período [from, to), do mais recente ao mais antigo (um dia do calendário). */
  between(from: number, to: number): Promise<HistoryEntry[]>;
  /** Grava a nota; null apaga. */
  setNote(id: string, note: string | null): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface SessionRepo {
  /** A sessão em andamento (rodando ou pausada), se houver. */
  load(): Promise<Session | null>;
  save(session: Session): Promise<void>;
  /**
   * Fecha a sessão: grava o histórico e apaga a sessão em andamento na MESMA transação.
   * Chamar de novo com o mesmo registro não duplica (o id é o da sessão).
   */
  finish(entry: HistoryEntry): Promise<void>;
  /** Descarta sem registrar (sessão que nem começou). */
  discard(): Promise<void>;
}

export interface PrefsRepo {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

export interface LibrarySnapshot {
  /** Na ordem da lista do app. */
  routines: Routine[];
  /** Valores gravados, por chave (só as chaves pedidas que existem). */
  prefs: Record<string, unknown>;
  /** Do mais antigo ao mais novo; null quando não foi pedido. */
  history: HistoryEntry[] | null;
}

/** Recusa de restaurar com treino em andamento (a sessão ativa depende da biblioteca). */
export class ActiveSessionError extends Error {
  constructor() {
    super('Há um treino em andamento.');
    this.name = 'ActiveSessionError';
  }
}

export interface TransferRepo {
  snapshot(prefKeys: readonly string[], withHistory: boolean): Promise<LibrarySnapshot>;
  historyIds(): Promise<Set<string>>;
  /**
   * Aplica tudo numa transação. `prefKeys` são as chaves portáveis (apagadas ao substituir).
   * Com `restorePoint`, guarda antes a cópia do estado atual. Substituir com treino em
   * andamento falha com ActiveSessionError, sem mudar nada.
   */
  apply(ops: TransferOps, prefKeys: readonly string[], restorePoint: string | null): Promise<void>;
  restorePoint(): Promise<{ createdAt: number; text: string } | null>;
  dropRestorePoint(): Promise<void>;
}

export interface Repos {
  routines: RoutinesRepo;
  history: HistoryRepo;
  session: SessionRepo;
  prefs: PrefsRepo;
  transfer: TransferRepo;
}
