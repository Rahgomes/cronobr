// expo-router nos testes de tela: navegação vira jest.fn e o foco roda como efeito de montagem.
import { useEffect } from 'react';

export const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
export const SplashScreen = {
  hideAsync: jest.fn(() => Promise.resolve()),
  preventAutoHideAsync: jest.fn(),
};
export const usePreventRemove = jest.fn<undefined, [boolean, () => void]>();
/** @public Usado pelas telas através do jest.mock('expo-router'). */
export function useFocusEffect(effect: () => undefined | (() => void)) {
  useEffect(effect, [effect]);
}
