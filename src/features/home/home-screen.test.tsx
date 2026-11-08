import { fireEvent, screen } from '@testing-library/react-native';

import { createSession, start } from '@/domain/engine';
import { PRESETS } from '@/domain/presets';
import { intervalRoutine } from '@/domain/routine';
import { buildTimeline } from '@/domain/timeline';
import { appRepos, renderApp } from '@/test/app';
import { clockAt, must } from '@/test/domain';
import { router } from '@/test/expo-router-mock';

import { HomeScreen } from './home-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.clearAllMocks();
});

describe('Início', () => {
  it('marca, rotinas prontas com duração e abrir uma vai para a sessão', async () => {
    const { repos } = await appRepos();
    await renderApp(<HomeScreen />, repos);
    expect(await screen.findByRole('image', { name: 'CronôBR' })).toBeOnTheScreen();
    const tabata = screen.getByRole('button', { name: 'Tabata clássico, 4:00 · 8 exercícios' });
    await fireEvent.press(tabata);
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/sessao',
      params: { rotina: 'tabata-classic' },
    });
    expect(screen.queryByText('Suas rotinas')).toBeNull();
    expect(screen.getByRole('button', { name: 'Histórico' })).toBeOnTheScreen();
  });

  it('treino em andamento aparece com atalho para continuar', async () => {
    const { repos } = await appRepos();
    const preset = must(PRESETS[0]);
    await repos.session.save(start(createSession('s', preset), buildTimeline(preset), clockAt(0)));
    await renderApp(<HomeScreen />, repos);
    expect(await screen.findByText(`Treino em andamento: ${preset.name}`)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar treino' }));
    expect(router.push).toHaveBeenCalledWith('/sessao');
  });

  it('rotinas próprias (vindas do app antigo) e contagem do histórico', async () => {
    const { repos } = await appRepos();
    const mine = intervalRoutine(
      { id: 'legacy-p-1', name: 'Meu HIIT', modality: 'hiit', origin: 'legacy', createdAt: 0 },
      { prepSeconds: 0, workSeconds: 30, restSeconds: 0, rounds: 2 },
    );
    await repos.routines.save(mine);
    await repos.session.finish({
      id: 'h1',
      routine: mine,
      status: 'completed',
      startedAt: 0,
      endedAt: 60_000,
      activeMs: 60_000,
      workDone: 2,
      workTotal: 2,
      source: 'app',
    });
    await renderApp(<HomeScreen />, repos);
    expect(await screen.findByText('Suas rotinas')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Meu HIIT, 1:00 · 2 exercícios' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/sessao',
      params: { rotina: 'legacy-p-1' },
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Histórico (1)' }));
    expect(router.push).toHaveBeenCalledWith('/historico');
  });
});
