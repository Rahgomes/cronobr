import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import type { Session } from '@/domain/engine';
import { PRESETS } from '@/domain/presets';
import type { Routine } from '@/domain/routine';
import { BrandMark } from '@/ui/brand-mark';
import { Button } from '@/ui/button';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { SectionTitle } from '@/ui/section-title';
import { Text } from '@/ui/text';
import { space } from '@/ui/tokens';

import { RoutineRow } from './routine-row';

interface HomeData {
  active: Session | null;
  mine: Routine[];
  historyCount: number;
}

function openRoutine(id: string) {
  router.push({ pathname: '/sessao', params: { rotina: id } });
}

/** Início provisória (E02): a Início desenhada (docs/telas/C01b) chega na E04. */
export function HomeScreen() {
  const repos = useRepos();
  const [data, setData] = useState<HomeData | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([repos.session.load(), repos.routines.list(), repos.history.count()]).then(
        ([session, mine, historyCount]) => {
          if (active) setData({ active: session, mine, historyCount });
        },
      );
      return () => {
        active = false;
      };
    }, [repos]),
  );

  return (
    <Screen
      footer={
        <Button
          label={
            data && data.historyCount > 0 ? `Histórico (${String(data.historyCount)})` : 'Histórico'
          }
          kind="secondary"
          onPress={() => {
            router.push('/historico');
          }}
        />
      }
    >
      <View style={styles.content}>
        <BrandMark height={44} />
        <Text variant="title" accessibilityRole="header">
          Escolha um treino
        </Text>
        {data?.active ? (
          <Notice
            tone="alert"
            action={{
              label: 'Continuar treino',
              onPress: () => {
                router.push('/sessao');
              },
            }}
          >
            {`Treino em andamento: ${data.active.routine.name}`}
          </Notice>
        ) : null}
        {data && data.mine.length > 0 ? (
          <View style={styles.list}>
            <SectionTitle>Suas rotinas</SectionTitle>
            {data.mine.map((routine) => (
              <RoutineRow
                key={routine.id}
                routine={routine}
                onPress={() => {
                  openRoutine(routine.id);
                }}
              />
            ))}
          </View>
        ) : null}
        <View style={styles.list}>
          <SectionTitle>Prontas para usar</SectionTitle>
          {PRESETS.map((routine) => (
            <RoutineRow
              key={routine.id}
              routine={routine}
              onPress={() => {
                openRoutine(routine.id);
              }}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg, paddingTop: space.xl },
  list: { gap: space.sm },
});
