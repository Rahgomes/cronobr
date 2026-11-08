import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import type { HistoryPage } from '@/data/repos';
import { duration } from '@/domain/format';
import type { HistoryEntry } from '@/domain/history';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ListScreen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

const DATE = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const done = entry.status === 'completed';
  return (
    <Card>
      <Text variant="label">{entry.routine.name}</Text>
      <Text color="textMuted">{DATE.format(entry.endedAt)}</Text>
      <Text color={done ? 'success' : 'warning'}>
        {done ? 'Concluído' : 'Encerrado antes do fim'} · {duration(entry.activeMs)} ·{' '}
        {String(entry.workDone)}/{String(entry.workTotal)} exercícios
      </Text>
    </Card>
  );
}

/** Histórico sem limite: carrega por página, do mais recente ao mais antigo. */
export function HistoryScreen() {
  const repos = useRepos();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [next, setNext] = useState<HistoryPage['next']>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([repos.history.page(), repos.history.count()]).then(([page, count]) => {
      if (!active) return;
      setEntries(page.entries);
      setNext(page.next);
      setTotal(count);
    });
    return () => {
      active = false;
    };
  }, [repos]);

  async function loadMore(before: NonNullable<HistoryPage['next']>) {
    const page = await repos.history.page({ before });
    setEntries((current) => [...current, ...page.entries]);
    setNext(page.next);
  }

  return (
    <ListScreen
      header={
        <View style={styles.header}>
          <TopBar title="Histórico" />
          {total === 0 ? (
            <Text color="textMuted">
              Nenhum treino ainda. O primeiro que você terminar aparece aqui.
            </Text>
          ) : null}
          {total !== null && total > 0 ? (
            <Text color="textMuted">
              {total === 1 ? '1 treino registrado' : `${String(total)} treinos registrados`}
            </Text>
          ) : null}
        </View>
      }
      data={entries}
      keyExtractor={(entry) => entry.id}
      renderItem={({ item }) => <HistoryRow entry={item} />}
      after={
        next ? (
          <Button
            label="Carregar mais"
            kind="secondary"
            onPress={() => {
              void loadMore(next);
            }}
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: space.lg, paddingTop: space.md },
});
