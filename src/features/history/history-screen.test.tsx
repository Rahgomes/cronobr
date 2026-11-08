import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { HistoryEntry } from '@/domain/history';
import { presetById } from '@/domain/presets';
import { appRepos, renderApp } from '@/test/app';
import { must } from '@/test/domain';
import { router } from '@/test/expo-router-mock';

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

// "Hoje" fixo: 8 de novembro de 2026, meio-dia local.
const TODAY = new Date(2026, 10, 8, 12).getTime();
beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(TODAY);
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

const at = (day: number, hour: number, id: string, extra: Partial<HistoryEntry> = {}) => ({
  ...entry(0),
  id,
  routine: { ...routine, name: `Treino ${id}` },
  endedAt: new Date(2026, 10, day, hour).getTime(),
  ...extra,
});

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

  it('calendário: dia com treino marcado; tocar filtra o dia; tocar de novo ou "Ver todos" volta', async () => {
    const { repos } = await appRepos();
    await repos.session.finish(at(7, 7, 'manha'));
    await repos.session.finish(at(7, 23, 'noite'));
    await repos.session.finish(at(3, 10, 'outro'));
    await repos.session.finish(at(8, 9, 'hoje'));
    await renderApp(<HistoryScreen />, repos);
    expect(await screen.findByRole('header', { name: 'Novembro de 2026' })).toBeOnTheScreen();
    expect(screen.getByText(/^Treinou em 3 dias neste mês/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '8 de novembro, hoje, 1 treino' })).toBeOnTheScreen();
    // Dia sem treino não é botão.
    expect(screen.queryByRole('button', { name: /^5 de novembro/ })).toBeNull();
    // Mês atual: não há mês seguinte.
    expect(screen.queryByRole('button', { name: 'Próximo mês' })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: '7 de novembro, 2 treinos' }));
    expect(
      await screen.findByRole('header', { name: 'Treinos de 7 de novembro' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Treino noite')).toBeOnTheScreen();
    expect(screen.getByText('Treino manha')).toBeOnTheScreen();
    expect(screen.queryByText('Treino outro')).toBeNull();
    expect(
      screen.getByRole('button', { name: '7 de novembro, 2 treinos', selected: true }),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Ver todos' }));
    expect(screen.getByText('Treino outro')).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Treinos de 7 de novembro' })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: '3 de novembro, 1 treino' }));
    expect(
      await screen.findByRole('header', { name: 'Treinos de 3 de novembro' }),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '3 de novembro, 1 treino' }));
    expect(screen.queryByRole('header', { name: 'Treinos de 3 de novembro' })).toBeNull();
  });

  it('navega entre meses; mês vazio diz que não tem treino', async () => {
    const { repos } = await appRepos();
    await repos.session.finish(at(7, 7, 'nov'));
    await repos.session.finish({ ...at(0, 0, 'out'), endedAt: new Date(2026, 9, 15, 8).getTime() });
    await renderApp(<HistoryScreen />, repos);
    await fireEvent.press(await screen.findByRole('button', { name: 'Mês anterior' }));
    expect(await screen.findByRole('header', { name: 'Outubro de 2026' })).toBeOnTheScreen();
    expect(
      await screen.findByRole('button', { name: '15 de outubro, 1 treino' }),
    ).toBeOnTheScreen();
    expect(screen.getByText(/^Treinou em 1 dia neste mês/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Mês anterior' }));
    expect(await screen.findByText('Nenhum treino neste mês.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Próximo mês' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(await screen.findByRole('header', { name: 'Novembro de 2026' })).toBeOnTheScreen();
  });

  it('linha mostra a nota e abre o detalhe', async () => {
    const { repos } = await appRepos();
    await repos.session.finish(at(7, 7, 'n1', { note: 'Joelho ok' }));
    await renderApp(<HistoryScreen />, repos);
    expect(await screen.findByText('Nota: Joelho ok')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /^Treino n1, .*, com nota$/ }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/historico/[id]', params: { id: 'n1' } });
  });
});
