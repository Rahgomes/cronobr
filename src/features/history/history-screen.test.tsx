import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { HistoryEntry } from '@/domain/history';
import { presetById } from '@/domain/presets';
import { appRepos, renderApp } from '@/test/app';
import { must } from '@/test/domain';

import { HistoryScreen } from './history-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

const routine = must(presetById('tabata-classic'));

function entry(i: number, status: HistoryEntry['status'] = 'completed'): HistoryEntry {
  return {
    id: `h${String(i).padStart(3, '0')}`,
    routine: { ...routine, name: `Treino ${String(i)}` },
    status,
    startedAt: i * 1000,
    endedAt: Date.UTC(2026, 10, 7, 12, 0) + i * 60_000,
    activeMs: 240_000,
    workDone: status === 'completed' ? 8 : 3,
    workTotal: 8,
    source: 'app',
  };
}

describe('Histórico', () => {
  it('vazio explica o que vai aparecer', async () => {
    const { repos } = await appRepos();
    await renderApp(<HistoryScreen />, repos);
    expect(await screen.findByText(/Nenhum treino ainda/)).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Histórico' })).toBeOnTheScreen();
  });

  it('um treino: singular', async () => {
    const { repos } = await appRepos();
    await repos.session.finish(entry(1));
    await renderApp(<HistoryScreen />, repos);
    expect(await screen.findByText('1 treino registrado')).toBeOnTheScreen();
    expect(screen.getByText('Concluído · 4 min · 8/8 exercícios')).toBeOnTheScreen();
  });

  it('mostra status e totais; carrega mais sem cortar nada', async () => {
    const { repos } = await appRepos();
    for (let i = 0; i < 55; i += 1)
      await repos.session.finish(entry(i, i === 54 ? 'interrupted' : 'completed'));
    await renderApp(<HistoryScreen />, repos);
    expect(await screen.findByText('Treino 54')).toBeOnTheScreen();
    expect(screen.getByText('Encerrado antes do fim · 4 min · 3/8 exercícios')).toBeOnTheScreen();
    expect(screen.getByText('55 treinos registrados')).toBeOnTheScreen();
    // A lista é virtualizada: a ordem e a paginação completas são provadas no repositório.
    await fireEvent.press(screen.getByRole('button', { name: 'Carregar mais' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Carregar mais' })).toBeNull();
    });
  });
});
