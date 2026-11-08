// Fronteira de dados: as telas falam com estes repositórios, nunca com SQL.
import type { Session } from '@/domain/engine';
import type { HistoryEntry } from '@/domain/history';
import type { Routine } from '@/domain/routine';

export interface RoutinesRepo {
  list(): Promise<Routine[]>;
  get(id: string): Promise<Routine | null>;
  save(routine: Routine): Promise<void>;
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

export interface Repos {
  routines: RoutinesRepo;
  history: HistoryRepo;
  session: SessionRepo;
  prefs: PrefsRepo;
}
