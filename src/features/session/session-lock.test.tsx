// Trava de toques (P2), visualizações (P1) e salto pela lista (P3), com banco real.
import { act, fireEvent, screen } from '@testing-library/react-native';

import { appRepos, fakeClock, fakePort, renderApp } from '@/test/app';
import { block, routine, step } from '@/test/domain';

import { LOCKED_HINT } from './session-controls';
import { SessionScreen } from './session-screen';
import { SESSION_PREFS_KEY } from './session-view';
import { TICK_MS } from './use-session-runner';
import { RELOCK_MS } from './use-touch-lock';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

const flush = () =>
  act(async () => {
    await Promise.resolve();
  });

async function begin({
  prefs,
  routineId = 'tabata-classic',
  seed,
}: {
  prefs?: object;
  routineId?: string;
  seed?: Parameters<Awaited<ReturnType<typeof appRepos>>['repos']['routines']['save']>[0];
} = {}) {
  const env = await appRepos();
  if (prefs) await env.repos.prefs.set(SESSION_PREFS_KEY, prefs);
  if (seed) await env.repos.routines.save(seed);
  const clock = fakeClock();
  await renderApp(
    <SessionScreen routineId={routineId} clockSource={clock} />,
    env.repos,
    fakePort(),
  );
  await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
  await flush();
  const advance = async (ms: number) => {
    clock.advance(ms);
    await act(() => {
      jest.advanceTimersByTime(TICK_MS);
    });
  };
  return { ...env, advance };
}

describe('trava de toques (P2)', () => {
  it('começa travada: toque simples não pausa; segurar pausa e retoma', async () => {
    await begin();
    expect(screen.getByText(LOCKED_HINT)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Pausar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Pular etapa' }));
    expect(screen.queryByText('Pausado')).toBeNull();
    expect(screen.getByRole('header', { name: 'Preparação' })).toBeOnTheScreen();

    await fireEvent(screen.getByRole('button', { name: 'Pausar' }), 'longPress');
    expect(screen.getByText('Pausado')).toBeOnTheScreen();
    await fireEvent(screen.getByRole('button', { name: 'Retomar' }), 'longPress');
    expect(screen.queryByText('Pausado')).toBeNull();
  });

  it('travada, o X não abre nada e o seletor de visualização some', async () => {
    await begin();
    await fireEvent.press(screen.getByRole('button', { name: 'Encerrar treino' }));
    expect(screen.queryByText('Encerrar o treino?')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Lista' })).toBeNull();
  });

  it('segurar o cadeado destrava; parado de mexer, volta a travar em 5 s', async () => {
    await begin();
    // Toque simples no cadeado travado só lembra como destravar.
    await fireEvent.press(screen.getByRole('button', { name: 'Destravar a tela' }));
    expect(screen.getByText(LOCKED_HINT)).toBeOnTheScreen();
    await fireEvent(screen.getByRole('button', { name: 'Destravar a tela' }), 'longPress');
    expect(screen.queryByText(LOCKED_HINT)).toBeNull();
    expect(screen.getByRole('button', { name: 'Lista' })).toBeOnTheScreen();

    // Mexer adia a volta da trava.
    await act(() => {
      jest.advanceTimersByTime(RELOCK_MS - 1000);
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Pular etapa' }));
    await act(() => {
      jest.advanceTimersByTime(RELOCK_MS - 1000);
    });
    expect(screen.queryByText(LOCKED_HINT)).toBeNull();
    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(LOCKED_HINT)).toBeOnTheScreen();
  });

  it('com a preferência desligada começa livre e só trava pelo cadeado, sem voltar sozinha', async () => {
    await begin({ prefs: { view: 'anel', lockOnStart: false } });
    expect(screen.queryByText(LOCKED_HINT)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Travar a tela' }));
    expect(screen.getByText(LOCKED_HINT)).toBeOnTheScreen();
    await fireEvent(screen.getByRole('button', { name: 'Destravar a tela' }), 'longPress');
    await act(() => {
      jest.advanceTimersByTime(RELOCK_MS * 2);
    });
    expect(screen.queryByText(LOCKED_HINT)).toBeNull();
  });

  it('etapa por repetições: travada, "Concluí" pede toque longo', async () => {
    const manual = routine({
      id: 'manual',
      prepSeconds: 0,
      blocks: [
        block({
          repeat: 1,
          steps: [
            step({ kind: 'work', name: 'Flexão', seconds: null, reps: 12 }),
            step({ kind: 'work', name: 'Prancha', seconds: 20 }),
          ],
        }),
      ],
    });
    await begin({ routineId: 'manual', seed: manual });
    expect(screen.getByRole('timer', { name: '12 repetições' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Concluí' }));
    expect(screen.getByRole('timer', { name: '12 repetições' })).toBeOnTheScreen();
    await fireEvent(screen.getByRole('button', { name: 'Concluí' }), 'longPress');
    expect(screen.getByRole('header', { name: 'Exercício · Prancha' })).toBeOnTheScreen();
  });
});

describe('visualizações (P1) e salto pela lista (P3)', () => {
  const free = { view: 'anel', lockOnStart: false };

  it('a prévia escolhe a visualização e a trava; fica gravado', async () => {
    const { repos } = await appRepos();
    await renderApp(<SessionScreen routineId="tabata-classic" clockSource={fakeClock()} />, repos);
    await fireEvent.press(await screen.findByRole('button', { name: 'Foco' }));
    await fireEvent(screen.getByRole('switch', { name: 'Travar a tela ao começar' }), 'press');
    await flush();
    expect(await repos.prefs.get(SESSION_PREFS_KEY)).toEqual({ view: 'foco', lockOnStart: false });
    await fireEvent.press(screen.getByRole('button', { name: 'Começar' }));
    // Foco: rótulo da fase em caixa alta, número e o restante.
    expect(screen.getByText('PREPARAÇÃO')).toBeOnTheScreen();
    expect(screen.getByText('restante')).toBeOnTheScreen();
  });

  it('trocar durante o treino não mexe no tempo', async () => {
    const { advance, repos } = await begin({ prefs: free });
    await advance(4_000);
    expect(screen.getByRole('timer')).toHaveTextContent('0:06');
    await fireEvent.press(screen.getByRole('button', { name: 'Foco' }));
    expect(screen.getByRole('timer')).toHaveTextContent('0:06');
    await fireEvent.press(screen.getByRole('button', { name: 'Lista' }));
    expect(screen.getByRole('timer')).toHaveTextContent('0:06');
    expect(screen.getByRole('progressbar', { name: 'Progresso do treino' })).toBeOnTheScreen();
    await flush();
    expect(await repos.prefs.get(SESSION_PREFS_KEY)).toMatchObject({ view: 'lista' });
  });

  it('lista: feitas, atual e próximas; tocar numa linha confirma e salta; o histórico marca', async () => {
    const { advance, repos } = await begin({ prefs: { view: 'lista', lockOnStart: false } });
    await advance(12_000); // rodada 1, 2 s de exercício
    expect(screen.getByRole('button', { name: '1. Preparação, 0:10, feita' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '2. Exercício, 0:20, agora' })).toBeOnTheScreen();

    // Cancelar não salta.
    await fireEvent.press(screen.getByRole('button', { name: '9. Descanso, 0:10' }));
    expect(screen.getByRole('header', { name: 'Ir para Descanso?' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('Rodada 1 de 8')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: '9. Descanso, 0:10' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Ir para a etapa' }));
    expect(screen.getByText('Rodada 4 de 8')).toBeOnTheScreen();
    expect(screen.getByRole('timer')).toHaveTextContent('0:10');

    await fireEvent.press(screen.getByRole('button', { name: 'Encerrar treino' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Encerrar' }));
    expect(
      await screen.findByText('Teve salto de etapa: fica marcado como ajustado.'),
    ).toBeOnTheScreen();
    await flush();
    const [entry] = (await repos.history.page()).entries;
    expect(entry?.adjusted).toBe(true);
  });

  it('lista travada não salta', async () => {
    await begin({ prefs: { view: 'lista', lockOnStart: true } });
    await fireEvent.press(screen.getByRole('button', { name: '9. Descanso, 0:10' }));
    expect(screen.queryByText('Ir para Descanso?')).toBeNull();
  });
});
