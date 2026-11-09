import { Text as RNText, type TextProps } from 'react-native';

import { useColors } from './theme-context';
import { maxScale, type ColorRole, type TypeVariant, type as typeScale } from './tokens';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: ColorRole;
  /** Tempo e contagem: números com a mesma largura, sem a coluna "dançar" a cada segundo. */
  tabular?: boolean;
};

// Fonte do sistema por enquanto; a fonte da marca no texto do app é decisão da E06.
export function Text({ variant = 'body', color = 'text', tabular = false, style, ...rest }: Props) {
  const colors = useColors();
  return (
    <RNText
      maxFontSizeMultiplier={maxScale[variant]}
      style={[
        typeScale[variant],
        { color: colors[color] },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}
