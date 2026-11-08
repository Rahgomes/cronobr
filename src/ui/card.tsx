import { StyleSheet, View, type ViewProps } from 'react-native';

import type { Colors } from './theme';
import { useThemedStyles } from './theme-context';
import { elevation, space } from './tokens';

/**
 * Cartão do visual v2 (PRD 23 F0.8): cantos de 20, contorno fino e sombra difusa na cor da marca.
 * `flat` tira a sombra: cartão dentro de outro cartão ou de sheet não empilha sombra.
 */
export function Card({ style, flat = false, ...props }: ViewProps & { flat?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  return <View {...props} style={[styles.card, flat && styles.flat, style]} />;
}
const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    // gap padrão: título, texto e botão dentro do cartão nunca ficam colados (quem quer outro,
    // passa o próprio gap no style). No escuro a sombra não aparece, e quem separa é o contorno.
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: space.lg,
      gap: space.sm,
      borderWidth: 1,
      borderColor: colors.border,
      ...elevation.raised,
      shadowColor: colors.primary,
    },
    flat: { elevation: 0, shadowOpacity: 0 },
  });
