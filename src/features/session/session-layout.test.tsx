// E06 C: leitor de tela só ouve a troca de fase, e a sessão usa a paisagem em duas colunas.
import { act, fireEvent, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Dimensions } from 'react-native';

import { appRepos, fakeClock, fakePort, renderApp } from '@/test/app';

import { SessionScreen } from './session-screen';
import { SESSION_PREFS_KEY } from './session-view';
import { TICK_MS } from './use-session-runner';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

const PORTRAIT = { width: 412, height: 915, scale: 2, fontScale: 1 };

function setWindow(window: typeof PORTRAIT) {
  Dimensions.set({ window, screen: window });
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  setWindow(PORTRAIT);
  jest.useRealTimers();
  jest.clearAllMocks();
});

async function startTabata(view: 'anel' | 'foco' | 'lista' = 'anel') {
  const env = await appRepos();
  await env.repos.prefs.set(SESSION_PREFS_KEY, { view, lockOnStart: false });
  const clock = fakeClock();
  await renderApp(
    <SessionScreen routineId="tabata-classic" clockSource={clock} />,
    env.repos,
    fakePort(),
  );
  await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
  const advance = async (ms: number) => {
    clock.advance(ms);
    await act(() => {
      jest.advanceTimersByTime(TICK_MS);
    });
  };
  return { advance };
}

it('leitor de tela ouve a troca de fase, não cada segundo', async () => {
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
  const { advance } = await startTabata();
  announce.mockClear();
  for (let s = 0; s < 9; s += 1) await advance(1000);
  expect(announce).not.toHaveBeenCalled();
  await advance(1000);
  expect(announce).toHaveBeenCalledTimes(1);
  expect(announce).toHaveBeenLastCalledWith(expect.stringMatching(/^Exercício|^Trabalho/));
  announce.mockRestore();
});

it('retrato: controles no rodapé, uma coluna', async () => {
  await startTabata();
  expect(screen.queryByTestId('session-wide')).toBeNull();
  expect(screen.getByRole('button', { name: 'Pausar' })).toBeOnTheScreen();
});

it.each(['anel', 'foco', 'lista'] as const)(
  'paisagem: corpo e controles lado a lado (%s)',
  async (view) => {
    setWindow({ width: 915, height: 412, scale: 2, fontScale: 1 });
    await startTabata(view);
    expect(screen.getByTestId('session-wide')).toBeOnTheScreen();
    expect(screen.getByRole('timer')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Encerrar treino' })).toBeOnTheScreen();
  },
);

it('girar no meio do treino não perde o tempo', async () => {
  const { advance } = await startTabata();
  await advance(3000);
  const before = screen.getByRole('timer').props.children as string;
  await act(async () => {
    setWindow({ width: 915, height: 412, scale: 2, fontScale: 1 });
    await Promise.resolve();
  });
  expect(screen.getByTestId('session-wide')).toBeOnTheScreen();
  expect(screen.getByRole('timer')).toHaveTextContent(before);
});

it('número grande não cresce com a letra do sistema e cabe na tela pequena', async () => {
  setWindow({ width: 320, height: 568, scale: 2, fontScale: 2 });
  await startTabata('foco');
  const clock = screen.getByTestId('session-clock');
  expect(clock.props).toMatchObject({ maxFontSizeMultiplier: 1, numberOfLines: 1 });
  expect(clock).not.toHaveStyle({ fontSize: 120 });
});
