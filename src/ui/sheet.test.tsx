import { fireEvent, render, screen } from '@testing-library/react-native';

import { Sheet } from './sheet';
import { Text } from './text';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
it('expõe título e fecha pelo X e pelo voltar nativo', async () => {
  const close = jest.fn();
  await render(
    <Sheet title="Editar horário" visible onClose={close}>
      <Text>Conteúdo</Text>
    </Sheet>,
  );
  expect(screen.getByRole('header', { name: 'Editar horário' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
  expect(close).toHaveBeenCalledTimes(1);
  // O evento do botão físico pertence à fronteira nativa do Modal.
  await fireEvent(screen.getByRole('header', { name: 'Editar horário' }), 'requestClose');
  expect(close).toHaveBeenCalledTimes(2);
});
