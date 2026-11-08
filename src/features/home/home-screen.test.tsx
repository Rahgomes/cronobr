import { fireEvent, screen, within } from '@testing-library/react-native';

import { createSession, start } from '@/domain/engine';
import type { HistoryEntry } from '@/domain/history';
import { PRESETS, presetById } from '@/domain/presets';
import { intervalRoutine, type Routine } from '@/domain/routine';
import { buildTimeline } from '@/domain/timeline';
import { appRepos, renderApp } from '@/test/app';
import { clockAt, must } from '@/test/domain';
import { router } from '@/test/expo-router-mock';

import { HomeScreen } from './home-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

const DAY = 86_400_000;
const NOW = Date.parse('2026-11-07T12:00:00-03:00');

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

function done(id: string, routine: Routine, endedAt: number): HistoryEntry {
  return {
    id,
    routine,
    status: 'completed',
    startedAt: endedAt - 60_000,
    endedAt,
    activeMs: 60_000,
    workDone: 1,
    workTotal: 1,
    source: 'app',
  };
}

describe('Início', () => {
  it('marca, histórico no topo e as modalidades em carrossel com a contagem de modelos', async () => {
    const { repos } = await appRepos();
    await renderApp(<HomeScreen />, repos);
    expect(await screen.findByRole('image', { name: 'CronôBR' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Modalidades' })).toBeOnTheScreen();
    // Sem treino feito ainda, nada de "Recentes" nem "Suas rotinas".
    expect(screen.queryByText('Recentes')).toBeNull();
    expect(screen.queryByText('Suas rotinas')).toBeNull();
    // A lista longa saiu da Início: os modelos ficam dentro de cada modalidade.
    expect(screen.queryByRole('button', { name: /Tabata clássico, 4:00/ })).toBeNull();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Tabata: 20 s forte, 10 s leve, 2 modelos' }),
    );
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/modalidade/[id]',
      params: { id: 'tabata' },
    });
    expect(screen.getByRole('button', { name: /^EMOM: .*, 3 modelos$/ })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Ver todas' }));
    expect(router.push).toHaveBeenCalledWith('/modalidades');
    await fireEvent.press(screen.getByRole('button', { name: 'Histórico' }));
    expect(router.push).toHaveBeenCalledWith('/historico');
    await fireEvent.press(screen.getByRole('button', { name: 'Ajustes' }));
    expect(router.push).toHaveBeenCalledWith('/ajustes');
  });

  it('três entradas rápidas: cronômetro, temporizador e intervalado', async () => {
    const { repos } = await appRepos();
    await renderApp(<HomeScreen />, repos);
    for (const [name, href] of [
      ['Cronômetro', '/cronometro'],
      ['Temporizador', '/temporizador'],
      ['Intervalado', '/intervalado'],
    ] as const) {
      await fireEvent.press(await screen.findByRole('button', { name }));
      expect(router.push).toHaveBeenLastCalledWith(href);
    }
  });

  it('recentes: um card por rotina, o mais novo primeiro, e tocar repete aquele registro', async () => {
    const { repos } = await appRepos();
    const tabata = must(presetById('tabata-classic'));
    const hiit = must(presetById('hiit-sprint'));
    await repos.session.finish(done('h-old', tabata, NOW - 3 * DAY));
    await repos.session.finish(done('h-hiit', hiit, NOW - DAY));
    await repos.session.finish(done('h-new', tabata, NOW - 60_000));
    await renderApp(<HomeScreen />, repos);

    const cards = await screen.findAllByRole('button', { name: /^Repetir / });
    expect(cards.map((c) => c.props.accessibilityLabel as string)).toEqual([
      'Repetir Tabata clássico, 4:00, feito hoje',
      'Repetir HIIT sprint, 9:45, feito ontem',
    ]);
    expect(within(must(cards[0])).getByText('4:00 · hoje')).toBeOnTheScreen();
    await fireEvent.press(must(cards[0]));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/sessao', params: { repetir: 'h-new' } });
    await fireEvent.press(screen.getByRole('button', { name: 'Ver histórico' }));
    expect(router.push).toHaveBeenCalledWith('/historico');
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

  it('rotinas próprias (vindas do app antigo) em lista abaixo das modalidades', async () => {
    const { repos } = await appRepos();
    const mine = intervalRoutine(
      { id: 'legacy-p-1', name: 'Meu HIIT', modality: 'hiit', origin: 'legacy', createdAt: 0 },
      { prepSeconds: 0, workSeconds: 30, restSeconds: 0, rounds: 2 },
    );
    await repos.routines.save(mine);
    await renderApp(<HomeScreen />, repos);
    expect(await screen.findByText('Suas rotinas')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Meu HIIT, 1:00 · 2 exercícios' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/sessao',
      params: { rotina: 'legacy-p-1' },
    });
  });
});
