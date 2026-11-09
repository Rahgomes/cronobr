import { act, fireEvent, screen } from '@testing-library/react-native';

import { appRepos, renderApp } from '@/test/app';
import { fakeAudio, live } from '@/test/audio';
import { must, step } from '@/test/domain';

import { StepSheet, type StepActions } from './step-sheet';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

const actions = (): StepActions => ({
  change: jest.fn(),
  moveUp: null,
  moveDown: null,
  duplicate: jest.fn(),
  insertAfter: jest.fn(),
  remove: null,
});

afterEach(() => {
  jest.useRealTimers();
});

describe('folha da etapa: cadência', () => {
  it('prévia toca 4 batidas no BPM da etapa antes de iniciar o treino', async () => {
    jest.useFakeTimers();
    const audio = fakeAudio();
    const { repos } = await appRepos();
    const view = await renderApp(
      <StepSheet
        step={step({ kind: 'work', seconds: 30, bpm: 170 })}
        actions={actions()}
        onClose={jest.fn()}
        createClock={() => audio.clock}
      />,
      repos,
    );
    expect(screen.getByLabelText('Cadência: 170 BPM')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Ouvir 4 batidas' }));
    expect(screen.getByRole('button', { name: 'Ouvir 4 batidas' })).toBeDisabled();
    await act(() => {
      jest.advanceTimersByTime(3_000);
    });
    const heard = live(audio.clicks);
    expect(heard).toHaveLength(4);
    expect(must(heard[1]) - must(heard[0])).toBeCloseTo(60 / 170, 6);
    expect(screen.getByRole('button', { name: 'Ouvir 4 batidas' })).toBeEnabled();
    await view.unmount();
    expect(audio.closed).toBe(1);
  });

  it('desligar a cadência tira o campo; sem áudio, a prévia explica', async () => {
    const { repos } = await appRepos();
    const act1 = actions();
    await renderApp(
      <StepSheet
        step={step({ kind: 'work', seconds: 30, bpm: 170 })}
        actions={act1}
        onClose={jest.fn()}
        createClock={() => null}
      />,
      repos,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Ouvir 4 batidas' }));
    // Travado com motivo: tocar de novo explica por que não toca.
    await fireEvent.press(screen.getByRole('button', { name: 'Ouvir 4 batidas' }));
    expect(screen.getAllByText(/não está disponível neste aparelho/).length).toBeGreaterThan(0);
    await fireEvent(screen.getByRole('switch', { name: 'Metrônomo nesta etapa' }), 'press');
    expect(act1.change).toHaveBeenCalledWith({ bpm: undefined });
  });
});
