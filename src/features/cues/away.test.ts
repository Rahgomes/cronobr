import { AppState } from 'react-native';

import { isAway } from './away';

it('só "background" conta como fora da tela', () => {
  const states = ['active', 'inactive', 'background'] as const;
  const seen = states.map((state) => {
    Object.defineProperty(AppState, 'currentState', { value: state, configurable: true });
    return isAway();
  });
  expect(seen).toEqual([false, false, true]);
});
