import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { DEFAULT_INTERVAL } from '@/domain/quick';
import { appRepos, fakeClock, fakePort, renderApp } from '@/test/app';
import { must } from '@/test/domain';
import { router } from '@/test/expo-router-mock';

import { INTERVAL_KEY, IntervalSetupScreen } from './interval-setup-screen';
import { STOPWATCH_KEY, StopwatchScreen } from './stopwatch-screen';
import { TIMER_KEY, TimerSetupScreen } from './timer-setup-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe('Temporizador', () => {
  it('ajusta minutos e segundos, nomeia e começa com os parâmetros da rota', async () => {
    const { repos } = await appRepos();
    await renderApp(<TimerSetupScreen />, repos);
    expect(await screen.findByRole('button', { name: 'Começar 5:00' })).toBeEnabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Diminuir Minutos' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Aumentar Segundos' }));
    await fireEvent.changeText(screen.getByLabelText('Nome (opcional)'), 'Prancha');
    await fireEvent.press(screen.getByRole('button', { name: 'Começar 4:01' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/sessao',
      params: { rapido: 't', s: '241', nome: 'Prancha' },
    });
    await waitFor(async () => {
      expect(await repos.prefs.get(TIMER_KEY)).toMatchObject({ seconds: 241, name: 'Prancha' });
    });
  });

  it('repetir ao concluir vai na rota; zero segundos trava o começar com o motivo', async () => {
    const { repos } = await appRepos();
    await repos.prefs.set(TIMER_KEY, { seconds: 5, name: '', loop: false });
    await renderApp(<TimerSetupScreen />, repos);
    await fireEvent(await screen.findByRole('switch', { name: 'Repetir ao concluir' }), 'press');
    await fireEvent.press(screen.getByRole('button', { name: 'Começar 0:05' }));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: '/sessao',
      params: { rapido: 't', s: '5', denovo: '1' },
    });
    // Zero digitado à mão (D134) no lugar de cinco toques no −.
    await fireEvent.press(screen.getByRole('button', { name: 'Segundos: 05' }));
    await fireEvent.changeText(screen.getByLabelText('Segundos'), '0');
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar Segundos' }));
    expect(screen.getByText(/pelo menos 1 s/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Diminuir Segundos' })).toBeDisabled();
  });
});

describe('Intervalado', () => {
  it('mostra o total, lembra a última configuração e começa', async () => {
    const { repos } = await appRepos();
    await repos.prefs.set(INTERVAL_KEY, { ...DEFAULT_INTERVAL, rounds: 2 });
    await renderApp(<IntervalSetupScreen />, repos);
    // 10 + 2 × 30 + 1 × 15
    expect(await screen.findByRole('button', { name: 'Começar 1:25' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Aumentar Rodadas' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Começar 2:10' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/sessao',
      params: { rapido: 'i', p: '10', t: '30', d: '15', r: '3' },
    });
    await waitFor(async () => {
      expect(await repos.prefs.get(INTERVAL_KEY)).toMatchObject({ rounds: 3 });
    });
  });

  it('gravado estragado volta ao padrão', async () => {
    const { repos } = await appRepos();
    await repos.prefs.set(INTERVAL_KEY, { rounds: -3, workSeconds: 'x' });
    await renderApp(<IntervalSetupScreen />, repos);
    expect(await screen.findByLabelText('Rodadas: 8')).toBeOnTheScreen();
  });
});

describe('Cronômetro', () => {
  async function open(saved?: unknown) {
    jest.useFakeTimers();
    const env = await appRepos();
    if (saved !== undefined) await env.repos.prefs.set(STOPWATCH_KEY, saved);
    const clock = fakeClock();
    const port = fakePort();
    await renderApp(<StopwatchScreen clockSource={clock} />, env.repos, port);
    const advance = async (ms: number) => {
      clock.advance(ms);
      await act(() => {
        jest.advanceTimersByTime(100);
      });
    };
    return { ...env, clock, port, advance };
  }

  it('conta, marca voltas com a duração de cada uma, pausa e mantém a tela acesa só rodando', async () => {
    const { advance, port } = await open();
    await fireEvent.press(await screen.findByRole('button', { name: 'Iniciar' }));
    expect(port.keepAwake).toHaveBeenLastCalledWith(true);
    await advance(30_000);
    expect(screen.getByRole('timer')).toHaveTextContent('0:30.0');
    await fireEvent.press(screen.getByRole('button', { name: 'Marcar volta' }));
    await advance(15_500);
    await fireEvent.press(screen.getByRole('button', { name: 'Marcar volta' }));
    expect(screen.getByText('Volta 2')).toBeOnTheScreen();
    expect(screen.getByText('0:15.5')).toBeOnTheScreen();
    // Total da volta 2 na lista e no relógio grande.
    expect(screen.getAllByText('0:45.5')).toHaveLength(2);
    await fireEvent.press(screen.getByRole('button', { name: 'Pausar' }));
    expect(port.keepAwake).toHaveBeenLastCalledWith(false);
    await advance(60_000);
    expect(screen.getByRole('timer')).toHaveTextContent('0:45.5');
  });

  it('zerar pede confirmação; cancelar mantém tudo', async () => {
    const { advance } = await open();
    await fireEvent.press(await screen.findByRole('button', { name: 'Iniciar' }));
    await advance(5_000);
    await fireEvent.press(screen.getByRole('button', { name: 'Pausar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Zerar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('timer')).toHaveTextContent('0:05.0');
    await fireEvent.press(screen.getByRole('button', { name: 'Zerar' }));
    await fireEvent.press(must(screen.getAllByRole('button', { name: 'Zerar' }).at(-1)));
    expect(screen.getByRole('timer')).toHaveTextContent('0:00.0');
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeOnTheScreen();
  });

  it('reabrir com o cronômetro rodando continua de onde o relógio está', async () => {
    const wall = 1_700_000_000_000;
    await open({
      status: 'running',
      since: { mono: 999_999, wall: wall - 90_000 },
      accumulatedMs: 10_000,
      laps: [],
    });
    await act(() => {
      jest.advanceTimersByTime(100);
    });
    await waitFor(() => {
      expect(screen.getByRole('timer')).toHaveTextContent('1:40.0');
    });
  });
});
