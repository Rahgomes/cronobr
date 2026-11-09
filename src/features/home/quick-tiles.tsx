import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n/i18n-context';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';
import type { Colors } from '@/ui/theme';
import { useColors, useThemedStyles } from '@/ui/theme-context';
import { radius, space } from '@/ui/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** As três entradas da Início (C01b): resolvem a maior parte dos treinos em dois toques. */
export function QuickTiles() {
  const t = useT();
  const tiles: { label: string; hint: string; icon: IconName; href: Href }[] = [
    {
      label: t.home.stopwatch,
      hint: t.home.stopwatchHint,
      icon: 'timer-outline',
      href: '/cronometro',
    },
    { label: t.home.timer, hint: t.home.timerHint, icon: 'timer-sand', href: '/temporizador' },
    {
      label: t.home.interval,
      hint: t.home.intervalHint,
      icon: 'sync',
      href: '/intervalado',
    },
  ];
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  return (
    <View style={styles.row}>
      {tiles.map((tile) => (
        <Pressable
          key={tile.label}
          accessibilityRole="button"
          accessibilityLabel={tile.label}
          accessibilityHint={tile.hint}
          onPress={() => {
            router.push(tile.href);
          }}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <Icon name={tile.icon} size={30} color={colors.primary} />
          <Text variant="label" style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
            {tile.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: space.sm },
    tile: {
      flex: 1,
      alignItems: 'center',
      gap: space.xs,
      paddingVertical: space.md,
      paddingHorizontal: space.xs,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    pressed: { opacity: 0.8 },
    label: { fontSize: 14 },
  });
