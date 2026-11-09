import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n/i18n-context';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';
import type { Colors } from '@/ui/theme';
import { useColors, useThemedStyles } from '@/ui/theme-context';
import { radius, space } from '@/ui/tokens';

/** Entrada do metrônomo na Início, no mesmo formato do resumo dos temporizadores. */
export function MetronomeLink() {
  const t = useT();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.metronome.title}
      accessibilityHint={t.metronome.hint}
      onPress={() => {
        router.push('/metronomo');
      }}
      style={({ pressed }) => [styles.box, pressed && styles.pressed]}
    >
      <Icon name="metronome" size={26} color={colors.primary} />
      <View style={styles.text}>
        <Text variant="label">{t.metronome.title}</Text>
        <Text variant="caption" color="textMuted" numberOfLines={2}>
          {t.metronome.hint}
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color={colors.textMuted} />
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      minHeight: 56,
      paddingVertical: space.sm,
      paddingHorizontal: space.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    pressed: { opacity: 0.8 },
    text: { flex: 1, gap: 2 },
  });
