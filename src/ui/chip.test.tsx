import { fireEvent, render, screen } from '@testing-library/react-native';

import { Chip } from './chip';
// Ícones nativos dependem do registro de fontes, indisponível no Jest.
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
it('expõe seleção e bloqueia interação quando desabilitado', async () => {
  const change = jest.fn();
  const { rerender } = await render(<Chip label="Opção" selected={false} onPress={change} />);
  expect(screen.getByRole('button', { selected: false })).toBeEnabled();
  await fireEvent.press(screen.getByRole('button'));
  expect(change).toHaveBeenCalledTimes(1);
  await rerender(<Chip label="Opção" selected onPress={change} disabled />);
  expect(screen.getByRole('button')).toHaveProp('accessibilityState', {
    selected: true,
    disabled: true,
  });
  await fireEvent.press(screen.getByRole('button'));
  expect(change).toHaveBeenCalledTimes(1);
});
