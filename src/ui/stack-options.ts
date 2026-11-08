import { useReducedMotion } from 'react-native-reanimated';

/**
 * Transição padrão das pilhas: tela nova entra pela direita (detalhe, formulário); troca de
 * área (entrar, onboarding, app) faz fade. Com "remover animações" ligado no aparelho, nenhuma.
 */
export function useStackOptions(kind: 'push' | 'area' = 'push') {
  const reduced = useReducedMotion();
  return {
    headerShown: false,
    animation: reduced
      ? ('none' as const)
      : kind === 'area'
        ? ('fade' as const)
        : ('slide_from_right' as const),
    animationDuration: 250,
  };
}
