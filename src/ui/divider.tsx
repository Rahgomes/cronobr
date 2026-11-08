import { StyleSheet, View } from 'react-native';

import { Text } from './text';
import type { Colors } from './theme';
import { useThemedStyles } from './theme-context';
import { space } from './tokens';

/** Linha divisória; com `label`, o texto fica no meio ("ou" entre duas formas de entrar). */
export function Divider({ label }: { label?: string }) {
  const styles = useThemedStyles(makeStyles);
  if (!label) return <View style={styles.line} />;
  return (
    <View style={styles.row}>
      <View style={[styles.line, styles.grow]} />
      <Text color="textMuted" variant="caption">
        {label}
      </Text>
      <View style={[styles.line, styles.grow]} />
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    line: { height: 1, backgroundColor: colors.border },
    grow: { flex: 1 },
  });
