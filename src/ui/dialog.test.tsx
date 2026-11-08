import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { dialog, DialogHost } from './dialog';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.restoreAllMocks();
});

it('mostra no sheet do app, confirma e fecha', async () => {
  const apply = jest.fn();
  await render(<DialogHost />);
  await act(() => {
    dialog.alert('Remover foto?', 'Você pode adicionar outra depois.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: apply },
    ]);
  });
  expect(screen.getByRole('header', { name: 'Remover foto?' })).toBeOnTheScreen();
  expect(screen.getByText('Você pode adicionar outra depois.')).toBeOnTheScreen();
  // A ação vem primeiro; o cancelar fica embaixo.
  const labels = screen.getAllByRole('button').map((b) => b.props.accessibilityLabel as string);
  expect(labels).toEqual(['Remover', 'Cancelar']);
  await fireEvent.press(screen.getByRole('button', { name: 'Remover' }));
  expect(apply).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Remover foto?')).toBeNull();
});

it('cancelar não faz nada; aviso sem botões ganha "Entendi"', async () => {
  const apply = jest.fn();
  await render(<DialogHost />);
  await act(() => {
    dialog.alert('Tirar?', undefined, [
      { text: 'Manter', style: 'cancel' },
      { text: 'Tirar', onPress: apply },
    ]);
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Manter' }));
  expect(apply).not.toHaveBeenCalled();
  await act(() => {
    dialog.alert('Contatos importados', '3 contatos.');
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Entendi' }));
  expect(screen.queryByText('Contatos importados')).toBeNull();
});

it('o host mais novo (o de dentro de um sheet) é quem mostra; sem host, o do sistema', async () => {
  const system = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  dialog.alert('Sem host');
  expect(system).toHaveBeenCalledWith('Sem host', undefined, [{ text: 'Entendi' }]);
  const view = await render(
    <>
      <DialogHost />
      <DialogHost />
    </>,
  );
  await act(() => {
    dialog.alert('Uma vez só');
  });
  expect(screen.getAllByText('Uma vez só')).toHaveLength(1);
  await view.unmount();
});
