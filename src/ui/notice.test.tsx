import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { LayoutAnimation } from 'react-native';

import { Notice } from './notice';
import { SectionTitle } from './section-title';
import { colors } from './tokens';
import { reduceMotionNow } from './use-reduce-motion';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('./use-reduce-motion', () => ({ reduceMotionNow: jest.fn(() => true) }));

it.each([
  ['alert', colors.warning],
  ['soft', colors.textMuted],
  ['positive', colors.success],
  ['danger', colors.danger],
  ['gold', colors.goldInk],
] as const)('tom %s pinta o texto na cor do tom', async (tone, color) => {
  await render(<Notice tone={tone}>Aviso</Notice>);
  expect(screen.getByText('Aviso')).toHaveStyle({ color });
});

it('texto com valor no meio fica num Text só', async () => {
  const value = 'R$ 30,00';
  await render(<Notice tone="alert">O recebimento de {value} foi preservado.</Notice>);
  expect(screen.getByText('O recebimento de R$ 30,00 foi preservado.')).toBeOnTheScreen();
});

it('com ação vira botão com o rótulo dado', async () => {
  const onPress = jest.fn();
  await render(
    <Notice tone="alert" action={{ label: 'Ver clientes para chamar de volta', onPress }}>
      3 clientes passaram do ciclo
    </Notice>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Ver clientes para chamar de volta' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('recolhível mostra só o título até tocar', async () => {
  await render(
    <Notice tone="soft" title="Como funciona" collapsible>
      Explicação longa
    </Notice>,
  );
  expect(screen.queryByText('Explicação longa')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Como funciona' }));
  expect(screen.getByText('Explicação longa')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Como funciona' })).toHaveProp('accessibilityState', {
    expanded: true,
  });
});

it('recolhível desliza ao abrir, menos com "reduzir animações"', async () => {
  const slide = jest.spyOn(LayoutAnimation, 'configureNext');
  await render(
    <Notice tone="soft" title="Como funciona" collapsible>
      Explicação longa
    </Notice>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Como funciona' }));
  expect(slide).not.toHaveBeenCalled();
  jest.mocked(reduceMotionNow).mockReturnValue(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Como funciona' }));
  expect(slide).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Explicação longa')).toBeNull();
});

it('selo positivo e título de seção do kit', async () => {
  await render(
    <>
      <Notice inline tone="positive">
        Salvo
      </Notice>
      <SectionTitle>Favoritas</SectionTitle>
    </>,
  );
  expect(screen.getByText('Salvo')).toHaveStyle({ color: colors.success });
  expect(screen.getByRole('header', { name: 'Favoritas' })).toBeOnTheScreen();
});

it('recolhível: o conteúdo aberto fica fora do botão e o leitor de tela lê', async () => {
  await render(
    <Notice tone="soft" title="Como funciona" collapsible>
      Resposta completa
    </Notice>,
  );
  const header = screen.getByRole('button', { name: 'Como funciona' });
  expect(header).not.toBeExpanded();
  expect(screen.queryByText('Resposta completa')).toBeNull();
  await fireEvent.press(header);
  expect(header).toBeExpanded();
  const answer = screen.getByText('Resposta completa');
  expect(within(header).queryByText('Resposta completa')).toBeNull();
  expect(answer).toBeOnTheScreen();
});
