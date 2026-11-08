import { StyleSheet, TextInput, View } from 'react-native';

import { Text } from './text';
import type { Colors } from './theme';
import { useColors, useThemedStyles } from './theme-context';
import { radius, space, touch } from './tokens';

/** Campo de texto com rótulo visível (o placeholder não substitui o rótulo). */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={maxLength}
        style={styles.input}
      />
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    wrap: { gap: space.xs },
    input: {
      minHeight: touch.minTarget,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: space.md,
      color: colors.text,
      backgroundColor: colors.surface,
      fontSize: 16,
    },
  });
