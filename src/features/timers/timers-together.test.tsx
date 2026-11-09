// Resistência (E07 E): temporizadores terminando juntos, no limite e com treino rodando.
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createTimer, start, TIMERS_MAX, type Timer } from '@/domain/timers';
import { setSessionRunning } from '@/features/cues/session-active';
import { appRepos, fakeClock, fakePort, renderApp } from '@/test/app';
import { must } from '@/test/domain';

import { TIMERS_TICK_MS, TIMERS_KEY, TimersProvider } from './timers-context';
import { TimersScreen } from './timers-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

const WALL = 1_700_000_000_000;
const NAMES = ['Ovo', 'Chá', 'Pão', 'Arroz', 'Feijão', 'Bolo', 'Roupa', 'Planta', 'Pizza', 'Café'];

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  setSessionRunning(false);
});

/**
 * `count` rodando, de 1 min, começados 10 s antes de abrir: o i-ésimo termina `gapMs * i` depois
 * do primeiro (aos 50 s). A duração é em segundos inteiros; a diferença fina vem do começo.
 */
function staggered(gapMs: number, count = TIMERS_MAX): Timer[] {
  return Array.from({ length: count }, (_, i) =>
    start(createTimer(`t${String(i)}`, must(NAMES[i]), 60_000), {
      mono: 0,
      wall: WALL - 10_000 + gapMs * i,
    }),
  );
}

async function open(saved: Timer[]) {
  const env = await appRepos();
  await env.repos.prefs.set(TIMERS_KEY, saved);
  const clock = fakeClock();
  const port = fakePort();
  await renderApp(
    <TimersProvider clockSource={clock}>
      <TimersScreen />
    </TimersProvider>,
    env.repos,
    port,
  );
  await waitFor(() => {
    expect(screen.getAllByRole('timer')).toHaveLength(saved.length);
  });
  /** O relógio e o intervalo da tela andam juntos, em passos de leitura. */
  const advance = async (ms: number) => {
    for (let done = 0; done < ms; done += TIMERS_TICK_MS) {
      clock.advance(TIMERS_TICK_MS);
      await act(() => {
        jest.advanceTimersByTime(TIMERS_TICK_MS);
      });
    }
  };
  const planned = () => {
    const calls = port.schedule.mock.calls.filter(([owner]) => owner === 'temporizadores');
    return must(calls.at(-1))[1].map((alert) => alert.title);
  };
  return { port, advance, planned };
}

const spoken = (port: ReturnType<typeof fakePort>) =>
  port.play.mock.calls.map(([cue]) => cue.speech);

describe('temporizadores terminando juntos', () => {
  it(`os ${String(TIMERS_MAX)} no mesmo instante: um aviso, um som, todos os nomes`, async () => {
    const { port, advance, planned } = await open(staggered(0));
    const title = 'Ovo, Chá, Pão, Arroz, Feijão, Bolo, Roupa, Planta, Pizza e Café terminaram';
    expect(planned()).toEqual([title]);
    await advance(61_000);
    expect(spoken(port)).toEqual([title]);
    expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
    expect(screen.getAllByRole('timer', { name: /terminou$/ })).toHaveLength(TIMERS_MAX);
  });

  it('a menos de 1 s um do outro: a tela avisa como a notificação agendada (D98), uma vez', async () => {
    const { port, advance, planned } = await open(staggered(400, 3));
    expect(planned()).toEqual(['Ovo, Chá e Pão terminaram']);
    await advance(62_000);
    // Sem isso, o segundo fim trocava o diálogo do primeiro e a segunda fala cortava a primeira.
    expect(spoken(port)).toEqual(['Ovo, Chá e Pão terminaram']);
    expect(screen.getByRole('header', { name: 'Ovo, Chá e Pão terminaram' })).toBeOnTheScreen();
  });

  it('em cadeia (600 ms): os grupos da tela são os mesmos da notificação', async () => {
    const { port, advance, planned } = await open(staggered(600));
    const groups = planned();
    expect(groups).toHaveLength(5);
    await advance(67_000);
    expect(spoken(port)).toEqual(groups);
    expect(port.play).toHaveBeenCalledTimes(groups.length);
  });

  it('com treino rodando: os 10 juntos tocam uma vez e não falam', async () => {
    const { port, advance } = await open(staggered(0));
    setSessionRunning(true);
    await advance(61_000);
    expect(port.play).toHaveBeenCalledTimes(1);
    expect(spoken(port)).toEqual([null]);
  });

  it('o do grupo que foi pausado antes de acabar avisa sozinho quando terminar', async () => {
    const { port, advance } = await open(staggered(800, 2));
    await advance(50_250);
    expect(spoken(port)).toEqual(['Ovo e Chá terminaram']);
    // Chá entrou no aviso, mas foi pausado antes do fim: quando terminar de fato, avisa de novo.
    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Pausar Chá' }));
    await advance(5_000);
    await fireEvent.press(screen.getByRole('button', { name: 'Retomar Chá' }));
    await advance(1_000);
    expect(spoken(port)).toEqual(['Ovo e Chá terminaram', 'Chá terminou']);
  });
});
