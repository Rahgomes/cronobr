import { router, usePreventRemove } from 'expo-router';
import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import { planAlerts } from '@/domain/alerts';
import { cuesFor, PHASE_LABEL } from '@/domain/cues';
import type { Session } from '@/domain/engine';
import type { SessionEvent } from '@/domain/events';
import { clock, duration } from '@/domain/format';
import { historyFromSession } from '@/domain/history';
import { summarize } from '@/domain/timeline';
import { isAway } from '@/features/cues/away';
import { useCues } from '@/features/cues/cue-context';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { dialog } from '@/ui/dialog';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { space } from '@/ui/tokens';
import { RoundAction } from '@/ui/top-bar';

import { systemClock, type Clock } from './clock';
import { roundLabel, segmentTitle } from './labels';
import { useSessionRunner } from './use-session-runner';

/** Leitor de tela ouve a troca de fase; contagem e meio do tempo viram som na E03. */
function announce(events: SessionEvent[]) {
  for (const event of events) {
    if (event.type === 'completed') AccessibilityInfo.announceForAccessibility('Treino concluído');
  }
}

export function SessionView({
  initial,
  clockSource = systemClock,
}: {
  initial: Session;
  clockSource?: Clock;
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
  const running = session.status === 'running';

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
    return (
      <Screen
        footer={
          <Button
            label="Voltar ao início"
            onPress={() => {
              router.replace('/');
            }}
          />
        }
      >
        <View style={styles.content}>
          <Text variant="display" accessibilityRole="header">
            {done ? 'Treino concluído' : 'Treino encerrado'}
          </Text>
          <Card>
            <Text variant="label">{session.routine.name}</Text>
            <Text color="textMuted">Tempo ativo: {duration(session.activeMs)}</Text>
            <Text color="textMuted">
              Exercícios feitos: {String(result?.workDone ?? 0)} de {String(result?.workTotal ?? 0)}
            </Text>
            {session.adjusted ? (
              <Text color="textMuted">Tempo recalculado pelo relógio do aparelho.</Text>
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
        <View style={styles.top}>
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
        </View>
      </Screen>
    );
  }

  const segment = timeline[snap.segment];
  const next = timeline[snap.segment + 1];
  const manual = segment?.durationMs === null;
  const paused = session.status === 'paused';
  return (
    <Screen
      footer={
        <View style={styles.actions}>
          {manual ? <Button label="Concluí" onPress={runner.advanceManual} /> : null}
          <Button
            label={paused ? 'Retomar' : 'Pausar'}
            kind={manual ? 'secondary' : 'primary'}
            onPress={paused ? runner.resume : runner.pause}
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button label="Etapa anterior" kind="text" onPress={runner.back} />
            </View>
            <View style={styles.flex}>
              <Button label="Pular etapa" kind="text" onPress={runner.skip} />
            </View>
          </View>
        </View>
      }
    >
      <View style={styles.top}>
        <RoundAction icon="close" label="Encerrar treino" onPress={confirmStop} />
      </View>
      {segment ? (
        <View style={styles.content}>
          <Text variant="title" accessibilityRole="header">
            {segmentTitle(segment)}
          </Text>
          {roundLabel(segment) ? <Text color="textMuted">{roundLabel(segment)}</Text> : null}
          <Text
            variant="display"
            tabular
            style={styles.clock}
            accessibilityRole="timer"
            accessibilityLabel={
              manual
                ? `${String(segment.reps)} repetições`
                : `Faltam ${duration(Math.ceil((snap.remainingMs ?? 0) / 1000) * 1000)}`
            }
          >
            {manual ? `${String(segment.reps)} rep.` : clock(snap.remainingMs ?? 0)}
          </Text>
          {paused ? <Notice tone="alert">Pausado</Notice> : null}
          {runner.progressFailed ? (
            <Notice tone="danger">
              Não deu para gravar o progresso. O treino continua, mas se o app fechar ele pode
              voltar de um ponto anterior.
            </Notice>
          ) : null}
          <Text color="textMuted">
            {next
              ? `Depois: ${PHASE_LABEL[next.phase]} ${next.durationMs === null ? '' : clock(next.durationMs)}`
              : 'Última etapa'}
          </Text>
          <Text color="textMuted">Restante no treino: {clock(snap.totalRemainingMs)}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-end', paddingTop: space.md },
  content: { gap: space.lg, paddingTop: space.lg },
  clock: { fontSize: 96, lineHeight: 104, textAlign: 'center' },
  actions: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
