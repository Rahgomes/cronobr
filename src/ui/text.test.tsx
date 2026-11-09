import { render, screen } from '@testing-library/react-native';

import { Card } from './card';
import { Text } from './text';
import { themeColors } from './theme';
import { ThemeProvider } from './theme-context';

it('aplica a escala e a cor do papel pedido', async () => {
  await render(
    <ThemeProvider mode="light">
      <Text variant="title" color="textMuted">
        Título
      </Text>
    </ThemeProvider>,
  );
  expect(screen.getByText('Título')).toHaveStyle({
    fontSize: 24,
    color: themeColors('light').textMuted,
  });
});

it('tabular deixa os números com a mesma largura', async () => {
  await render(<Text tabular>0:27</Text>);
  expect(screen.getByText('0:27')).toHaveStyle({ fontVariant: ['tabular-nums'] });
});

it('sem tabular não força a variante numérica', async () => {
  await render(<Text>Rodada</Text>);
  expect(screen.getByText('Rodada')).not.toHaveStyle({ fontVariant: ['tabular-nums'] });
});

it('cartão ganha raio e sombra difusa', async () => {
  await render(<Card accessible accessibilityLabel="Resumo" />);
  expect(screen.getByLabelText('Resumo')).toHaveStyle({ borderRadius: 20, elevation: 3 });
});

it.each([
  ['display', 1.4],
  ['title', 1.6],
  ['body', 2],
  ['caption', 2],
] as const)('letra ampliada do sistema: %s cresce até %sx', async (variant, max) => {
  await render(<Text variant={variant}>Texto</Text>);
  expect(screen.getByText('Texto').props).toMatchObject({ maxFontSizeMultiplier: max });
});

it('quem chama pode travar a escala (número grande da sessão)', async () => {
  await render(<Text maxFontSizeMultiplier={1}>0:45</Text>);
  expect(screen.getByText('0:45').props).toMatchObject({ maxFontSizeMultiplier: 1 });
});
