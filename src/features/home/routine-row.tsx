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
export function RoutineRow({
  routine,
  onPress,
  onMore,
  favorite = false,
}: {
  routine: Routine;
  onPress: () => void;
  /** Abre as ações da rotina (favoritar, editar, apagar...). */
  onMore?: (() => void) | undefined;
  favorite?: boolean;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const summary = summarize(buildTimeline(routine));
  const detail = `${clock(summary.knownMs)} · ${String(summary.workCount)} exercícios`;
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${routine.name}, ${detail}${favorite ? ', favorita' : ''}`}
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
        {favorite ? (
          <MaterialCommunityIcons name="star" size={space.lg} color={colors.primary} />
        ) : null}
        <MaterialCommunityIcons name="play-circle" size={space.xxl} color={colors.primary} />
      </Pressable>
      {onMore ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Opções de ${routine.name}`}
          onPress={onMore}
          hitSlop={4}
          style={({ pressed }) => [styles.more, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="dots-vertical" size={space.xl} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    more: {
      width: touch.minTarget,
      height: touch.button,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
    },
    row: {
      flex: 1,
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
