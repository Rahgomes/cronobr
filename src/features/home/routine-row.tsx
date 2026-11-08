import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { clock } from '@/domain/format';
import type { Routine } from '@/domain/routine';
import { buildTimeline, summarize } from '@/domain/timeline';
import { Text } from '@/ui/text';
import type { Colors } from '@/ui/theme';
import { useColors, useThemedStyles } from '@/ui/theme-context';
import { radius, space, touch } from '@/ui/tokens';

/** Linha de rotina: o toque abre a sessão. A duração é a mesma linha do tempo da execução. */
export function RoutineRow({ routine, onPress }: { routine: Routine; onPress: () => void }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const summary = summarize(buildTimeline(routine));
  const detail = `${clock(summary.knownMs)} · ${String(summary.workCount)} exercícios`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${routine.name}, ${detail}`}
      accessibilityHint="Abre o treino"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text variant="label">{routine.name}</Text>
        <Text color="textMuted" tabular>
          {detail}
        </Text>
      </View>
      <MaterialCommunityIcons name="play-circle" size={space.xxl} color={colors.primary} />
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    row: {
      minHeight: touch.button,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      padding: space.lg,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { backgroundColor: colors.accentSoft },
    text: { flex: 1, gap: space.xs },
  });
