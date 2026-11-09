import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createTimer, start, TIMERS_MAX } from '@/domain/timers';
import { setSessionRunning } from '@/features/cues/session-active';
import { TimersSummary } from '@/features/home/timers-summary';
import { appRepos, fakeClock, fakePort, renderApp } from '@/test/app';
import { must } from '@/test/domain';
import { router } from '@/test/expo-router-mock';

import { TIMERS_KEY, TIMERS_TICK_MS, TimersProvider } from './timers-context';
import { TimersScreen } from './timers-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

const WALL = 1_700_000_000_000;

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  setSessionRunning(false);
});

async function open(saved?: unknown) {
  jest.useFakeTimers();
  const env = await appRepos();
  if (saved !== undefined) await env.repos.prefs.set(TIMERS_KEY, saved);
  const clock = fakeClock();
  const port = fakePort();
  await renderApp(
    <TimersProvider clockSource={clock}>
      <TimersSummary />
      <TimersScreen />
    </TimersProvider>,
    env.repos,
    port,
  );
  const advance = async (ms: number) => {
    clock.advance(ms);
    await act(() => {
      jest.advanceTimersByTime(TIMERS_TICK_MS);
    });
  };
  return { ...env, clock, port, advance };
}

/** Cria pelo formulário: nome e minutos a partir dos 5:00 do começo. */
async function create(name: string, minutes: number) {
  await fireEvent.press(await screen.findByRole('button', { name: 'Novo temporizador' }));
  await fireEvent.changeText(screen.getByLabelText('Nome'), name);
  for (let m = 5; m > minutes; m -= 1) {
    await fireEvent.press(screen.getByRole('button', { name: 'Diminuir Minutos' }));
  }
  await fireEvent.press(screen.getByRole('button', { name: `Iniciar ${String(minutes)}:00` }));
}

const lastPlan = (port: ReturnType<typeof fakePort>) => {
  const calls = port.schedule.mock.calls.filter(([owner]) => owner === 'temporizadores');
  return must(calls.at(-1))[1];
};

describe('Temporizadores', () => {
  it('sem nenhum, explica; cria com nome, já rodando, e agenda o fim só no dono dele', async () => {
    const { advance, port, repos } = await open();
    expect(await screen.findByText(/Nenhum temporizador ainda/)).toBeOnTheScreen();
    await create('Ovo', 1);
    await advance(30_000);
    expect(screen.getByRole('timer', { name: 'Ovo, 0:30, Rodando' })).toBeOnTheScreen();
    expect(lastPlan(port)).toEqual([
      expect.objectContaining({ at: WALL + 60_000, title: 'Ovo terminou', sound: 'finish' }),
    ]);
    expect(port.schedule.mock.calls.every(([owner]) => owner === 'temporizadores')).toBe(true);
    await waitFor(async () => {
      expect(await repos.prefs.get(TIMERS_KEY)).toEqual([
        expect.objectContaining({ name: 'Ovo', status: 'running' }),
      ]);
    });
  });

  it('pausar congela e tira o aviso agendado; retomar segue; encerrar remove', async () => {
    const { advance, port } = await open();
    await create('Chá', 3);
    await advance(60_000);
    await fireEvent.press(screen.getByRole('button', { name: 'Pausar Chá' }));
    expect(lastPlan(port)).toEqual([]);
    await advance(60_000);
    expect(screen.getByRole('timer', { name: 'Chá, 2:00, Pausado' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retomar Chá' }));
    await advance(30_000);
    expect(screen.getByRole('timer', { name: 'Chá, 1:30, Rodando' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Encerrar Chá' }));
    expect(screen.queryByRole('timer')).toBeNull();
    expect(lastPlan(port)).toEqual([]);
  });

  it('dois rodando juntos: um relógio só, conclusão com o nome, toca e fala uma vez', async () => {
    const { advance, port } = await open();
    await create('Ovo', 1);
    await create('Pão', 2);
    await advance(60_000);
    expect(await screen.findByRole('header', { name: 'Ovo terminou' })).toBeOnTheScreen();
    expect(port.play).toHaveBeenCalledTimes(1);
    expect(port.play).toHaveBeenCalledWith(
      { sound: 'finish', speech: 'Ovo terminou', haptic: 'finish' },
      'pt-BR',
    );
    expect(screen.getByRole('timer', { name: 'Pão, 1:00, Rodando' })).toBeOnTheScreen();
    await advance(1_000);
    expect(port.play).toHaveBeenCalledTimes(1);
    // OK fecha o aviso; Repetir (na linha) recomeça do tempo cheio.
    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('header', { name: 'Ovo terminou' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Repetir Ovo' }));
    await advance(10_000);
    expect(screen.getByRole('timer', { name: 'Ovo, 0:50, Rodando' })).toBeOnTheScreen();
  });

  it('fins a menos de 1 s viram um aviso agendado só (colisão)', async () => {
    const t0 = start(createTimer('a', 'Ovo', 60_000), { mono: 0, wall: WALL });
    const t1 = start(createTimer('b', 'Chá', 60_000), { mono: 0, wall: WALL + 400 });
    const t2 = start(createTimer('c', 'Pão', 60_000), { mono: 0, wall: WALL + 5_000 });
    const { port } = await open([t0, t1, t2]);
    await waitFor(() => {
      expect(lastPlan(port).map((alert) => alert.title)).toEqual([
        'Ovo e Chá terminaram',
        'Pão terminou',
      ]);
    });
  });

  it('com treino rodando, o temporizador toca mas não fala por cima da voz do treino', async () => {
    const { advance, port } = await open();
    await create('Ovo', 1);
    setSessionRunning(true);
    await advance(60_000);
    expect(port.play).toHaveBeenCalledWith(expect.objectContaining({ speech: null }), 'pt-BR');
    expect(screen.getByRole('header', { name: 'Ovo terminou' })).toBeOnTheScreen();
    // Repetir direto do aviso.
    await fireEvent.press(screen.getByRole('button', { name: 'Repetir' }));
    await advance(1_000);
    expect(screen.getByRole('timer', { name: 'Ovo, 0:59, Rodando' })).toBeOnTheScreen();
  });

  it('reabrir: o que rodava segue pelo relógio civil; o que acabou longe não toca de novo', async () => {
    const away = [
      // Começou 2 min antes de abrir, num processo com outro relógio monotônico.
      start(createTimer('a', 'Feijão', 10 * 60_000), { mono: 777_777, wall: WALL - 120_000 }),
      start(createTimer('b', 'Roupa', 60_000), { mono: 5, wall: WALL - 3_600_000 }),
    ];
    const { port } = await open(away);
    await act(() => {
      jest.advanceTimersByTime(TIMERS_TICK_MS);
    });
    await waitFor(() => {
      expect(screen.getByRole('timer', { name: 'Feijão, 8:00, Rodando' })).toBeOnTheScreen();
    });
    expect(screen.getByRole('timer', { name: 'Roupa terminou' })).toBeOnTheScreen();
    expect(port.play).not.toHaveBeenCalled();
    expect(screen.queryByRole('header', { name: /terminou/ })).toBeNull();
  });

  it(`no limite de ${String(TIMERS_MAX)}, criar fica travado com o motivo`, async () => {
    const full = Array.from({ length: TIMERS_MAX }, (_, i) =>
      createTimer(String(i), `T${String(i)}`, 60_000),
    );
    await open(full);
    await waitFor(() => {
      expect(screen.getAllByRole('timer')).toHaveLength(TIMERS_MAX);
    });
    const add = screen.getByRole('button', { name: 'Novo temporizador' });
    // Travado com motivo: tocar explica, não abre o formulário.
    await fireEvent.press(add);
    expect(screen.queryByLabelText('Nome')).toBeNull();
    expect(screen.getAllByText(/Limite de 10 temporizadores/).length).toBeGreaterThan(0);
  });

  it('nome em branco vira "Temporizador N"; o resumo da Início mostra os ativos e leva à tela', async () => {
    const { advance } = await open();
    expect(await screen.findByRole('button', { name: 'Temporizadores' })).toBeOnTheScreen();
    await create('', 2);
    await advance(15_000);
    const summary = screen.getByRole('button', { name: /^Temporizadores, 1 ativo\./ });
    expect(summary).toHaveAccessibleName('Temporizadores, 1 ativo. Temporizador 1 1:45');
    await fireEvent.press(summary);
    expect(router.push).toHaveBeenCalledWith('/temporizadores');
  });
});
