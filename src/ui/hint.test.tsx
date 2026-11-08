import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './button';
import { HINT_MS, HintProvider, useHint } from './hint';
import { Switch } from './switch';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

const REASON = 'Cadastre um pacote antes de vender.';

function Trigger({ onAction }: { onAction: () => void }) {
  const hint = useHint();
  return (
    <Button
      label="Mostrar"
      onPress={() => {
        hint({
          message: 'Disponível no plano Essencial',
          action: { label: 'Ver planos', onPress: onAction },
        });
      }}
    />
  );
}

describe('aviso rápido', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('aparece, some sozinho e o toque fecha antes', async () => {
    await render(
      <HintProvider>
        <Trigger onAction={() => undefined} />
      </HintProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar' }));
    expect(screen.getByText('Disponível no plano Essencial')).toBeOnTheScreen();
    await act(() => {
      jest.advanceTimersByTime(HINT_MS);
    });
    expect(screen.queryByText('Disponível no plano Essencial')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Disponível no plano Essencial' }));
    expect(screen.queryByText('Disponível no plano Essencial')).toBeNull();
  });

  it('o X fecha o aviso', async () => {
    await render(
      <HintProvider>
        <Trigger onAction={() => undefined} />
      </HintProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar aviso' }));
    expect(screen.queryByText('Disponível no plano Essencial')).toBeNull();
  });

  it('a ação fecha o aviso e roda', async () => {
    const onAction = jest.fn();
    await render(
      <HintProvider>
        <Trigger onAction={onAction} />
      </HintProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Ver planos' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Disponível no plano Essencial')).toBeNull();
  });
});

describe('controle desligado com motivo', () => {
  it('botão: não roda a ação, explica o porquê', async () => {
    const onPress = jest.fn();
    await render(
      <HintProvider>
        <Button label="Vender pacote" disabled disabledHint={REASON} onPress={onPress} />
      </HintProvider>,
    );
    const button = screen.getByRole('button', { name: 'Vender pacote' });
    // O toque continua chegando para explicar; o leitor de tela ouve o motivo como dica.
    expect(button).toHaveProp('accessibilityHint', REASON);
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByText(REASON)).toBeOnTheScreen();
  });

  it('botão sem motivo continua desligado como antes', async () => {
    const onPress = jest.fn();
    await render(
      <HintProvider>
        <Button label="Salvar" disabled onPress={onPress} />
      </HintProvider>,
    );
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it('interruptor explica o porquê e não muda', async () => {
    const onChange = jest.fn();
    await render(
      <HintProvider>
        <Switch
          accessibilityLabel="Avisar"
          value={false}
          onValueChange={onChange}
          disabled
          disabledHint="Motivo do interruptor"
        />
      </HintProvider>,
    );
    await fireEvent.press(screen.getByRole('switch', { name: 'Avisar' }));
    expect(screen.getByText('Motivo do interruptor')).toBeOnTheScreen();
    expect(onChange).not.toHaveBeenCalled();
  });
});
