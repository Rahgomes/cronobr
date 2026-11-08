import { StyleSheet } from 'react-native';

import { Text } from './text';
import { space } from './tokens';

/** Título de seção do visual v2 (o "PRÓXIMOS" da Hoje): caixa alta espaçada, na cor da marca. */
export function SectionTitle({ children }: { children: string }) {
  return (
    <Text variant="label" color="primary" accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginTop: space.xs,
    marginBottom: -space.xs,
  },
});
