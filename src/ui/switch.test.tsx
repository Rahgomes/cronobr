import { fireEvent, render, screen } from '@testing-library/react-native';

import { Switch } from './switch';

describe('Switch', () => {
  it('é lido como interruptor com estado e alterna ao tocar', async () => {
    const onValueChange = jest.fn();
    await render(
      <Switch value={false} onValueChange={onValueChange} accessibilityLabel="Segunda aberta" />,
    );
    const toggle = screen.getByRole('switch', { name: 'Segunda aberta' });
    expect(toggle).not.toBeChecked();
    await fireEvent.press(toggle);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('desativado não alterna', async () => {
    const onValueChange = jest.fn();
    await render(
      <Switch value onValueChange={onValueChange} accessibilityLabel="Domingo" disabled />,
    );
    await fireEvent.press(screen.getByRole('switch', { name: 'Domingo' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

it('área de toque de 48 mesmo com o trilho de 32 (vale na web, que não tem hitSlop)', async () => {
  await render(<Switch value onValueChange={jest.fn()} accessibilityLabel="Voz" />);
  expect(screen.getByRole('switch', { name: 'Voz' })).toHaveStyle({ minHeight: 48 });
});
