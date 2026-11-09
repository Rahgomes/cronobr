import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

type Props = ComponentProps<typeof MaterialCommunityIcons> & { size: number };

/**
 * Ícone com o espaço já reservado (E06 E). A fonte dos ícones chega depois da primeira pintura:
 * sem a caixa fixa, o ícone nascia com altura zero e, ao carregar, empurrava a tela 28 px para
 * baixo; um toque nesse instante caía no vazio (achado no E2E do rascunho do editor).
 */
export function Icon({ size, ...rest }: Props) {
  return (
    <View style={{ width: size, height: size }} importantForAccessibility="no-hide-descendants">
      <MaterialCommunityIcons size={size} {...rest} />
    </View>
  );
}
