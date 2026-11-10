import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { appRepos, renderApp } from '@/test/app';
import { router } from '@/test/expo-router-mock';

import { SequenceScreen } from './sequence-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.clearAllMocks();
});

const NOW = Date.UTC(2026, 10, 9, 12);

async function open() {
  const env = await appRepos();
  await renderApp(<SequenceScreen now={() => NOW} />, env.repos);
  await screen.findByRole('header', { name: 'Cadastrar sequência' });
  return env;
}

describe('Cadastrar sequência recebida', () => {
  it('vazia: mostra o exemplo e não deixa criar', async () => {
    await open();
    expect(screen.getByText('Nada lido ainda.')).toBeOnTheScreen();
    expect(screen.getAllByText('Nada lido ainda.').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByRole('button', { name: /Criar e revisar/ }));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('cola, vê como ficou, ajusta voltas e descanso, cria e abre no editor', async () => {
    const { repos } = await open();
    await fireEvent.changeText(screen.getByLabelText('Nome da rotina'), 'Joelho');
    await fireEvent.changeText(
      screen.getByLabelText('Sequência'),
      'Ponte de glúteo 30s\nAgachamento 2x12\nConcha 10 reps cada lado',
    );
    expect(screen.getByText('Ponte de glúteo')).toBeOnTheScreen();
    expect(screen.getByText('0:30')).toBeOnTheScreen();
    expect(screen.getByText('2 séries · 12 reps')).toBeOnTheScreen();
    expect(screen.getByText('10 reps · cada lado')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Aumentar Voltas' }));
    // Descanso digitado à mão (D134): toca no número, escreve os segundos e confirma.
    await fireEvent.press(screen.getByRole('button', { name: 'Descanso entre exercícios: 0:15' }));
    await fireEvent.changeText(
      screen.getByLabelText('Segundos de Descanso entre exercícios'),
      '10',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Confirmar Descanso entre exercícios' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Criar e revisar' }));
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledTimes(1);
    });
    const [saved] = await repos.routines.list();
    expect(saved).toMatchObject({ name: 'Joelho', modality: 'profissional', createdAt: NOW });
    expect(saved?.blocks[0]?.repeat).toBe(2);
    expect(saved?.blocks[0]?.steps.find((s) => s.kind === 'rest')?.seconds).toBe(10);
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/rotina/[id]',
      params: { id: saved?.id },
    });
  });

  it('linha que não entende: avisa com o número e não cria', async () => {
    await open();
    await fireEvent.changeText(screen.getByLabelText('Sequência'), 'Ponte 30s\nPrancha');
    expect(
      screen.getByText('Linha 2: faltou o tempo ou as repetições no fim. "Prancha"'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Ponte')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /Criar e revisar/ }));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sem nome: usa "Minha sequência"; descanso escrito aparece marcado', async () => {
    const { repos } = await open();
    await fireEvent.changeText(
      screen.getByLabelText('Sequência'),
      '30s\nDescanso 20s\nPonte 10 reps',
    );
    expect(screen.getByText('Exercício 1')).toBeOnTheScreen();
    expect(screen.getByText('Descanso (descanso)')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Criar e revisar' }));
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledTimes(1);
    });
    expect((await repos.routines.list())[0]?.name).toBe('Minha sequência');
  });

  it('acima dos limites do editor: mostra o motivo', async () => {
    await open();
    await fireEvent.changeText(screen.getByLabelText('Sequência'), 'Ponte 0s');
    expect(screen.getAllByText(/pelo menos/).length).toBeGreaterThan(0);
  });

  it('falha ao gravar: avisa e fica na tela', async () => {
    const { repos } = await open();
    jest.spyOn(repos.routines, 'save').mockRejectedValueOnce(new Error('disco'));
    await fireEvent.changeText(screen.getByLabelText('Sequência'), 'Ponte 30s');
    await fireEvent.press(screen.getByRole('button', { name: 'Criar e revisar' }));
    expect(
      await screen.findByText('Não deu para gravar a rotina. Tente de novo.'),
    ).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
