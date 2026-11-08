// Calendário simples do histórico (E04 lote E): o mês em grade, dia com treino marcado e tocável.
import { Pressable, StyleSheet, View } from 'react-native';

import { monthGrid, type CalendarDay, type Month } from '@/domain/calendar';
import { Text } from '@/ui/text';
import type { Colors } from '@/ui/theme';
import { useThemedStyles } from '@/ui/theme-context';
import { radius, space, touch } from '@/ui/tokens';
import { RoundAction } from '@/ui/top-bar';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const MONTH = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const DAY = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

function monthTitle({ year, month }: Month): string {
  const text = MONTH.format(new Date(year, month, 1));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "7 de novembro". */
export function dayTitle(day: CalendarDay): string {
  return DAY.format(day.from);
}

const trainings = (n: number) => (n === 1 ? '1 treino' : `${String(n)} treinos`);

export function HistoryCalendar({
  month,
  counts,
  selected,
  todayKey,
  canGoNext,
  onMonth,
  onSelect,
}: {
  month: Month;
  counts: ReadonlyMap<string, number>;
  selected: string | null;
  todayKey: string;
  /** O mês que vem ainda não tem treino: não há para onde ir depois do mês atual. */
  canGoNext: boolean;
  onMonth: (delta: -1 | 1) => void;
  onSelect: (day: CalendarDay) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const daysTrained = counts.size;
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <RoundAction
          icon="chevron-left"
          label="Mês anterior"
          onPress={() => {
            onMonth(-1);
          }}
        />
        <Text variant="label" style={styles.title} accessibilityRole="header">
          {monthTitle(month)}
        </Text>
        {canGoNext ? (
          <RoundAction
            icon="chevron-right"
            label="Próximo mês"
            onPress={() => {
              onMonth(1);
            }}
          />
        ) : (
          <View style={styles.navSpace} />
        )}
      </View>
      <View
        style={styles.week}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {WEEKDAYS.map((letter, i) => (
          <Text key={i} variant="caption" color="textMuted" style={styles.weekday}>
            {letter}
          </Text>
        ))}
      </View>
      {monthGrid(month).map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((day, i) => {
            if (!day) return <View key={i} style={styles.cell} />;
            const count = counts.get(day.key) ?? 0;
            const today = day.key === todayKey;
            if (count === 0) {
              return (
                <View
                  key={i}
                  style={[styles.cell, today && styles.today]}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <Text color="textMuted" tabular style={styles.cellText}>
                    {String(day.day)}
                  </Text>
                </View>
              );
            }
            const isSelected = selected === day.key;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`${dayTitle(day)}${today ? ', hoje' : ''}, ${trainings(count)}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onSelect(day);
                }}
                style={[
                  styles.cell,
                  styles.trained,
                  today && styles.today,
                  isSelected && styles.selected,
                ]}
              >
                <Text
                  variant="label"
                  tabular
                  color={isSelected ? 'onPrimary' : 'text'}
                  style={styles.cellText}
                >
                  {String(day.day)}
                </Text>
                <View style={[styles.dot, isSelected && styles.dotSelected]} />
              </Pressable>
            );
          })}
        </View>
      ))}
      <Text color="textMuted">
        {daysTrained === 0
          ? 'Nenhum treino neste mês.'
          : `Treinou em ${daysTrained === 1 ? '1 dia' : `${String(daysTrained)} dias`} neste mês. Toque num dia marcado para ver os treinos.`}
      </Text>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    wrap: { gap: space.xs },
    head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    title: { flex: 1, textAlign: 'center' },
    navSpace: { width: touch.minTarget - 4, height: touch.minTarget - 4 },
    week: { flexDirection: 'row', gap: 2 },
    cell: {
      flex: 1,
      minHeight: touch.minTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    cellText: { textAlign: 'center' },
    weekday: { flex: 1, textAlign: 'center' },
    trained: { backgroundColor: colors.accentSoft },
    today: { borderWidth: 2, borderColor: colors.primary },
    selected: { backgroundColor: colors.primary },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 1 },
    dotSelected: { backgroundColor: colors.onPrimary },
  });
