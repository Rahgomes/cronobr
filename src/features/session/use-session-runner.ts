// Liga o motor puro à tela: lê o relógio num intervalo curto, grava marcos e dispara efeitos.
// A tela só MOSTRA o que o motor calcula; se o intervalo atrasar ou parar, a próxima leitura
// acerta a posição sozinha (critério de aceite do PRD 02).
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { SessionRepo } from '@/data/repos';
import {
  advanceManual,
  back,
  checkpoint,
  pause,
  resume,
  resync,
  settle,
  skip,
  snapshot,
  start,
  stop,
  type Instant,
  type Session,
  type Snapshot,
} from '@/domain/engine';
import { eventsBetween, type SessionEvent } from '@/domain/events';
import { historyFromSession } from '@/domain/history';
import { buildTimeline } from '@/domain/timeline';

import type { Clock } from './clock';

export const TICK_MS = 250;

type Step = (session: Session, now: Instant) => Session;

export interface Runner {
  session: Session;
  snap: Snapshot;
  timeline: ReturnType<typeof buildTimeline>;
  /** Falhou gravar o histórico: a tela avisa e oferece tentar de novo. */
  saveFailed: boolean;
  /** Falhou gravar o marco da sessão: o treino segue, mas a retomada pode voltar a um ponto anterior. */
  progressFailed: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  back: () => void;
  stop: () => void;
  advanceManual: () => void;
  retrySave: () => void;
}

export function useSessionRunner({
  initial,
  repo,
  clock,
  onEvents,
}: {
  initial: Session;
  repo: SessionRepo;
  clock: Clock;
  onEvents?: (events: SessionEvent[], snap: Snapshot) => void;
}): Runner {
  const timeline = useMemo(() => buildTimeline(initial.routine), [initial.routine]);
  const sessionRef = useRef(initial);
  const lastSnap = useRef<Snapshot | null>(null);
  const finished = useRef<string | null>(null);
  const [view, setView] = useState(() => ({
    session: initial,
    snap: snapshot(initial, timeline, clock.now()),
  }));
  const [saveFailed, setSaveFailed] = useState(false);
  const [progressFailed, setProgressFailed] = useState(false);
  // O intervalo e o AppState vivem além de um render: leem sempre a versão atual por ref.
  const latest = useRef({ repo, clock, onEvents });
  useEffect(() => {
    latest.current = { repo, clock, onEvents };
  });

  function finalize(session: Session) {
    if (finished.current === session.id) return;
    finished.current = session.id;
    const entry = historyFromSession(session, timeline);
    const { repo: current } = latest.current;
    const write = entry ? current.finish(entry) : current.discard();
    write.then(
      () => {
        setSaveFailed(false);
      },
      () => {
        finished.current = null;
        setSaveFailed(true);
      },
    );
  }

  function apply(next: Session, now: Instant, persist: boolean) {
    const snap = snapshot(next, timeline, now);
    const events = lastSnap.current ? eventsBetween(timeline, lastSnap.current, snap) : [];
    lastSnap.current = snap;
    sessionRef.current = next;
    setView({ session: next, snap });
    if (events.length > 0) latest.current.onEvents?.(events, snap);
    if (next.status === 'completed' || next.status === 'interrupted') finalize(next);
    else if (persist && next.status !== 'ready') {
      latest.current.repo.save(next).then(
        () => {
          setProgressFailed(false);
        },
        () => {
          setProgressFailed(true);
        },
      );
    }
  }

  function act(step: Step) {
    const now = latest.current.clock.now();
    const current = sessionRef.current;
    const next = step(current, now);
    if (next !== current) apply(next, now, true);
  }

  function tick() {
    const current = sessionRef.current;
    if (current.status !== 'running') return;
    const now = latest.current.clock.now();
    let next = settle(current, timeline, now);
    const segment = snapshot(next, timeline, now).segment;
    // Marco a cada troca de fase: se o app morrer, a retomada parte daqui.
    if (next.status === 'running' && segment !== lastSnap.current?.segment) {
      next = checkpoint(next, timeline, now);
    }
    apply(next, now, next !== current);
  }

  // Sessão restaurada já terminada (app reaberto depois do fim): registra na abertura.
  useEffect(() => {
    const current = sessionRef.current;
    lastSnap.current = snapshot(current, timeline, latest.current.clock.now());
    if (current.status === 'completed' || current.status === 'interrupted') finalize(current);
    // Só na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = view.session.status === 'running';
  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, TICK_MS);
    return () => {
      clearInterval(id);
    };
    // tick lê tudo por ref; o intervalo só depende de estar rodando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        act((s, now) => resync(s, now));
        tick();
      } else {
        act((s, now) => checkpoint(s, timeline, now));
      }
    });
    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...view,
    timeline,
    saveFailed,
    progressFailed,
    start: () => {
      act((s, now) => start(s, timeline, now));
    },
    pause: () => {
      act((s, now) => pause(s, timeline, now));
    },
    resume: () => {
      act((s, now) => resume(s, now));
    },
    skip: () => {
      act((s, now) => skip(s, timeline, now));
    },
    back: () => {
      act((s, now) => back(s, timeline, now));
    },
    stop: () => {
      act((s, now) => stop(s, timeline, now));
    },
    advanceManual: () => {
      act((s, now) => advanceManual(s, timeline, now));
    },
    retrySave: () => {
      finalize(sessionRef.current);
    },
  };
}
