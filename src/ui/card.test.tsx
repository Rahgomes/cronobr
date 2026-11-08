import { render, screen } from '@testing-library/react-native';

import { Card } from './card';
import { Text } from './text';
import { colors, space } from './tokens';
it('agrupa conteúdo com a superfície e espaçamento do kit', async () => {
  await render(
    <Card accessible accessibilityLabel="Confirmação">
      <Text>Enviado</Text>
    </Card>,
  );
  expect(screen.getByLabelText('Confirmação')).toHaveStyle({
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: space.lg,
    gap: space.sm,
    borderColor: colors.border,
    elevation: 3,
  });
  expect(screen.getByText('Enviado')).toBeOnTheScreen();
});

it('flat tira a sombra (cartão dentro de cartão ou de sheet)', async () => {
  await render(<Card flat accessible accessibilityLabel="Dentro" />);
  expect(screen.getByLabelText('Dentro')).toHaveStyle({ elevation: 0, shadowOpacity: 0 });
});
