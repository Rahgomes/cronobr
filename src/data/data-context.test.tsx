import { fireEvent, render, screen } from '@testing-library/react-native';

import { appRepos } from '@/test/app';
import { SplashScreen } from '@/test/expo-router-mock';
import { Text } from '@/ui/text';

import { DataProvider, useRepos } from './data-context';
import type { Repos } from './repos';
import { StorageError } from './sql';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

function Probe() {
  const repos = useRepos();
  return <Text>{typeof repos.history.count === 'function' ? 'dados prontos' : ''}</Text>;
}

describe('abertura dos dados', () => {
  it('carrega, esconde a splash e entrega os repositórios', async () => {
    const { repos } = await appRepos();
    await render(
      <DataProvider open={() => Promise.resolve(repos)}>
        <Probe />
      </DataProvider>,
    );
    expect(await screen.findByText('dados prontos')).toBeOnTheScreen();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('armazenamento indisponível: mostra o motivo e tenta de novo [PRD 10]', async () => {
    const { repos } = await appRepos();
    const open = jest
      .fn<Promise<Repos>, []>()
      .mockRejectedValueOnce(new StorageError('Atualize o CronôBR.', 'newer-version'))
      .mockRejectedValueOnce(new Error('qualquer'))
      .mockResolvedValueOnce(repos);
    await render(
      <DataProvider open={open}>
        <Probe />
      </DataProvider>,
    );
    expect(
      await screen.findByRole('header', { name: 'Armazenamento indisponível' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Atualize o CronôBR.')).toBeOnTheScreen();
    expect(screen.getByText('Seus dados não foram apagados.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(
      await screen.findByText('Não deu para abrir seus treinos neste aparelho.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('dados prontos')).toBeOnTheScreen();
  });

  it('useRepos fora do provedor falha com mensagem clara', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(render(<Probe />)).rejects.toThrow('useRepos fora do DataProvider');
  });
});
