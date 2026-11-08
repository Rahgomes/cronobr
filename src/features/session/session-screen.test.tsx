import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { createSession, start } from '@/domain/engine';
import { presetById } from '@/domain/presets';
import { buildTimeline } from '@/domain/timeline';
import { appRepos, fakeClock, renderApp } from '@/test/app';
import { must } from '@/test/domain';
import { router, usePreventRemove } from '@/test/expo-router-mock';

import { SessionScreen } from './session-screen';
import { TICK_MS } from './use-session-runner';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

// Tabata clássico: prep 10 · (20 + 10) × 8 sem o último descanso = 240 s
const TABATA = must(presetById('tabata-classic'));

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

async function open(routineId: string | undefined = 'tabata-classic') {
  const env = await appRepos();
  const clock = fakeClock();
  await renderApp(<SessionScreen routineId={routineId} clockSource={clock} />, env.repos);
  /** O relógio anda e o intervalo da tela dispara uma vez (ou várias, se `ticks`). */
  const advance = async (ms: number, ticks = 1) => {
    clock.advance(ms);
    await act(() => {
      jest.advanceTimersByTime(TICK_MS * ticks);
    });
  };
  return { ...env, clock, advance };
}

async function startTabata() {
  const ctx = await open();
  await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
  return ctx;
}

describe('sessão', () => {
  it('pronto mostra a prévia com a mesma duração da execução [PRD 7]', async () => {
    await open();
    expect(await screen.findByRole('header', { name: 'Tabata clássico' })).toBeOnTheScreen();
    expect(screen.getByText('Duração total: 4:00')).toBeOnTheScreen();
    expect(screen.getByText('8 exercícios')).toBeOnTheScreen();
  });

  it('começa na preparação e anda pelas fases conforme o relógio', async () => {
    const { advance } = await startTabata();
    expect(screen.getByRole('header', { name: 'Preparação' })).toBeOnTheScreen();
    expect(screen.getByRole('timer')).toHaveTextContent('0:10');
    await advance(15_000);
    expect(screen.getByRole('header', { name: 'Exercício' })).toBeOnTheScreen();
    expect(screen.getByText('Rodada 1 de 8')).toBeOnTheScreen();
    expect(screen.getByRole('timer')).toHaveTextContent('0:15');
    expect(screen.getByText('Restante no treino: 3:45')).toBeOnTheScreen();
  });

  it('callback atrasado: uma leitura só atravessa várias fases [PRD 2]', async () => {
    const { advance } = await startTabata();
    await advance(10_000 + 30_000 * 3 + 5_000); // rodada 4, 5 s de exercício
    expect(screen.getByText('Rodada 4 de 8')).toBeOnTheScreen();
    expect(screen.getByRole('timer')).toHaveTextContent('0:15');
  });

  it('pausar congela; retomar segue de onde parou [PRD 1]', async () => {
    const { advance } = await startTabata();
    await advance(4_000);
    await fireEvent.press(screen.getByRole('button', { name: 'Pausar' }));
    expect(screen.getByText('Pausado')).toBeOnTheScreen();
    await advance(60_000, 4);
    expect(screen.getByRole('timer')).toHaveTextContent('0:06');
    await fireEvent.press(screen.getByRole('button', { name: 'Retomar' }));
    await advance(1_000);
    expect(screen.getByRole('timer')).toHaveTextContent('0:05');
  });

  it('pular e voltar etapa', async () => {
    await startTabata();
    await fireEvent.press(screen.getByRole('button', { name: 'Pular etapa' }));
    expect(screen.getByRole('header', { name: 'Exercício' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Etapa anterior' }));
    expect(screen.getByRole('header', { name: 'Preparação' })).toBeOnTheScreen();
  });

  it('X pede confirmação; continuar não muda nada; encerrar registra uma vez', async () => {
    const { advance, repos } = await startTabata();
    await advance(35_000);
    await fireEvent.press(screen.getByRole('button', { name: 'Encerrar treino' }));
    expect(screen.getByRole('header', { name: 'Encerrar o treino?' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar treino' }));
    expect(screen.getByRole('header', { name: 'Descanso' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Encerrar treino' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Encerrar' }));
    expect(screen.getByRole('header', { name: 'Treino encerrado' })).toBeOnTheScreen();
    expect(screen.getByText('Exercícios feitos: 1 de 8')).toBeOnTheScreen();
    await waitFor(async () => {
      expect(await repos.history.count()).toBe(1);
    });
    expect(await repos.session.load()).toBeNull();
  });

  it('voltar do sistema no meio do treino pede a mesma confirmação', async () => {
    await startTabata();
    const [enabled, onBlocked] = must(usePreventRemove.mock.lastCall);
    expect(enabled).toBe(true);
    await act(() => {
      onBlocked();
    });
    expect(screen.getByRole('header', { name: 'Encerrar o treino?' })).toBeOnTheScreen();
  });

  it('conclusão: registrada uma única vez, mesmo com mais leituras depois [PRD 8]', async () => {
    const { advance, repos } = await startTabata();
    await advance(240_000);
    expect(screen.getByRole('header', { name: 'Treino concluído' })).toBeOnTheScreen();
    expect(screen.getByText('Tempo ativo: 4 min')).toBeOnTheScreen();
    await advance(10_000, 8);
    await waitFor(async () => {
      expect(await repos.history.count()).toBe(1);
    });
    expect(
      await repos.history.get(must(await repos.history.page()).entries[0]?.id ?? ''),
    ).toMatchObject({
      status: 'completed',
      workDone: 8,
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao início' }));
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('cada troca de fase grava um marco da sessão', async () => {
    const { advance, repos, clock } = await startTabata();
    await advance(11_000);
    const saved = await repos.session.load();
    expect(saved).toMatchObject({ status: 'running', position: { segment: 1 } });
    expect(saved?.since?.wall).toBe(clock.now().wall);
  });

  it('segundo plano grava marco; ao voltar, o tempo dormido conta', async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      listeners.push(listener);
      return { remove: jest.fn() };
    });
    const { repos, clock } = await startTabata();
    await act(() => {
      for (const l of listeners) l('background');
    });
    expect((await repos.session.load())?.since?.wall).toBe(clock.now().wall);
    clock.advanceWall(40_000); // aparelho dormiu: só o civil andou
    await act(() => {
      for (const l of listeners) l('active');
    });
    expect(screen.getByText('Rodada 2 de 8')).toBeOnTheScreen();
  });

  it('gravar o marco falhou: o treino segue e a tela avisa; a próxima gravação limpa o aviso', async () => {
    const { raw, advance } = await startTabata();
    raw.failOn('INSERT INTO active_session');
    await fireEvent.press(screen.getByRole('button', { name: 'Pausar' }));
    expect(await screen.findByText(/Não deu para gravar o progresso/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retomar' }));
    await advance(1_000);
    await waitFor(() => {
      expect(screen.queryByText(/Não deu para gravar o progresso/)).toBeNull();
    });
  });

  it('gravação do histórico falhou: avisa e tenta de novo [PRD 10]', async () => {
    const { raw, repos } = await startTabata();
    raw.failOn('INSERT OR IGNORE INTO history');
    await fireEvent.press(screen.getByRole('button', { name: 'Encerrar treino' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Encerrar' }));
    expect(await screen.findByText('Não deu para salvar no histórico.')).toBeOnTheScreen();
    expect(await repos.history.count()).toBe(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Tentar salvar de novo' }));
    await waitFor(() => {
      expect(screen.queryByText('Não deu para salvar no histórico.')).toBeNull();
    });
    expect(await repos.history.count()).toBe(1);
  });

  it('rotina inexistente ou sem rotina: explica e volta', async () => {
    await open('nao-existe');
    expect(await screen.findByRole('header', { name: 'Rotina não encontrada' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao início' }));
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('banco falhou ao carregar: mensagem própria', async () => {
    const env = await appRepos();
    env.raw.failOn('active_session');
    await renderApp(
      <SessionScreen routineId="tabata-classic" clockSource={fakeClock()} />,
      env.repos,
    );
    expect(
      await screen.findByRole('header', { name: 'Não deu para abrir o treino' }),
    ).toBeOnTheScreen();
  });

  it('fechar na tela de pronto volta sem registrar nada', async () => {
    const { repos } = await open();
    await fireEvent.press(await screen.findByRole('button', { name: 'Fechar' }));
    expect(router.back).toHaveBeenCalled();
    expect(await repos.history.count()).toBe(0);
  });
});

describe('reabrir com treino em andamento', () => {
  async function withSaved(saveAtWall: (wall: number) => number) {
    const env = await appRepos();
    const clock = fakeClock();
    const tl = buildTimeline(TABATA);
    await env.repos.session.save(start(createSession('salva', TABATA), tl, clock.now()));
    clock.reboot();
    clock.advanceWall(saveAtWall(0));
    await renderApp(<SessionScreen routineId="hiit-sprint" clockSource={clock} />, env.repos);
    return env;
  }

  it('processo novo: retoma na fase certa pelo relógio civil, e não abre a outra rotina', async () => {
    await withSaved(() => 70_000); // prep 10 + 2 rodadas (60 s) => rodada 3, início
    expect(await screen.findByText('Rodada 3 de 8')).toBeOnTheScreen();
    expect(screen.queryByText(/HIIT/)).toBeNull();
  });

  it('reaberto depois do fim: registra concluído na hora do fim [PRD 3]', async () => {
    const { repos } = await withSaved(() => 3_600_000);
    expect(await screen.findByRole('header', { name: 'Treino concluído' })).toBeOnTheScreen();
    expect(screen.getByText('Tempo recalculado pelo relógio do aparelho.')).toBeOnTheScreen();
    await waitFor(async () => {
      expect(await repos.history.count()).toBe(1);
    });
  });

  it('relógio do aparelho voltou: fecha como encerrado, sem inventar tempo [PRD 4]', async () => {
    const { repos } = await withSaved(() => -60_000);
    expect(await screen.findByRole('header', { name: 'Treino encerrado' })).toBeOnTheScreen();
    await waitFor(async () => {
      expect((await repos.history.page()).entries[0]).toMatchObject({
        status: 'interrupted',
        activeMs: 0,
      });
    });
  });
});
