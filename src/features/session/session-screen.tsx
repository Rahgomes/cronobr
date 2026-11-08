import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import { createSession, restore, type Session } from '@/domain/engine';
import { quickRoutine, type QuickSetup } from '@/domain/quick';
import type { Routine } from '@/domain/routine';
import { buildTimeline } from '@/domain/timeline';
import { usePresets } from '@/features/routines/presets';
import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { useColors } from '@/ui/theme-context';
import { space } from '@/ui/tokens';

import { newSessionId, systemClock, type Clock } from './clock';
import { SessionView } from './session-view';

type Load =
  | { status: 'loading' }
  | { status: 'ready'; session: Session; autoStart: boolean }
  | { status: 'missing' | 'failed' };

/**
 * Entrada da sessão. Sessão em andamento sempre tem prioridade: abrir outra rotina não pode
 * sobrescrever um treino que ainda está rodando (ele é retomado de onde está de verdade).
 */
export function SessionScreen({
  routineId,
  repeatId,
  quick = null,
  loop = false,
  clockSource = systemClock,
}: {
  routineId: string | undefined;
  /** Id de um registro do histórico: repete exatamente a rotina que rodou ali. */
  repeatId?: string | undefined;
  /** Início rápido: a rotina vem pela rota, sem estar salva. */
  quick?: QuickSetup | null;
  /** Temporizador "repetir ao concluir": ao acabar, recomeça sozinho. */
  loop?: boolean;
  clockSource?: Clock;
}) {
  const repos = useRepos();
  const t = useT();
  const presets = usePresets();
  const colors = useColors();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const quickKey = quick ? JSON.stringify(quick) : '';

  useEffect(() => {
    let active = true;
    const pick = async (): Promise<Routine | null> => {
      if (quick) {
        const built = quickRoutine(quick, t.words);
        return built.ok ? built.routine : null;
      }
      if (repeatId) return (await repos.history.get(repeatId))?.routine ?? null;
      if (routineId) return presets.byId(routineId) ?? (await repos.routines.get(routineId));
      return null;
    };
    const resolve = async (): Promise<Load> => {
      const saved = await repos.session.load();
      if (saved) {
        const now = clockSource.now();
        return {
          status: 'ready',
          session: restore(saved, buildTimeline(saved.routine), now),
          autoStart: false,
        };
      }
      const routine = await pick();
      return routine
        ? { status: 'ready', session: createSession(newSessionId(), routine), autoStart: false }
        : { status: 'missing' };
    };
    void resolve()
      .catch((): Load => ({ status: 'failed' }))
      .then((next) => {
        if (active) setLoad(next);
      });
    return () => {
      active = false;
    };
    // `quick` muda de identidade a cada render da rota: a chave é o conteúdo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos, routineId, repeatId, clockSource, quickKey, presets, t]);

  if (load.status === 'ready') {
    const routine = load.session.routine;
    return (
      <SessionView
        // Sessão nova = runner novo (repetir ao concluir troca a sessão na mesma tela).
        key={load.session.id}
        initial={load.session}
        clockSource={clockSource}
        autoStart={load.autoStart}
        again={
          loop
            ? () => {
                setLoad({
                  status: 'ready',
                  session: createSession(newSessionId(), routine),
                  autoStart: true,
                });
              }
            : undefined
        }
      />
    );
  }
  if (load.status === 'missing' || load.status === 'failed') {
    const missing = load.status === 'missing';
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
          <Text variant="title" accessibilityRole="header">
            {missing ? 'Rotina não encontrada' : 'Não deu para abrir o treino'}
          </Text>
          <Text color="textMuted">
            {missing
              ? 'Ela pode ter sido apagada. Escolha outra no início.'
              : 'Seus dados continuam guardados. Volte ao início e tente de novo.'}
          </Text>
        </View>
      </Screen>
    );
  }
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} accessibilityLabel="Abrindo o treino" />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg, paddingTop: space.xl },
  center: { flex: 1, justifyContent: 'center' },
});
