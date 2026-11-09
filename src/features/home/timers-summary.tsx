import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { clock } from '@/domain/format';
import { remaining } from '@/domain/timers';
import { useTimers } from '@/features/timers/timers-context';
import { useT } from '@/i18n/i18n-context';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';
import type { Colors } from '@/ui/theme';
import { useColors, useThemedStyles } from '@/ui/theme-context';
import { radius, space } from '@/ui/tokens';

/** Visão compacta na Início: sem temporizador, a entrada; com, os ativos e quanto falta. */
export function TimersSummary() {
  const t = useT();
  const { timers, now } = useTimers();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const shown = timers.slice(0, 3);
  const line = shown
    .map((timer) =>
      timer.status === 'done'
        ? t.timers.finished([timer.name])
        : `${timer.name} ${clock(remaining(timer, now))}`,
    )
    .join(' · ');
  const detail = timers.length === 0 ? t.timers.hint : line;
  // "Ativo" é quem ainda conta (rodando ou pausado); o que terminou aparece na linha, não na conta.
  const active = timers.filter((timer) => timer.status !== 'done').length;
  const heading = active > 0 ? `${t.timers.title} · ${t.timers.active(active)}` : t.timers.title;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        timers.length === 0 ? t.timers.title : t.timers.summaryLabel(t.timers.active(active), line)
      }
      accessibilityHint={timers.length === 0 ? t.timers.hint : undefined}
      onPress={() => {
        router.push('/temporizadores');
      }}
      style={({ pressed }) => [styles.box, pressed && styles.pressed]}
    >
      <Icon name="timer-cog-outline" size={26} color={colors.primary} />
      <View style={styles.text}>
        <Text variant="label">{heading}</Text>
        <Text variant="caption" color="textMuted" tabular numberOfLines={2}>
          {detail}
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
