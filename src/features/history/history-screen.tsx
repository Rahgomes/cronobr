import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import type { HistoryPage } from '@/data/repos';
import {
  countByDay,
  dayKey,
  monthOf,
  monthRange,
  sameMonth,
  shiftMonth,
  type CalendarDay,
  type Month,
} from '@/domain/calendar';
import { duration } from '@/domain/format';
import type { HistoryEntry } from '@/domain/history';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ListScreen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { radius, space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { dayTitle, HistoryCalendar } from './history-calendar';

export const DATE = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function statusLine(entry: HistoryEntry): string {
  const done = entry.status === 'completed';
  return `${done ? 'Concluído' : 'Encerrado antes do fim'} · ${duration(entry.activeMs)} · ${String(entry.workDone)}/${String(entry.workTotal)} exercícios`;
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const done = entry.status === 'completed';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.routine.name}, ${DATE.format(entry.endedAt)}, ${statusLine(entry)}${entry.note ? ', com nota' : ''}`}
      accessibilityHint="Abre o treino: nota e repetir"
      onPress={() => {
        router.push({ pathname: '/historico/[id]', params: { id: entry.id } });
      }}
      style={({ pressed }) => [styles.rowPress, pressed && styles.pressed]}
    >
      <Card>
        <Text variant="label">{entry.routine.name}</Text>
        <Text color="textMuted">{DATE.format(entry.endedAt)}</Text>
        <Text color={done ? 'success' : 'warning'}>{statusLine(entry)}</Text>
        {entry.note ? (
          <Text color="textMuted" numberOfLines={2}>
            Nota: {entry.note}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

interface DayFilter {
  day: CalendarDay;
  entries: HistoryEntry[];
}

/**
 * Histórico sem limite: carrega por página, do mais recente ao mais antigo. O calendário marca os
 * dias com treino; tocar num dia mostra só os treinos dele.
 */
export function HistoryScreen() {
  const repos = useRepos();
  const [now] = useState(() => Date.now());
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [next, setNext] = useState<HistoryPage['next']>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [month, setMonth] = useState<Month>(() => monthOf(now));
  const [counts, setCounts] = useState<ReadonlyMap<string, number>>(new Map());
  const [filter, setFilter] = useState<DayFilter | null>(null);

  // Ao voltar do detalhe (nota escrita, registro apagado), relê o que está na tela.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const range = monthRange(month);
      void Promise.all([
        repos.history.page(),
        repos.history.count(),
        repos.history.endedBetween(range.from, range.to),
        filter ? repos.history.between(filter.day.from, filter.day.to) : null,
      ]).then(([page, count, ended, dayEntries]) => {
        if (!active) return;
        setEntries(page.entries);
        setNext(page.next);
        setTotal(count);
        setCounts(countByDay(ended));
        if (filter && dayEntries) {
          setFilter(dayEntries.length > 0 ? { day: filter.day, entries: dayEntries } : null);
        }
      });
      return () => {
        active = false;
      };
      // O filtro é relido pelo dia, não pela lista: depende só do dia escolhido.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repos, month, filter?.day.key]),
  );

  async function loadMore(before: NonNullable<HistoryPage['next']>) {
    const page = await repos.history.page({ before });
    setEntries((current) => [...current, ...page.entries]);
    setNext(page.next);
  }

  async function selectDay(day: CalendarDay) {
    if (filter?.day.key === day.key) {
      setFilter(null);
      return;
    }
    setFilter({ day, entries: await repos.history.between(day.from, day.to) });
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
            <>
              <Text color="textMuted">
                {total === 1 ? '1 treino registrado' : `${String(total)} treinos registrados`}
              </Text>
              <Card>
                <HistoryCalendar
                  month={month}
                  counts={counts}
                  selected={filter?.day.key ?? null}
                  todayKey={dayKey(now)}
                  canGoNext={!sameMonth(month, monthOf(now))}
                  onMonth={(delta) => {
                    setFilter(null);
                    setMonth((current) => shiftMonth(current, delta));
                  }}
                  onSelect={(day) => {
                    void selectDay(day);
                  }}
                />
              </Card>
            </>
          ) : null}
          {filter ? (
            <View style={styles.filter}>
              <Text variant="label" accessibilityRole="header" style={styles.grow}>
                Treinos de {dayTitle(filter.day)}
              </Text>
              <Button
                label="Ver todos"
                kind="text"
                onPress={() => {
                  setFilter(null);
                }}
              />
            </View>
          ) : null}
        </View>
      }
      data={filter ? filter.entries : entries}
      keyExtractor={(entry) => entry.id}
      renderItem={({ item }) => <HistoryRow entry={item} />}
      after={
        next && !filter ? (
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
  filter: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1 },
  rowPress: { borderRadius: radius.lg },
  pressed: { opacity: 0.85 },
});
