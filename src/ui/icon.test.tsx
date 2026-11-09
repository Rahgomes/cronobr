import { render, screen } from '@testing-library/react-native';

import { Icon } from './icon';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

it('reserva o tamanho antes da fonte do ícone chegar', async () => {
  await render(<Icon name="timer-outline" size={30} color="#000" />);
  // A caixa existe com 30 x 30 mesmo com o glifo vazio (fonte ainda carregando).
  expect(screen.toJSON()).toMatchObject({ props: { style: { width: 30, height: 30 } } });
});
