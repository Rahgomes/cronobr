import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { RoundAction, TopBar } from './top-bar';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

it('mostra o título e volta pela pilha de navegação', async () => {
  await render(<TopBar title="Entrar com e-mail" />);
  expect(screen.getByText('Entrar com e-mail')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
  expect(router.back).toHaveBeenCalledTimes(1);
});

it('ação redonda à direita do título', async () => {
  const onPress = jest.fn();
  await render(
    <TopBar
      title="Financeiro"
      right={<RoundAction icon="eye" label="Ocultar valores" onPress={onPress} />}
    />,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Ocultar valores' }));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('header', { name: 'Financeiro' })).toBeOnTheScreen();
});
