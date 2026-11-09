import { StyleSheet, View } from 'react-native';

import type { Colors } from '@/ui/theme';
import { useThemedStyles } from '@/ui/theme-context';
import { space } from '@/ui/tokens';

const DOTS = 4;

/**
 * Pulso em quatro pontos pequenos, o da batida aceso. Não pisca a tela inteira: a 240 BPM seriam
 * 4 clarões por segundo, acima do limite de 3 da WCAG 2.3.1 (D103). Escondido do leitor de tela:
 * ele ouve o som, e anunciar cada batida taparia tudo.
 */
export function Pulse({ beat, small = false }: { beat: number; small?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const lit = beat < 0 ? -1 : beat % DOTS;
  return (
    <View
      style={[styles.dots, small && styles.dotsSmall]}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="pulso"
    >
      {Array.from({ length: DOTS }, (_, i) => (
        <View key={i} style={[styles.dot, small && styles.dotSmall, i === lit && styles.on]} />
      ))}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    dots: { flexDirection: 'row', gap: space.md },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      // Contorno de campo (3:1 no fundo): o ponto apagado ainda se vê nos dois temas.
      borderColor: colors.inputBorder,
      backgroundColor: colors.surface,
    },
    dotsSmall: { gap: space.sm },
    dotSmall: { width: 10, height: 10, borderRadius: 5 },
    on: { backgroundColor: colors.primary, borderColor: colors.primary },
  });
