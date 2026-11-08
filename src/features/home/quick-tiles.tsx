import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/ui/text';
import type { Colors } from '@/ui/theme';
import { useColors, useThemedStyles } from '@/ui/theme-context';
import { radius, space } from '@/ui/tokens';

type Icon = ComponentProps<typeof MaterialCommunityIcons>['name'];

const TILES: { label: string; hint: string; icon: Icon; href: Href }[] = [
  {
    label: 'Cronômetro',
    hint: 'Conta para cima, com voltas',
    icon: 'timer-outline',
    href: '/cronometro',
  },
  { label: 'Temporizador', hint: 'Um tempo só', icon: 'timer-sand', href: '/temporizador' },
  {
    label: 'Intervalado',
    hint: 'Exercício e descanso em rodadas',
    icon: 'sync',
    href: '/intervalado',
  },
];

/** As três entradas da Início (C01b): resolvem a maior parte dos treinos em dois toques. */
export function QuickTiles() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  return (
    <View style={styles.row}>
      {TILES.map((tile) => (
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
          <MaterialCommunityIcons name={tile.icon} size={30} color={colors.primary} />
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
