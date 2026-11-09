import { router, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import { useStored } from '@/data/use-stored';
import { planAlerts } from '@/domain/alerts';
import { cuesFor, earlyRestCues, segmentTitle } from '@/domain/cues';
import { restingEarly, type Session } from '@/domain/engine';
import type { SessionEvent } from '@/domain/events';
import { clock, duration } from '@/domain/format';
import { historyFromSession } from '@/domain/history';
import { DEFAULT_SESSION_PREFS, parseSessionPrefs } from '@/domain/session-prefs';
import { summarize, type Segment } from '@/domain/timeline';
import { isAway } from '@/features/cues/away';
import { useCues } from '@/features/cues/cue-context';
import { useT } from '@/i18n/i18n-context';
import type { Messages } from '@/i18n/messages/pt';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { dialog } from '@/ui/dialog';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { Switch } from '@/ui/switch';
import { Text } from '@/ui/text';
import { useColors } from '@/ui/theme-context';
import { radius, space } from '@/ui/tokens';
import { RoundAction } from '@/ui/top-bar';

import { systemClock, type Clock } from './clock';
import { CONTROLS_WIDTH, sessionRoom } from './room';
import { FocusBody, ListBody, PHASE_TINT, RingBody } from './session-bodies';
import {
  LockButton,
  LockedHint,
  RoundControl,
  RoundCounter,
  ViewSwitch,
  WideControl,
} from './session-controls';
import { useSessionRunner } from './use-session-runner';
import { useTouchLock } from './use-touch-lock';

/** Leitor de tela ouve a troca de fase; contagem e meio do tempo viram som na E03. */
function announce(events: SessionEvent[], t: Messages) {
  for (const event of events) {
    if (event.type === 'completed') AccessibilityInfo.announceForAccessibility(t.session.completed);
  }
}

export const SESSION_PREFS_KEY = 'sessao';

/** Temporizador em repetição: tempo entre o fim e o recomeço, para dar para parar. */
export const AGAIN_DELAY_MS = 3000;

export function SessionView({
  initial,
  clockSource = systemClock,
  autoStart = false,
  again,
}: {
  initial: Session;
  clockSource?: Clock;
  /** Começa sozinha ao abrir (recomeço do temporizador em repetição). */
  autoStart?: boolean;
  /** "Repetir ao concluir": recomeça depois de AGAIN_DELAY_MS, a não ser que a pessoa pare. */
  again?: (() => void) | undefined;
}) {
  const repos = useRepos();
  const t = useT();
  const w = t.words;
  const { port, prefs } = useCues();
  const runner = useSessionRunner({
    initial,
    repo: repos.session,
    clock: clockSource,
    onMilestone: (next, now) => {
      port.schedule(planAlerts(next, runner.timeline, now, prefs, w));
    },
    onEvents: (all, snap) => {
      // EMOM terminado antes: a metade do minuto já é descanso, não tem o que avisar.
      const events = restingEarly(runner.session, snap)
        ? all.filter((event) => event.type !== 'halfway')
        : all;
      // Fora da tela quem avisa são as notificações agendadas; tocar aqui também dobraria.
      if (!isAway()) port.play(cuesFor(events, runner.timeline, prefs, w));
      announce(events, t);
      const phase = events.find((event) => event.type === 'phase');
      const segment = phase ? runner.timeline[phase.segment] : undefined;
      if (segment) AccessibilityInfo.announceForAccessibility(segmentTitle(segment, w));
    },
  });
  const { session, snap, timeline } = runner;
  const active = session.status === 'running' || session.status === 'paused';
  const colors = useColors();
  const [prefsSession, setPrefs] = useStored(
    SESSION_PREFS_KEY,
    parseSessionPrefs,
    DEFAULT_SESSION_PREFS,
  );
  const { view } = prefsSession;
  const lock = useTouchLock({ auto: prefsSession.lockOnStart, active });
  const running = session.status === 'running';
  const window = useWindowDimensions();
  const room = sessionRoom(window.width, window.height);

  useEffect(() => {
    if (autoStart && runner.session.status === 'ready') runner.start();
    // Só na abertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finished = session.status === 'completed';
  const [looping, setLooping] = useState(true);
  useEffect(() => {
    if (!finished || !again || !looping) return;
    const id = setTimeout(again, AGAIN_DELAY_MS);
    return () => {
      clearTimeout(id);
    };
  }, [finished, again, looping]);

  // Tela acesa só rodando; ao sair da tela de sessão, nada fica agendado nem aceso.
  useEffect(() => {
    port.keepAwake(running);
  }, [port, running]);
  useEffect(
    () => () => {
      port.keepAwake(false);
      port.schedule([]);
    },
    [port],
  );

  function confirmStop() {
    dialog.alert(t.session.stopTitle, t.session.stopMessage, [
      { text: t.session.continueWorkout, style: 'cancel' },
      { text: t.session.stop, style: 'destructive', onPress: runner.stop },
    ]);
  }
  // Voltar do sistema (gesto ou botão) no meio do treino pede confirmação, como o X.
  usePreventRemove(active, confirmStop);

  if (session.status === 'completed' || session.status === 'interrupted') {
    const done = session.status === 'completed';
    const result = historyFromSession(session, timeline);
    const timer = session.routine.modality === 'temporizador';
    const restarting = done && again !== undefined && looping;
    return (
      <Screen
        footer={
          restarting ? (
            <Button
              label={t.session.stopRepeating}
              onPress={() => {
                setLooping(false);
              }}
            />
          ) : (
            <Button
              label={t.session.backHome}
              onPress={() => {
                router.replace('/');
              }}
            />
          )
        }
      >
        <View style={styles.content}>
          <Text variant="display" accessibilityRole="header">
            {done ? (timer ? t.session.timeUp : t.session.completed) : t.session.interrupted}
          </Text>
          {restarting ? (
            <Notice tone="alert">{t.session.restarting(AGAIN_DELAY_MS / 1000)}</Notice>
          ) : null}
          <Card>
            <Text variant="label">{session.routine.name}</Text>
            <Text color="textMuted">{t.session.activeTime(duration(session.activeMs))}</Text>
            <Text color="textMuted">
              {t.session.exercisesDone(result?.workDone ?? 0, result?.workTotal ?? 0)}
            </Text>
            {session.adjusted ? <Text color="textMuted">{t.session.adjustedTime}</Text> : null}
            {session.tally === undefined ? null : (
              <Text color="textMuted">{t.session.roundsRecorded(session.tally)}</Text>
            )}
            {session.jumped ? <Text color="textMuted">{t.session.jumped}</Text> : null}
          </Card>
          {runner.saveFailed ? (
            <Notice
              tone="danger"
              action={{ label: t.session.retrySave, onPress: runner.retrySave }}
            >
              {t.session.saveFailed}
            </Notice>
          ) : null}
          {runner.saved && !restarting ? (
            <Button
              label={t.session.writeNote}
              kind="secondary"
              onPress={() => {
                router.push({ pathname: '/historico/[id]', params: { id: session.id } });
              }}
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  if (session.status === 'ready') {
    const summary = summarize(timeline);
    return (
      <Screen footer={<Button label={t.session.start} onPress={runner.start} />}>
        <View style={styles.ready}>
          <RoundAction
            icon="close"
            label={t.session.close}
            onPress={() => {
              router.back();
            }}
          />
        </View>
        <View style={styles.content}>
          <Text variant="display" accessibilityRole="header">
            {session.routine.name}
          </Text>
          <Card>
            <Text variant="label">{t.session.totalDuration(clock(summary.knownMs))}</Text>
            <Text color="textMuted">
              {t.session.exerciseSummary(summary.workCount, summary.manualCount)}
            </Text>
          </Card>
          <Card>
            <Text variant="label">{t.session.viewTitle}</Text>
            <ViewSwitch
              value={view}
              onChange={(next) => {
                setPrefs({ ...prefsSession, view: next });
              }}
            />
            <View style={styles.option}>
              <View style={styles.grow}>
                <Text variant="label">{t.session.lockOnStart}</Text>
                <Text variant="caption" color="textMuted">
                  {t.session.lockOnStartHint}
                </Text>
              </View>
              <Switch
                value={prefsSession.lockOnStart}
                accessibilityLabel={t.session.lockOnStart}
                onValueChange={(value) => {
                  setPrefs({ ...prefsSession, lockOnStart: value });
                }}
              />
            </View>
          </Card>
        </View>
      </Screen>
    );
  }

  const current = timeline[snap.segment];
  const resting = restingEarly(session, snap);
  // EMOM terminado antes: a tela mostra descanso até a virada do minuto.
  const segment: Segment | undefined =
    current && resting
      ? { ...current, phase: 'rest', name: null, side: undefined, early: false }
      : current;
  const manual = segment?.durationMs === null;
  const canFinishEarly = segment?.early === true;
  const amrap = session.routine.modality === 'amrap';
  const paused = session.status === 'paused';
  const { locked } = lock;
  const focus = view === 'foco';
  const tint = focus && segment ? colors[PHASE_TINT[segment.phase]] : undefined;
  const blocked = () => {
    AccessibilityInfo.announceForAccessibility(t.session.lockedHint);
  };
  // Toda ação destravada adia a volta da trava.
  const touch = (fn: () => void) => () => {
    lock.poke();
    fn();
  };
  const jump = (row: Segment) => {
    lock.poke();
    dialog.alert(t.session.jumpTitle(segmentTitle(row, w)), t.session.jumpMessage, [
      { text: t.session.cancel, style: 'cancel' },
      {
        text: t.session.jumpConfirm,
        onPress: () => {
          runner.jumpTo(row.index);
        },
      },
    ]);
  };
  const actions = (
    <View style={styles.actions}>
      {amrap ? (
        <RoundCounter
          count={session.tally ?? 0}
          locked={locked}
          onAdd={() => {
            lock.poke();
            runner.logRound(1);
          }}
          onUndo={touch(() => {
            runner.logRound(-1);
          })}
        />
      ) : null}
      {canFinishEarly ? (
        <WideControl
          label={t.session.finishEarly}
          locked={locked}
          onBlocked={blocked}
          onPress={touch(() => {
            runner.finishEarly();
            if (!isAway()) port.play(earlyRestCues(prefs, w));
          })}
        />
      ) : null}
      {manual ? (
        <WideControl
          label={t.session.advanceManual}
          locked={locked}
          onBlocked={blocked}
          onPress={touch(runner.advanceManual)}
        />
      ) : null}
      {locked ? <LockedHint /> : null}
      <View style={styles.controls}>
        <RoundControl
          icon="skip-previous"
          label={t.session.previousStep}
          locked={locked}
          onBlocked={blocked}
          onPhase={focus}
          onPress={touch(runner.back)}
        />
        <RoundControl
          big
          icon={paused ? 'play' : 'pause'}
          label={paused ? t.session.resume : t.session.pause}
          locked={locked}
          holdWhenLocked
          onBlocked={blocked}
          onPhase={focus}
          onPress={touch(paused ? runner.resume : runner.pause)}
        />
        <RoundControl
          icon="skip-next"
          label={t.session.skipStep}
          locked={locked}
          onBlocked={blocked}
          onPhase={focus}
          onPress={touch(runner.skip)}
        />
      </View>
      {locked ? null : (
        <View style={focus ? [styles.switchBox, { backgroundColor: colors.surface }] : null}>
          <ViewSwitch
            value={view}
            onChange={(next) => {
              lock.poke();
              setPrefs({ ...prefsSession, view: next });
            }}
          />
        </View>
      )}
    </View>
  );
  const topRow = (
    <View style={styles.top}>
      <RoundAction
        icon="close"
        label={t.session.stopWorkout}
        {...(focus ? { tone: 'onPhase' as const } : {})}
        onPress={locked ? blocked : touch(confirmStop)}
      />
      <Text
        variant="caption"
        color={focus ? 'onPhaseMuted' : 'textMuted'}
        style={styles.routineName}
        numberOfLines={2}
      >
        {session.routine.name}
      </Text>
      <LockButton
        locked={locked}
        lock={lock.lock}
        unlock={lock.unlock}
        onBlocked={blocked}
        onPhase={focus}
      />
    </View>
  );
  const main = (
    <>
      {segment ? (
        <View style={styles.content}>
          {view === 'foco' ? (
            <FocusBody timeline={timeline} snap={snap} segment={segment} room={room} />
          ) : view === 'lista' ? (
            <ListBody
              timeline={timeline}
              snap={snap}
              segment={segment}
              room={room}
              onJump={locked ? null : jump}
            />
          ) : (
            <RingBody timeline={timeline} snap={snap} segment={segment} room={room} />
          )}
          {paused ? <Notice tone="alert">{t.session.paused}</Notice> : null}
          {runner.progressFailed ? <Notice tone="danger">{t.session.progressFailed}</Notice> : null}
        </View>
      ) : null}
    </>
  );
  // Paisagem (E06 C): corpo à esquerda, controles à direita, tudo sem rolar.
  if (room.wide) {
    return (
      <Screen tint={tint} wide>
        <View style={styles.wide} testID="session-wide">
          <View style={styles.grow}>{main}</View>
          <View style={styles.side}>
            {topRow}
            <View style={styles.sideActions}>{actions}</View>
          </View>
        </View>
      </Screen>
    );
  }
  return (
    <Screen tint={tint} footer={actions}>
      {topRow}
      {main}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingTop: space.md,
  },
  routineName: { flex: 1, textAlign: 'center' },
  ready: { alignItems: 'flex-end', paddingTop: space.md },
  content: { gap: space.lg },
  actions: { gap: space.md },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  switchBox: { alignSelf: 'center', borderRadius: radius.pill, padding: space.xs },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
  wide: { flexDirection: 'row', gap: space.lg, flexGrow: 1 },
  side: { width: CONTROLS_WIDTH, gap: space.md },
  sideActions: { flexGrow: 1, justifyContent: 'center' },
});
