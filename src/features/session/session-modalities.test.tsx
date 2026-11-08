// Modalidades com comportamento próprio (E04 lote D), pela tela, com banco real.
import { act, fireEvent, screen } from '@testing-library/react-native';

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

const flush = () =>
  act(async () => {
    await Promise.resolve();
  });

async function begin(routineId: string, lockOnStart = false) {
  const env = await appRepos();
  await env.repos.prefs.set(SESSION_PREFS_KEY, { view: 'anel', lockOnStart });
  const clock = fakeClock();
  const port = fakePort();
  await renderApp(<SessionScreen routineId={routineId} clockSource={clock} />, env.repos, port);
  await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
  await flush();
  const advance = async (ms: number) => {
    clock.advance(ms);
    await act(() => {
      jest.advanceTimersByTime(TICK_MS);
    });
  };
  return { ...env, port, advance };
}

describe('EMOM', () => {
  it('"Terminei" vira descanso até a virada do minuto; a rodada seguinte começa na hora', async () => {
    const { advance, port } = await begin('emom-15s');
    await advance(10_000 + 20_000); // 20 s na rodada 1
    expect(screen.getByRole('header', { name: 'Exercício' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Terminei' }));
    expect(screen.getByRole('header', { name: 'Descanso' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Terminei' })).toBeNull();
    expect(port.play).toHaveBeenLastCalledWith({
      sound: 'whistle',
      speech: 'Descanso',
      haptic: 'phase',
    });
    // O relógio não muda: faltam os mesmos 40 s.
    expect(screen.getByRole('timer')).toHaveTextContent('0:40');
    await advance(41_000);
    expect(screen.getByRole('header', { name: 'Exercício' })).toBeOnTheScreen();
    expect(screen.getByText('Rodada 2 de 10')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Terminei' })).toBeOnTheScreen();
  });

  it('travada, "Terminei" pede toque longo', async () => {
    const { advance } = await begin('emom-15s', true);
    await advance(12_000);
    await fireEvent.press(screen.getByRole('button', { name: 'Terminei' }));
    expect(screen.queryByRole('header', { name: 'Descanso' })).toBeNull();
    await fireEvent(screen.getByRole('button', { name: 'Terminei' }), 'longPress');
    expect(screen.getByRole('header', { name: 'Descanso' })).toBeOnTheScreen();
  });
});

describe('AMRAP', () => {
  it('conta rodadas (+1 até travado, -1 só destravado) e registra no histórico', async () => {
    const { repos, advance } = await begin('amrap-quick', true);
    expect(screen.getByLabelText('0 rodadas')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Mais uma rodada' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Mais uma rodada' }));
    expect(screen.getByLabelText('2 rodadas')).toBeOnTheScreen();
    // Travado, o "-1" fica fora de alcance (nem o leitor de tela oferece).
    expect(screen.queryByRole('button', { name: 'Tirar uma rodada' })).toBeNull();

    await fireEvent(screen.getByRole('button', { name: 'Destravar a tela' }), 'longPress');
    await fireEvent.press(screen.getByRole('button', { name: 'Tirar uma rodada' }));
    expect(screen.getByLabelText('1 rodadas')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Mais uma rodada' }));

    await advance(10_000 + 600_000);
    expect(await screen.findByText('Rodadas registradas: 2')).toBeOnTheScreen();
    await flush();
    expect((await repos.history.page()).entries[0]?.rounds).toBe(2);
  });
});

describe('mobilidade e corrida', () => {
  it('etapa dos dois lados aparece como esquerdo e depois direito', async () => {
    const { advance } = await begin('mobilidade-manha');
    // prep 10 · Pescoço 30 · Troca 5 · Ombros 30 · Troca 5 · Rotação esq. 30
    await advance(10_000 + 30_000 + 5_000 + 30_000 + 5_000 + 1_000);
    expect(
      screen.getByRole('header', { name: 'Exercício · Rotação de tronco, lado esquerdo' }),
    ).toBeOnTheScreen();
    await advance(30_000);
    expect(
      screen.getByRole('header', { name: 'Exercício · Rotação de tronco, lado direito' }),
    ).toBeOnTheScreen();
  });

  it('corrida e caminhada com nome próprio', async () => {
    const { advance } = await begin('corrida-1-1');
    await advance(11_000);
    expect(screen.getByRole('header', { name: 'Exercício · Corrida' })).toBeOnTheScreen();
    await advance(60_000);
    expect(screen.getByRole('header', { name: 'Descanso · Caminhada' })).toBeOnTheScreen();
  });
});
