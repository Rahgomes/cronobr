// Detalhe de um treino do histórico (E04 lote E), com banco real.
import { act, fireEvent, screen } from '@testing-library/react-native';

import type { HistoryEntry } from '@/domain/history';
import { presetById } from '@/domain/presets';
import { appRepos, renderApp } from '@/test/app';
import { must } from '@/test/domain';
import { router } from '@/test/expo-router-mock';

import { HistoryDetailScreen } from './history-detail-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.clearAllMocks();
});

const amrap = must(presetById('amrap-quick'));

const entry: HistoryEntry = {
  id: 'h1',
  routine: amrap,
  status: 'completed',
  startedAt: 0,
  endedAt: new Date(2026, 10, 7, 18, 30).getTime(),
  activeMs: 600_000,
  workDone: 1,
  workTotal: 1,
  source: 'app',
  rounds: 6,
  adjusted: true,
};

async function open(seed: HistoryEntry | null = entry) {
  const env = await appRepos();
  if (seed) await env.repos.session.finish(seed);
  await renderApp(<HistoryDetailScreen id="h1" />, env.repos);
  return env;
}

const note = () => screen.getByLabelText('Nota');

describe('Detalhe do treino', () => {
  it('mostra o que foi feito: status, tempo, rodadas e a marca de ajustado', async () => {
    await open();
    expect(await screen.findByRole('header', { name: 'AMRAP 10 minutos' })).toBeOnTheScreen();
    expect(screen.getByText('Concluído · 10 min · 1/1 exercícios')).toBeOnTheScreen();
    expect(screen.getByText('Rodadas registradas: 6')).toBeOnTheScreen();
    expect(screen.getByText(/^Ajustado/)).toBeOnTheScreen();
    expect(screen.getByText('0 de 280')).toBeOnTheScreen();
  });

  it('nota: grava sem espaço nas pontas, confirma no botão e volta igual ao reabrir', async () => {
    const { repos } = await open();
    await fireEvent.changeText(await screen.findByLabelText('Nota'), '  Carga 16 kg, pesado  ');
    expect(screen.getByText('23 de 280')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar nota' }));
    expect(await screen.findByText('Nota salva')).toBeOnTheScreen();
    expect((await repos.history.get('h1'))?.note).toBe('Carga 16 kg, pesado');
    expect(note()).toHaveDisplayValue('Carga 16 kg, pesado');

    // Mexer de novo tira a confirmação: o que está na tela ainda não foi gravado.
    await fireEvent.changeText(note(), 'Carga 18 kg');
    expect(screen.queryByText('Nota salva')).toBeNull();

    await screen.unmount();
    await renderApp(<HistoryDetailScreen id="h1" />, repos);
    expect(await screen.findByDisplayValue('Carga 16 kg, pesado')).toBeOnTheScreen();
  });

  it('nota apagada (campo vazio) some do registro', async () => {
    const { repos } = await open({ ...entry, note: 'antiga' });
    await fireEvent.changeText(await screen.findByDisplayValue('antiga'), '   ');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar nota' }));
    expect(await screen.findByText('Nota salva')).toBeOnTheScreen();
    expect(await repos.history.get('h1')).not.toHaveProperty('note');
  });

  it('falha ao gravar a nota avisa e não confirma', async () => {
    const { raw } = await open();
    raw.failOn('UPDATE history SET note');
    await fireEvent.changeText(await screen.findByLabelText('Nota'), 'x');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar nota' }));
    expect(await screen.findByText('Não deu para salvar a nota.')).toBeOnTheScreen();
    expect(screen.queryByText('Nota salva')).toBeNull();
  });

  it('repetir abre a sessão com a cópia deste registro', async () => {
    await open();
    await fireEvent.press(await screen.findByRole('button', { name: 'Repetir este treino' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/sessao', params: { repetir: 'h1' } });
  });

  it('apagar pede confirmação; cancelar mantém, confirmar apaga e volta', async () => {
    const { repos } = await open();
    await fireEvent.press(await screen.findByRole('button', { name: 'Apagar do histórico' }));
    expect(screen.getByRole('header', { name: 'Apagar este treino?' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await repos.history.count()).toBe(1);

    await fireEvent.press(screen.getByRole('button', { name: 'Apagar do histórico' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Apagar' }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(await repos.history.count()).toBe(0);
    expect(router.back).toHaveBeenCalled();
  });

  it('registro que não existe mais avisa em vez de quebrar', async () => {
    await open(null);
    expect(await screen.findByText('Este treino não está mais no histórico.')).toBeOnTheScreen();
  });
});
