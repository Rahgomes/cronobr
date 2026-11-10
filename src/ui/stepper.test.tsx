import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { Stepper } from './stepper';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.useRealTimers();
});

/** Stepper com estado, como nas telas; `changes` guarda cada valor entregue. */
function Harness({
  start,
  kind,
  min,
  max,
  changes,
}: {
  start: number;
  kind: 'count' | 'duration';
  min: number;
  max: number;
  changes: number[];
}) {
  const [value, setValue] = useState(start);
  return (
    <Stepper
      label="Exercício"
      value={value}
      min={min}
      max={max}
      kind={kind}
      onChange={(next) => {
        changes.push(next);
        setValue(next);
      }}
    />
  );
}

async function open(start: number, kind: 'count' | 'duration' = 'count', min = 5, max = 600) {
  const changes: number[] = [];
  await render(<Harness start={start} kind={kind} min={min} max={max} changes={changes} />);
  return changes;
}

describe('Stepper', () => {
  it('duração: − e + andam 1 segundo e mostram minutos e segundos', async () => {
    const changes = await open(20, 'duration');
    expect(screen.getByRole('button', { name: 'Exercício: 0:20' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Aumentar Exercício' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Aumentar Exercício' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Diminuir Exercício' }));
    expect(changes).toEqual([21, 22, 21]);
    expect(screen.getByRole('button', { name: 'Exercício: 0:21' })).toBeOnTheScreen();
  });

  it('tocar no número abre minutos e segundos; confirmar grava o digitado', async () => {
    const changes = await open(20, 'duration');
    const value = screen.getByRole('button', { name: 'Exercício: 0:20' });
    expect(value).toHaveProp('accessibilityHint', 'Toque para digitar o valor');
    await fireEvent.press(value);
    // Durante a edição, − e + saem: um jeito de mudar por vez.
    expect(screen.queryByRole('button', { name: 'Aumentar Exercício' })).toBeNull();
    expect(screen.getByLabelText('Minutos de Exercício')).toHaveDisplayValue('0');
    expect(screen.getByLabelText('Segundos de Exercício')).toHaveDisplayValue('20');
    await fireEvent.changeText(screen.getByLabelText('Minutos de Exercício'), '2');
    await fireEvent.changeText(screen.getByLabelText('Segundos de Exercício'), '35');
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar Exercício' }));
    expect(changes).toEqual([155]);
    expect(screen.getByRole('button', { name: 'Exercício: 2:35' })).toBeOnTheScreen();
  });

  it('o "ok" do teclado nos segundos também confirma; segundos acima de 59 somam', async () => {
    const changes = await open(20, 'duration');
    await fireEvent.press(screen.getByRole('button', { name: 'Exercício: 0:20' }));
    await fireEvent.changeText(screen.getByLabelText('Segundos de Exercício'), '90');
    await fireEvent(screen.getByLabelText('Segundos de Exercício'), 'submitEditing');
    expect(changes).toEqual([90]);
    expect(screen.getByRole('button', { name: 'Exercício: 1:30' })).toBeOnTheScreen();
  });

  it('passou do limite: ajusta e explica', async () => {
    const changes = await open(20, 'duration', 5, 600);
    await fireEvent.press(screen.getByRole('button', { name: 'Exercício: 0:20' }));
    await fireEvent.changeText(screen.getByLabelText('Minutos de Exercício'), '99');
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar Exercício' }));
    expect(changes).toEqual([600]);
    expect(screen.getByText('Use entre 0:05 e 10:00. Ajustado para o limite.')).toBeOnTheScreen();
    // Abaixo do mínimo, e o aviso some no próximo toque.
    await fireEvent.press(screen.getByRole('button', { name: 'Exercício: 10:00' }));
    await fireEvent.changeText(screen.getByLabelText('Minutos de Exercício'), '');
    await fireEvent.changeText(screen.getByLabelText('Segundos de Exercício'), '1');
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar Exercício' }));
    expect(changes).toEqual([600, 5]);
    await fireEvent.press(screen.getByRole('button', { name: 'Aumentar Exercício' }));
    expect(screen.queryByText(/Ajustado para o limite/)).toBeNull();
  });

  it('contagem: um campo só; o que não é dígito sai', async () => {
    const changes = await open(8, 'count', 1, 99);
    await fireEvent.press(screen.getByRole('button', { name: 'Exercício: 8' }));
    await fireEvent.changeText(screen.getByLabelText('Exercício'), '1 2x');
    expect(screen.getByLabelText('Exercício')).toHaveDisplayValue('12');
    await fireEvent(screen.getByLabelText('Exercício'), 'submitEditing');
    expect(changes).toEqual([12]);
  });

  it('mesmo valor: não avisa mudança', async () => {
    const changes = await open(8, 'count', 1, 99);
    await fireEvent.press(screen.getByRole('button', { name: 'Exercício: 8' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar Exercício' }));
    expect(changes).toEqual([]);
    expect(screen.getByRole('button', { name: 'Exercício: 8' })).toBeOnTheScreen();
  });

  it('sair do campo confirma; passar de minutos para segundos não', async () => {
    jest.useFakeTimers();
    const changes = await open(20, 'duration');
    await fireEvent.press(screen.getByRole('button', { name: 'Exercício: 0:20' }));
    const minutes = screen.getByLabelText('Minutos de Exercício');
    const secs = screen.getByLabelText('Segundos de Exercício');
    await fireEvent(minutes, 'focus');
    await fireEvent.changeText(minutes, '1');
    await fireEvent(minutes, 'submitEditing');
    await fireEvent(minutes, 'blur');
    await fireEvent(secs, 'focus');
    await act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(changes).toEqual([]);
    expect(screen.getByLabelText('Segundos de Exercício')).toBeOnTheScreen();
    await fireEvent(secs, 'blur');
    await act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(changes).toEqual([80]);
    expect(screen.getByRole('button', { name: 'Exercício: 1:20' })).toBeOnTheScreen();
  });
});
