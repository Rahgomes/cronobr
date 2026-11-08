import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import { createSession, restore, type Session } from '@/domain/engine';
import { presetById } from '@/domain/presets';
import { buildTimeline } from '@/domain/timeline';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { useColors } from '@/ui/theme-context';
import { space } from '@/ui/tokens';

import { newSessionId, systemClock, type Clock } from './clock';
import { SessionView } from './session-view';

type Load =
  { status: 'loading' } | { status: 'ready'; session: Session } | { status: 'missing' | 'failed' };

/**
 * Entrada da sessão. Sessão em andamento sempre tem prioridade: abrir outra rotina não pode
 * sobrescrever um treino que ainda está rodando (ele é retomado de onde está de verdade).
 */
export function SessionScreen({
  routineId,
  clockSource = systemClock,
}: {
  routineId: string | undefined;
  clockSource?: Clock;
}) {
  const repos = useRepos();
  const colors = useColors();
  const [load, setLoad] = useState<Load>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const resolve = async (): Promise<Load> => {
      const saved = await repos.session.load();
      if (saved) {
        const now = clockSource.now();
        return { status: 'ready', session: restore(saved, buildTimeline(saved.routine), now) };
      }
      const routine = routineId
        ? (presetById(routineId) ?? (await repos.routines.get(routineId)))
        : null;
      return routine
        ? { status: 'ready', session: createSession(newSessionId(), routine) }
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
  }, [repos, routineId, clockSource]);

  if (load.status === 'ready')
    return <SessionView initial={load.session} clockSource={clockSource} />;
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
