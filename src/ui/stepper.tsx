import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import type { Colors } from './theme';
import { useColors, useThemedStyles } from './theme-context';
import { radius, space, touch } from './tokens';

/**
 * Valor com − e +, sem teclado nem seletor nativo (D08). Cada botão tem nome próprio
 * ("Aumentar Exercício"), e o valor é anunciado quando muda. Segurar não repete: um toque,
 * um passo, previsível com luva e mão suada.
 */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  format = String,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const button = (dir: -1 | 1) => {
    const next = Math.min(max, Math.max(min, value + dir * step));
    const disabled = next === value;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${dir < 0 ? 'Diminuir' : 'Aumentar'} ${label}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        hitSlop={4}
        onPress={() => {
          onChange(next);
        }}
        style={({ pressed }) => [styles.button, disabled && styles.off, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons
          name={dir < 0 ? 'minus' : 'plus'}
          size={22}
          color={disabled ? colors.textMuted : colors.primary}
        />
      </Pressable>
    );
  };
  return (
    <View style={styles.row}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      {button(-1)}
      <Text
        variant="title"
        tabular
        style={styles.value}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${label}: ${format(value)}`}
      >
        {format(value)}
      </Text>
      {button(1)}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: touch.minTarget },
    label: { flex: 1 },
    value: { minWidth: 76, textAlign: 'center' },
    button: {
      width: touch.minTarget,
      height: touch.minTarget,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    off: { borderColor: colors.border },
    pressed: { opacity: 0.7 },
  });
