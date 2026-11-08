import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from './text';
import type { Colors } from './theme';
import { useColors, useThemedStyles } from './theme-context';
import { radius, space, touch } from './tokens';

type Props = { label: string; selected: boolean; onPress: () => void; disabled?: boolean };

/** Seleção em pílula; selecionado é ameixa cheio com texto branco (imagens T04, T05, T10). */
export function Chip({ label, selected, onPress, disabled = false }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      // No web: botão de alternar se anuncia por aria-pressed (aria-selected não vale em botão).
      aria-pressed={selected}
      disabled={disabled}
      onPress={onPress}
      style={[styles.base, selected && styles.selected]}
    >
      {selected ? (
        <MaterialCommunityIcons name="check" size={space.lg} color={colors.onPrimary} />
      ) : null}
      <Text variant="label" color={selected ? 'onPrimary' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    base: {
      minHeight: touch.minTarget,
      paddingHorizontal: space.lg,
      paddingVertical: space.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    selected: { backgroundColor: colors.primary, borderColor: colors.primary, overflow: 'hidden' },
  });
