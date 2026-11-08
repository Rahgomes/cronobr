import { router, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import { useStored } from '@/data/use-stored';
import { planAlerts } from '@/domain/alerts';
import { cuesFor } from '@/domain/cues';
import type { Session } from '@/domain/engine';
import type { SessionEvent } from '@/domain/events';
import { clock, duration } from '@/domain/format';
import { historyFromSession } from '@/domain/history';
import { DEFAULT_SESSION_PREFS, parseSessionPrefs } from '@/domain/session-prefs';
import { summarize, type Segment } from '@/domain/timeline';
import { isAway } from '@/features/cues/away';
import { useCues } from '@/features/cues/cue-context';
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
import { segmentTitle } from './labels';
import { FocusBody, ListBody, PHASE_TINT, RingBody } from './session-bodies';
import {
  LockButton,
  LockedHint,
  LOCKED_HINT,
  RoundControl,
  ViewSwitch,
  WideControl,
} from './session-controls';
import { useSessionRunner } from './use-session-runner';
import { useTouchLock } from './use-touch-lock';

/** Leitor de tela ouve a troca de fase; contagem e meio do tempo viram som na E03. */
function announce(events: SessionEvent[]) {
  for (const event of events) {
    if (event.type === 'completed') AccessibilityInfo.announceForAccessibility('Treino concluído');
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
  const { port, prefs } = useCues();
  const runner = useSessionRunner({
    initial,
    repo: repos.session,
    clock: clockSource,
    onMilestone: (next, now) => {
      port.schedule(planAlerts(next, runner.timeline, now, prefs));
    },
    onEvents: (events) => {
      // Fora da tela quem avisa são as notificações agendadas; tocar aqui também dobraria.
      if (!isAway()) port.play(cuesFor(events, runner.timeline, prefs));
      announce(events);
      const phase = events.find((event) => event.type === 'phase');
      const segment = phase ? runner.timeline[phase.segment] : undefined;
      if (segment) AccessibilityInfo.announceForAccessibility(segmentTitle(segment));
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
    dialog.alert('Encerrar o treino?', 'O que você já fez fica salvo no histórico.', [
      { text: 'Continuar treino', style: 'cancel' },
      { text: 'Encerrar', style: 'destructive', onPress: runner.stop },
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
              label="Parar de repetir"
              onPress={() => {
                setLooping(false);
              }}
            />
          ) : (
            <Button
              label="Voltar ao início"
              onPress={() => {
                router.replace('/');
              }}
            />
          )
        }
      >
        <View style={styles.content}>
          <Text variant="display" accessibilityRole="header">
            {done ? (timer ? 'Tempo esgotado' : 'Treino concluído') : 'Treino encerrado'}
          </Text>
          {restarting ? (
            <Notice tone="alert">{`Recomeça em ${String(AGAIN_DELAY_MS / 1000)} segundos.`}</Notice>
          ) : null}
          <Card>
            <Text variant="label">{session.routine.name}</Text>
            <Text color="textMuted">Tempo ativo: {duration(session.activeMs)}</Text>
            <Text color="textMuted">
              Exercícios feitos: {String(result?.workDone ?? 0)} de {String(result?.workTotal ?? 0)}
            </Text>
            {session.adjusted ? (
              <Text color="textMuted">Tempo recalculado pelo relógio do aparelho.</Text>
            ) : null}
            {session.jumped ? (
              <Text color="textMuted">Teve salto de etapa: fica marcado como ajustado.</Text>
            ) : null}
          </Card>
          {runner.saveFailed ? (
            <Notice
              tone="danger"
              action={{ label: 'Tentar salvar de novo', onPress: runner.retrySave }}
            >
              Não deu para salvar no histórico.
            </Notice>
          ) : null}
        </View>
      </Screen>
    );
  }

  if (session.status === 'ready') {
    const summary = summarize(timeline);
    return (
      <Screen footer={<Button label="Começar" onPress={runner.start} />}>
        <View style={styles.ready}>
          <RoundAction
            icon="close"
            label="Fechar"
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
            <Text variant="label">Duração total: {clock(summary.knownMs)}</Text>
            <Text color="textMuted">
              {String(summary.workCount)} exercícios
              {summary.manualCount > 0 ? ` · ${String(summary.manualCount)} por repetições` : ''}
            </Text>
          </Card>
          <Card>
            <Text variant="label">Como ver o treino</Text>
            <ViewSwitch
              value={view}
              onChange={(next) => {
                setPrefs({ ...prefsSession, view: next });
              }}
            />
            <View style={styles.option}>
              <View style={styles.grow}>
                <Text variant="label">Travar a tela ao começar</Text>
                <Text variant="caption" color="textMuted">
                  Evita pausar ou pular sem querer. Segure o cadeado para destravar.
                </Text>
              </View>
              <Switch
                value={prefsSession.lockOnStart}
                accessibilityLabel="Travar a tela ao começar"
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

  const segment = timeline[snap.segment];
  const manual = segment?.durationMs === null;
  const paused = session.status === 'paused';
  const { locked } = lock;
  const focus = view === 'foco';
  const tint = focus && segment ? colors[PHASE_TINT[segment.phase]] : undefined;
  const blocked = () => {
    AccessibilityInfo.announceForAccessibility(LOCKED_HINT);
  };
  // Toda ação destravada adia a volta da trava.
  const touch = (fn: () => void) => () => {
    lock.poke();
    fn();
  };
  const jump = (row: Segment) => {
    lock.poke();
    dialog.alert(
      `Ir para ${segmentTitle(row)}?`,
      'O treino segue dali. No histórico ele fica marcado como ajustado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ir para a etapa',
          onPress: () => {
            runner.jumpTo(row.index);
          },
        },
      ],
    );
  };
  return (
    <Screen
      tint={tint}
      footer={
        <View style={styles.actions}>
          {manual ? (
            <WideControl
              label="Concluí"
              locked={locked}
              onBlocked={blocked}
              onPress={touch(runner.advanceManual)}
            />
          ) : null}
          {locked ? <LockedHint /> : null}
          <View style={styles.controls}>
            <RoundControl
              icon="skip-previous"
              label="Etapa anterior"
              locked={locked}
              onBlocked={blocked}
              onPhase={focus}
              onPress={touch(runner.back)}
            />
            <RoundControl
              big
              icon={paused ? 'play' : 'pause'}
              label={paused ? 'Retomar' : 'Pausar'}
              locked={locked}
              holdWhenLocked
              onBlocked={blocked}
              onPhase={focus}
              onPress={touch(paused ? runner.resume : runner.pause)}
            />
            <RoundControl
              icon="skip-next"
              label="Pular etapa"
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
      }
    >
      <View style={styles.top}>
        <RoundAction
          icon="close"
          label="Encerrar treino"
          onPress={locked ? blocked : touch(confirmStop)}
        />
        <LockButton
          locked={locked}
          lock={lock.lock}
          unlock={lock.unlock}
          onBlocked={blocked}
          onPhase={focus}
        />
      </View>
      {segment ? (
        <View style={styles.content}>
          {view === 'foco' ? (
            <FocusBody timeline={timeline} snap={snap} segment={segment} />
          ) : view === 'lista' ? (
            <ListBody
              timeline={timeline}
              snap={snap}
              segment={segment}
              onJump={locked ? null : jump}
            />
          ) : (
            <RingBody timeline={timeline} snap={snap} segment={segment} />
          )}
          {paused ? <Notice tone="alert">Pausado</Notice> : null}
          {runner.progressFailed ? (
            <Notice tone="danger">
              Não deu para gravar o progresso. O treino continua, mas se o app fechar ele pode
              voltar de um ponto anterior.
            </Notice>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: space.md },
  ready: { alignItems: 'flex-end', paddingTop: space.md },
  content: { gap: space.lg },
  actions: { gap: space.md },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  switchBox: { alignSelf: 'center', borderRadius: radius.pill, padding: space.xs },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
});
