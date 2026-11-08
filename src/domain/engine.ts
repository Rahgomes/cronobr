// Motor de tempo puro (D04/D12). Nada aqui lê relógio: quem chama passa `now`.
// A posição só é gravada em marcos (início, pausa, pular, checkpoint); entre marcos ela é
// DERIVADA de `since`. Por isso um callback atrasado, uma tela travada ou um app suspenso
// nunca "perdem" tempo: a próxima leitura anda quantas fases forem necessárias.
import type { Routine } from './routine';
import type { Segment } from './timeline';

/** `mono` é monotônico no processo (performance.now); `wall` é o relógio civil (Date.now). */
export interface Instant {
  mono: number;
  wall: number;
}

export type SessionStatus = 'ready' | 'running' | 'paused' | 'completed' | 'interrupted';

export interface Position {
  segment: number;
  elapsedMs: number;
}

export interface Session {
  id: string;
  routine: Routine;
  status: SessionStatus;
  /** Posição no instante `since` (rodando) ou congelada (demais estados). */
  position: Position;
  since: Instant | null;
  /** Tempo ativo acumulado até `since` (pausas e saltos não contam). */
  activeMs: number;
  startedAt: number | null;
  endedAt: number | null;
  /** A posição foi recalculada pelo relógio civil (app reaberto ou aparelho suspenso). */
  adjusted: boolean;
  /** Houve salto pela lista (P3): o treino vale, mas não seguiu a ordem. */
  jumped?: boolean | undefined;
}

export interface Snapshot {
  segment: number;
  elapsedMs: number;
  /** null em etapa manual ou com a sessão terminada. */
  remainingMs: number | null;
  /** Soma do que falta nas etapas com tempo. */
  totalRemainingMs: number;
  finished: boolean;
  /** Quanto a leitura passou do fim da sessão (para datar a conclusão exata). */
  overshootMs: number;
  activeMs: number;
}

/** Até aqui "Voltar" reinicia a etapa atual; antes disso, volta para a anterior (P3). */
const BACK_RESTART_MS = 3000;
/** Acima disso, reabrir não recalcula: a sessão vira interrompida (relógio não confiável). */
export const MAX_GAP_MS = 12 * 60 * 60 * 1000;
/** Diferença mínima entre relógio civil e monotônico para considerar que o aparelho dormiu. */
const RESYNC_TOLERANCE_MS = 2000;

export function createSession(id: string, routine: Routine): Session {
  return {
    id,
    routine,
    status: 'ready',
    position: { segment: 0, elapsedMs: 0 },
    since: null,
    activeMs: 0,
    startedAt: null,
    endedAt: null,
    adjusted: false,
  };
}

interface Walk {
  position: Position;
  finished: boolean;
  overshootMs: number;
}

function walk(timeline: readonly Segment[], from: Position, deltaMs: number): Walk {
  let segment = from.segment;
  let elapsed = from.elapsedMs + deltaMs;
  for (;;) {
    const current = timeline[segment];
    if (!current)
      return {
        position: { segment: timeline.length, elapsedMs: 0 },
        finished: true,
        overshootMs: elapsed,
      };
    if (current.durationMs === null || elapsed < current.durationMs) {
      return { position: { segment, elapsedMs: elapsed }, finished: false, overshootMs: 0 };
    }
    elapsed -= current.durationMs;
    segment += 1;
  }
}

function remainingAfter(timeline: readonly Segment[], segment: number): number {
  return timeline.slice(segment + 1).reduce((sum, next) => sum + (next.durationMs ?? 0), 0);
}

export function snapshot(session: Session, timeline: readonly Segment[], now: Instant): Snapshot {
  const since = session.status === 'running' ? session.since : null;
  const delta = since ? Math.max(0, now.mono - since.mono) : 0;
  const result = since
    ? walk(timeline, session.position, delta)
    : {
        position: session.position,
        finished: session.status === 'completed',
        overshootMs: 0,
      };
  const current = result.finished ? undefined : timeline[result.position.segment];
  const remainingMs =
    current?.durationMs == null ? null : current.durationMs - result.position.elapsedMs;
  return {
    segment: result.position.segment,
    elapsedMs: result.position.elapsedMs,
    remainingMs,
    totalRemainingMs: result.finished
      ? 0
      : (remainingMs ?? 0) + remainingAfter(timeline, result.position.segment),
    finished: result.finished,
    overshootMs: result.overshootMs,
    activeMs: session.activeMs + delta - result.overshootMs,
  };
}

function complete(
  session: Session,
  activeMs: number,
  endedAt: number,
  timeline: readonly Segment[],
): Session {
  return {
    ...session,
    status: 'completed',
    position: { segment: timeline.length, elapsedMs: 0 },
    since: null,
    activeMs,
    endedAt,
  };
}

/** Se a sessão rodando já passou do fim, fecha como concluída no horário exato do fim. */
export function settle(session: Session, timeline: readonly Segment[], now: Instant): Session {
  if (session.status !== 'running') return session;
  const snap = snapshot(session, timeline, now);
  if (!snap.finished) return session;
  return complete(session, snap.activeMs, now.wall - snap.overshootMs, timeline);
}

/** Grava a posição derivada como novo marco. Use em cada mudança de fase e ao ir para segundo plano. */
export function checkpoint(session: Session, timeline: readonly Segment[], now: Instant): Session {
  const settled = settle(session, timeline, now);
  if (settled.status !== 'running') return settled;
  const snap = snapshot(settled, timeline, now);
  return {
    ...settled,
    position: { segment: snap.segment, elapsedMs: snap.elapsedMs },
    activeMs: snap.activeMs,
    since: now,
  };
}

export function start(session: Session, timeline: readonly Segment[], now: Instant): Session {
  if (session.status !== 'ready') return session;
  if (timeline.length === 0)
    return complete({ ...session, startedAt: now.wall }, 0, now.wall, timeline);
  return { ...session, status: 'running', since: now, startedAt: now.wall };
}

export function pause(session: Session, timeline: readonly Segment[], now: Instant): Session {
  const marked = checkpoint(session, timeline, now);
  if (marked.status !== 'running') return marked;
  return { ...marked, status: 'paused', since: null };
}

export function resume(session: Session, now: Instant): Session {
  if (session.status !== 'paused') return session;
  return { ...session, status: 'running', since: now };
}

export function stop(session: Session, timeline: readonly Segment[], now: Instant): Session {
  const marked = checkpoint(session, timeline, now);
  if (marked.status !== 'running' && marked.status !== 'paused') return marked;
  return { ...marked, status: 'interrupted', since: null, endedAt: now.wall };
}

function jump(
  session: Session,
  timeline: readonly Segment[],
  now: Instant,
  target: number,
): Session {
  if (target >= timeline.length) return complete(session, session.activeMs, now.wall, timeline);
  return {
    ...session,
    position: { segment: Math.max(0, target), elapsedMs: 0 },
    since: session.status === 'running' ? now : null,
  };
}

export function skip(session: Session, timeline: readonly Segment[], now: Instant): Session {
  const marked = checkpoint(session, timeline, now);
  if (marked.status !== 'running' && marked.status !== 'paused') return marked;
  return jump(marked, timeline, now, marked.position.segment + 1);
}

export function back(session: Session, timeline: readonly Segment[], now: Instant): Session {
  const marked = checkpoint(session, timeline, now);
  if (marked.status !== 'running' && marked.status !== 'paused') return marked;
  const { segment, elapsedMs } = marked.position;
  return jump(marked, timeline, now, elapsedMs > BACK_RESTART_MS ? segment : segment - 1);
}

/** Salto pela lista (P3): vai para o início da etapa escolhida e marca a sessão como ajustada. */
export function jumpTo(
  session: Session,
  timeline: readonly Segment[],
  now: Instant,
  target: number,
): Session {
  const marked = checkpoint(session, timeline, now);
  if (marked.status !== 'running' && marked.status !== 'paused') return marked;
  if (target < 0 || target >= timeline.length) return marked;
  return { ...jump(marked, timeline, now, target), jumped: true };
}

/** "Concluí" em etapa por repetições. Em etapa com tempo não faz nada. */
export function advanceManual(
  session: Session,
  timeline: readonly Segment[],
  now: Instant,
): Session {
  const snap = snapshot(session, timeline, now);
  if (snap.finished || timeline[snap.segment]?.durationMs !== null) return session;
  return skip(session, timeline, now);
}

/**
 * Volta do segundo plano com o processo vivo. O relógio monotônico do RN para quando o
 * aparelho dorme; se o civil andou mais (até MAX_GAP_MS), vale o civil. Se andou menos
 * (hora do aparelho atrasada), vale o monotônico.
 */
export function resync(session: Session, now: Instant): Session {
  if (session.status !== 'running' || session.since === null) return session;
  const monoDelta = now.mono - session.since.mono;
  const wallDelta = now.wall - session.since.wall;
  if (wallDelta <= monoDelta + RESYNC_TOLERANCE_MS || wallDelta > MAX_GAP_MS) return session;
  return {
    ...session,
    since: { mono: now.mono - wallDelta, wall: session.since.wall },
    adjusted: true,
  };
}

/**
 * App reaberto (processo novo ou aparelho reiniciado): o monotônico gravado não vale mais,
 * então o tempo desde o último marco vem do relógio civil. Relógio voltando para trás ou
 * intervalo acima de MAX_GAP_MS não são confiáveis: a sessão fecha como interrompida no
 * último marco, sem inventar tempo.
 */
export function restore(session: Session, timeline: readonly Segment[], now: Instant): Session {
  if (session.status !== 'running' || session.since === null) return session;
  const gap = now.wall - session.since.wall;
  if (gap < 0 || gap > MAX_GAP_MS) {
    return {
      ...session,
      status: 'interrupted',
      since: null,
      endedAt: session.since.wall,
      adjusted: true,
    };
  }
  const rebased: Session = {
    ...session,
    since: { mono: now.mono - gap, wall: session.since.wall },
    adjusted: true,
  };
  return settle(rebased, timeline, now);
}
