import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import type { Colors } from '@/ui/theme';
import { useThemedStyles } from '@/ui/theme-context';
import { radius, space, touch } from '@/ui/tokens';

/**
 * Última rotina (C01b): um toque repete. O cartão inteiro é o botão; o "Repetir" laranja é o
 * desenho do convite, não um segundo alvo. O histórico completo fica no link ao lado do título.
 */
export function LastRoutine({
  name,
  detail,
  accessibilityLabel,
  onRepeat,
  onHistory,
}: {
  name: string;
  detail: string;
  accessibilityLabel: string;
  onRepeat: () => void;
  onHistory: () => void;
}) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="caption" color="textMuted">
          {t.home.lastRoutine}
        </Text>
        <Button label={t.home.viewHistory} kind="text" onPress={onHistory} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onRepeat}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.text}>
          <Text variant="title" numberOfLines={2}>
            {name}
          </Text>
          <Text color="textMuted" tabular>
            {detail}
          </Text>
        </View>
        <View style={styles.pill}>
          <Text variant="label" color="onPrimary">
            {t.home.repeat}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    section: { gap: space.xs },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      padding: space.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { backgroundColor: colors.accentSoft },
    text: { flex: 1, gap: space.xs },
    pill: {
      minHeight: touch.minTarget,
      justifyContent: 'center',
      paddingHorizontal: space.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
  });
