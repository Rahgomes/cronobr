import { act, fireEvent, screen } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { appRepos, fakePort, renderApp } from '@/test/app';

import { CueSettingsScreen } from './cue-settings-screen';
import type { NotifyState } from './port';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.restoreAllMocks();
});

async function open(state: NotifyState) {
  const { repos } = await appRepos();
  const port = fakePort(state);
  await renderApp(<CueSettingsScreen />, repos, port);
  await screen.findByRole('header', { name: 'Som e avisos' });
  return port;
}

describe('notificação recusada (E08, fluxo 8)', () => {
  it('bloqueada: explica o que muda e leva às configurações do aparelho', async () => {
    const port = await open('off');
    expect(await screen.findByText('Notificações bloqueadas')).toBeOnTheScreen();
    expect(screen.getByText(/e o fim dos temporizadores não avisam/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir configurações' }));
    expect(port.openSettings).toHaveBeenCalledTimes(1);
  });

  it.each<NotifyState>(['on', 'ask', 'none'])('%s: nada a avisar', async (state) => {
    const port = await open(state);
    await act(async () => {
      await Promise.resolve();
    });
    expect(port.notifications).toHaveBeenCalled();
    expect(screen.queryByText('Notificações bloqueadas')).toBeNull();
  });

  it('liberou nas configurações e voltou: o aviso some', async () => {
    let listener: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, fn) => {
      listener = fn;
      return { remove: jest.fn() };
    });
    const port = await open('off');
    expect(await screen.findByText('Notificações bloqueadas')).toBeOnTheScreen();
    port.notifications.mockResolvedValue('on');
    await act(async () => {
      listener?.('active');
      await Promise.resolve();
    });
    expect(screen.queryByText('Notificações bloqueadas')).toBeNull();
  });
});
