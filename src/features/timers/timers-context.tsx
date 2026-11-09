// Vários temporizadores (E07 A). Um provedor na raiz guarda a lista, faz a única leitura de relógio
// (D95), agenda os fins como notificações do dono 'temporizadores' (D96) e avisa a conclusão de
// cada um pelo nome, em qualquer tela do app.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo } from 'react-native';

import { useStored } from '@/data/use-stored';
import type { PlannedAlert } from '@/domain/alerts';
import type { Instant } from '@/domain/engine';
import {
  announce,
  canAdd,
  collide,
  createTimer,
  endsAt,
  parseTimers,
  pause,
  rebase,
  repeat,
  start,
  tick,
  type Timer,
} from '@/domain/timers';
import { isAway } from '@/features/cues/away';
import { useCues } from '@/features/cues/cue-context';
import { isSessionRunning } from '@/features/cues/session-active';
import { newSessionId, systemClock, type Clock } from '@/features/session/clock';
import { useT } from '@/i18n/i18n-context';
import { dialog } from '@/ui/dialog';

export const TIMERS_KEY = 'temporizadores';
/** Leitura de tela: 4 por segundo basta para o segundo mudar na hora certa. */
export const TIMERS_TICK_MS = 250;
/** Fim percebido depois disso (app reaberto horas depois) não toca de novo: a notificação já avisou. */
const STALE_MS = 5000;

interface TimersState {
  timers: Timer[];
  now: Instant;
  ready: boolean;
  add: (name: string, durationMs: number) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  repeat: (id: string) => void;
  remove: (id: string) => void;
}

const EMPTY: Timer[] = [];
const noop = () => undefined;
const TimersContext = createContext<TimersState>({
  timers: EMPTY,
  now: { mono: 0, wall: 0 },
  ready: false,
  add: noop,
  pause: noop,
  resume: noop,
  repeat: noop,
  remove: noop,
});

export function TimersProvider({
  children,
  clockSource = systemClock,
}: {
  children: ReactNode;
  clockSource?: Clock;
}) {
  const t = useT();
  const { port, prefs } = useCues();
  // Ao ler o gravado, cada marco é recalculado pelo relógio civil (outro processo, outro mono).
  const [timers, save, ready] = useStored(
    TIMERS_KEY,
    (raw) => parseTimers(raw).map((timer) => rebase(timer, clockSource.now())),
    EMPTY,
  );
  const [now, setNow] = useState(() => clockSource.now());
  // O intervalo lê sempre a lista mais nova sem ser recriado a cada mudança.
  const latest = useRef({ timers, save });
  // Fins já avisados junto com outro (D98): id -> hora do fim.
  const announced = useRef<ReadonlyMap<string, number>>(new Map());
  // O botão do diálogo é tocado depois: usa as ações da lista mais nova.
  const actions = useRef<Pick<TimersState, 'repeat'>>({ repeat: noop });
  useEffect(() => {
    latest.current = { timers, save };
  });

  const running = timers.some((timer) => timer.status === 'running');
  useEffect(() => {
    if (!running) return;
    const read = () => {
      const at = clockSource.now();
      setNow(at);
      const result = tick(latest.current.timers, at);
      if (result.done.length === 0) return;
      latest.current.save(result.timers);
      const fresh = result.done.filter((timer) => at.wall - (timer.doneAt ?? 0) < STALE_MS);
      // Fins a menos de 1 s viram um aviso só, como na notificação agendada: sem isso o segundo
      // diálogo trocava o primeiro e a segunda fala cortava a primeira.
      const { group, announced: next } = announce(fresh, result.timers, announced.current);
      announced.current = next;
      if (group.length === 0) return;
      const text = t.timers.finished(group.map((timer) => timer.name));
      // Aviso escrito no diálogo do app, por cima de qualquer tela (inclusive da sessão). Um só
      // terminou: dá para repetir dali mesmo.
      const single = group.length === 1 ? group[0] : undefined;
      dialog.alert(text, undefined, [
        ...(single
          ? [
              {
                text: t.timers.repeat,
                onPress: () => {
                  actions.current.repeat(single.id);
                },
              },
            ]
          : []),
        { text: t.timers.ok, style: 'cancel' as const },
      ]);
      // Fora da tela quem avisa é a notificação; aqui dobraria.
      if (!isAway()) {
        port.play({
          sound: prefs.sound ? prefs.sounds.finish : null,
          speech: prefs.voice && !isSessionRunning() ? text : null,
          haptic: prefs.vibration ? 'finish' : null,
        });
      }
      AccessibilityInfo.announceForAccessibility(text);
    };
    read();
    const id = setInterval(read, TIMERS_TICK_MS);
    return () => {
      clearInterval(id);
    };
  }, [running, clockSource, port, prefs, t]);

  // Cada mudança da lista refaz os avisos agendados deste dono (o treino não é tocado).
  useEffect(() => {
    if (!ready) return;
    port.schedule(
      'temporizadores',
      planTimerAlerts(timers, prefs.sound ? prefs.sounds.finish : null, t),
    );
  }, [ready, timers, port, prefs, t]);

  const value = useMemo<TimersState>(() => {
    const change = (id: string, step: (timer: Timer, at: Instant) => Timer) => {
      const at = clockSource.now();
      setNow(at);
      save(timers.map((timer) => (timer.id === id ? step(timer, at) : timer)));
    };
    return {
      timers,
      now,
      ready,
      add: (name, durationMs) => {
        if (!canAdd(timers)) return;
        const at = clockSource.now();
        setNow(at);
        const label = name.trim() || t.timers.defaultName(timers.length + 1);
        save([...timers, start(createTimer(newSessionId(at.wall), label, durationMs), at)]);
      },
      pause: (id) => {
        change(id, pause);
      },
      resume: (id) => {
        change(id, start);
      },
      repeat: (id) => {
        change(id, repeat);
      },
      remove: (id) => {
        save(timers.filter((timer) => timer.id !== id));
      },
    };
  }, [timers, now, ready, save, clockSource, t]);
  useEffect(() => {
    actions.current = value;
  });

  return <TimersContext.Provider value={value}>{children}</TimersContext.Provider>;
}

type Words = ReturnType<typeof useT>;

/** Fins dos que estão rodando, agrupados pela política de colisão (D98): um aviso por grupo. */
function planTimerAlerts(
  timers: readonly Timer[],
  sound: PlannedAlert['sound'],
  t: Words,
): PlannedAlert[] {
  const ends = timers.flatMap((timer) => {
    const at = endsAt(timer);
    return at === null ? [] : [{ at, name: timer.name }];
  });
  return collide(ends).map((group) => ({
    at: group[0]?.at ?? 0,
    segment: null,
    title: t.timers.finished(group.map((end) => end.name)),
    body: t.timers.notifyBody,
    sound,
  }));
}

export function useTimers(): TimersState {
  return useContext(TimersContext);
}
