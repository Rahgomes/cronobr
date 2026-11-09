// Estudo e tarefas não são treino (E07 D): a sessão troca as palavras pela modalidade.
import { act, fireEvent, screen } from '@testing-library/react-native';

import { withMode } from '@/i18n/i18n-context';
import { en } from '@/i18n/messages/en';
import { pt } from '@/i18n/messages/pt';
import { appRepos, fakeClock, fakePort, renderApp } from '@/test/app';

import { SessionScreen } from './session-screen';
import { SESSION_PREFS_KEY } from './session-view';
import { TICK_MS } from './use-session-runner';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

async function begin(routineId: string) {
  const env = await appRepos();
  await env.repos.prefs.set(SESSION_PREFS_KEY, { view: 'anel', lockOnStart: false });
  const clock = fakeClock();
  const port = fakePort();
  await renderApp(<SessionScreen routineId={routineId} clockSource={clock} />, env.repos, port);
  await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
  const advance = async (ms: number) => {
    clock.advance(ms);
    await act(() => {
      jest.advanceTimersByTime(TICK_MS);
    });
  };
  return { port, advance };
}

describe('modo da sessão pela modalidade', () => {
  it('estudo: "Foco" e "Pausa" na tela e na voz; encerrar fala de sessão', async () => {
    const { advance, port } = await begin('foco-pomodoro');
    await advance(11_000);
    expect(screen.getByRole('header', { name: 'Foco' })).toBeOnTheScreen();
    await advance(25 * 60_000);
    expect(screen.getByRole('header', { name: 'Pausa' })).toBeOnTheScreen();
    expect(port.play).toHaveBeenLastCalledWith(
      expect.objectContaining({ speech: expect.stringContaining('Pausa') as unknown }),
      'pt-BR',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Encerrar sessão' }));
    expect(await screen.findByText('Encerrar a sessão?')).toBeOnTheScreen();
  });

  it('tarefas: "Tarefa" na tela', async () => {
    const { advance } = await begin('tarefas-blocos');
    await advance(11_000);
    expect(screen.getByRole('header', { name: 'Tarefa' })).toBeOnTheScreen();
  });

  it('exercícios do profissional continuam com as palavras de treino', async () => {
    const { advance } = await begin('profissional-exemplo');
    await advance(11_000);
    expect(screen.getByRole('button', { name: 'Encerrar treino' })).toBeOnTheScreen();
  });
});

describe('withMode', () => {
  it('troca só as palavras da sessão, em cada língua', () => {
    const focus = withMode(en, 'foco');
    expect(focus.words.phase.work).toBe('Focus');
    expect(focus.words.phase.prep).toBe(en.words.phase.prep);
    expect(focus.session.completed).toBe(en.modes.foco.completed);
    expect(focus.home).toBe(en.home);
    expect(withMode(pt, 'tabata')).toBe(pt);
    expect(withMode(pt, 'tarefas').words.completed).toBe('Tudo feito');
  });
});
