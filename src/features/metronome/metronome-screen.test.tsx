import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, AppState, type AppStateStatus } from 'react-native';

import { appRepos, renderApp } from '@/test/app';
import { fakeAudio, live } from '@/test/audio';
import { must } from '@/test/domain';

import { METRONOME_KEY, MetronomeScreen } from './metronome-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

async function open(saved?: unknown, available = true) {
  jest.useFakeTimers();
  const env = await appRepos();
  if (saved !== undefined) await env.repos.prefs.set(METRONOME_KEY, saved);
  const audio = fakeAudio();
  const created = jest.fn(() => (available ? audio.clock : null));
  const view = await renderApp(<MetronomeScreen createClock={created} />, env.repos);
  await screen.findByText('Ouvir 4 batidas');
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Começar' })).toBeEnabled();
  });
  const run = async (ms: number) => {
    await act(() => {
      jest.advanceTimersByTime(ms);
    });
  };
  return { ...env, audio, created, view, run };
}

describe('Metrônomo', () => {
  it('prévia toca 4 batidas e volta sozinha; o áudio só nasce no primeiro toque', async () => {
    const { audio, created, run } = await open();
    expect(created).not.toHaveBeenCalled();
    expect(screen.getByLabelText('90 batidas por minuto')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Ouvir 4 batidas' }));
    expect(audio.resumed).toBe(1);
    expect(screen.getByRole('button', { name: 'Ouvir 4 batidas' })).toBeDisabled();
    await run(4_000);
    expect(live(audio.clicks)).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Ouvir 4 batidas' })).toBeEnabled();
  });

  it('começar anuncia; trocar o ritmo segue tocando e fica gravado', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const { audio, repos, run } = await open();
    await fireEvent.press(screen.getByRole('button', { name: 'Começar' }));
    expect(announce).toHaveBeenCalledWith('Metrônomo tocando a 90 BPM');
    await run(1_000);
    expect(screen.getByRole('button', { name: 'Parar' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '120 BPM' }));
    expect(screen.getByLabelText('120 batidas por minuto')).toBeOnTheScreen();
    await run(2_000);
    const times = live(audio.clicks);
    expect(must(times.at(-1)) - must(times.at(-2))).toBeCloseTo(0.5, 6);
    await waitFor(async () => {
      expect(await repos.prefs.get(METRONOME_KEY)).toEqual({ bpm: 120, offsetMs: 0 });
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Parar' }));
    expect(announce).toHaveBeenLastCalledWith('Metrônomo parado');
    const before = audio.clicks.length;
    await run(3_000);
    expect(audio.clicks.length).toBe(before);
  });

  it('BPM pelo − e +, nos limites; atraso do fone em passos de 20 ms', async () => {
    const { repos } = await open({ bpm: 239, offsetMs: 0 });
    expect(screen.getByLabelText('239 batidas por minuto')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Aumentar BPM' }));
    expect(screen.getByRole('button', { name: 'Aumentar BPM' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Aumentar Atraso do fone' }));
    expect(screen.getByText('20 ms')).toBeOnTheScreen();
    await waitFor(async () => {
      expect(await repos.prefs.get(METRONOME_KEY)).toEqual({ bpm: 240, offsetMs: 20 });
    });
  });

  it('app para o fundo ou sair da tela: para e fecha o áudio', async () => {
    let listener: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, fn) => {
      listener = fn;
      return { remove: jest.fn() };
    });
    const { audio, view, run } = await open();
    await fireEvent.press(screen.getByRole('button', { name: 'Começar' }));
    await run(500);
    await act(() => {
      listener?.('background');
    });
    expect(screen.getByRole('button', { name: 'Começar' })).toBeOnTheScreen();
    const before = live(audio.clicks).length;
    await run(3_000);
    expect(live(audio.clicks).length).toBeLessThanOrEqual(before);
    await view.unmount();
    expect(audio.closed).toBe(1);
  });

  it('sem áudio no aparelho, explica e trava os botões', async () => {
    await open(undefined, false);
    await fireEvent.press(screen.getByRole('button', { name: 'Começar' }));
    expect(screen.getByText(/não está disponível neste aparelho/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Começar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ouvir 4 batidas' })).toBeDisabled();
  });
});
