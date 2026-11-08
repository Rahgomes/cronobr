import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { HomeScreen } from '@/features/home/home-screen';
import { appRepos, renderApp } from '@/test/app';
import { must, routine } from '@/test/domain';
import { router } from '@/test/expo-router-mock';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.clearAllMocks();
});

async function seeded() {
  const { repos } = await appRepos();
  // Inserir põe a mais nova no topo: a ordem final é B, A.
  await repos.routines.save(routine({ id: 'a', name: 'Rotina A' }));
  await repos.routines.save(routine({ id: 'b', name: 'Rotina B' }));
  await renderApp(<HomeScreen />, repos);
  await screen.findByText('Suas rotinas');
  return repos;
}

const names = async (repos: Awaited<ReturnType<typeof seeded>>) =>
  (await repos.routines.list()).map((r) => r.name);

async function options(name: string) {
  await fireEvent.press(must(screen.getAllByRole('button', { name: `Opções de ${name}` }).at(-1)));
}

describe('ações de rotina na Início', () => {
  it('rotina própria: mover, duplicar e editar', async () => {
    const repos = await seeded();
    expect(await names(repos)).toEqual(['Rotina B', 'Rotina A']);

    await options('Rotina B');
    // A primeira não sobe.
    expect(screen.queryByRole('button', { name: 'Mover para cima' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Mover para baixo' }));
    await waitFor(async () => {
      expect(await names(repos)).toEqual(['Rotina A', 'Rotina B']);
    });

    await options('Rotina B');
    await fireEvent.press(screen.getByRole('button', { name: 'Mover para cima' }));
    await waitFor(async () => {
      expect(await names(repos)).toEqual(['Rotina B', 'Rotina A']);
    });

    await options('Rotina A');
    await fireEvent.press(screen.getByRole('button', { name: 'Duplicar' }));
    expect(await screen.findByRole('button', { name: /^Rotina A \(cópia\), / })).toBeOnTheScreen();

    await options('Rotina A');
    await fireEvent.press(screen.getByRole('button', { name: 'Editar' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/rotina/[id]', params: { id: 'a' } });
  });

  it('apagar pede confirmação; cancelar mantém', async () => {
    const repos = await seeded();
    await options('Rotina A');
    await fireEvent.press(screen.getByRole('button', { name: 'Apagar rotina' }));
    expect(
      screen.getByText('Os treinos já feitos com ela continuam no histórico.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await names(repos)).toEqual(['Rotina B', 'Rotina A']);

    await options('Rotina A');
    await fireEvent.press(screen.getByRole('button', { name: 'Apagar rotina' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Apagar' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Rotina A, / })).toBeNull();
    });
    expect(await names(repos)).toEqual(['Rotina B']);
  });

  it('favoritar leva para "Favoritas" e fica gravado; tirar devolve', async () => {
    const repos = await seeded();
    expect(screen.queryByText('Favoritas')).toBeNull();
    await options('Rotina A');
    await fireEvent.press(screen.getByRole('button', { name: 'Favoritar' }));
    expect(await screen.findByText('Favoritas')).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: /^Rotina A, .*, favorita$/ })).toHaveLength(2);
    await waitFor(async () => {
      expect(await repos.prefs.get('favoritos')).toEqual(['a']);
    });

    await options('Rotina A');
    await fireEvent.press(screen.getByRole('button', { name: 'Tirar das favoritas' }));
    await waitFor(() => {
      expect(screen.queryByText('Favoritas')).toBeNull();
    });
  });

  it('favorita gravada com lixo é ignorada; "Nova rotina" abre o editor', async () => {
    const { repos } = await appRepos();
    await repos.prefs.set('favoritos', ['tabata-classic', 42, 'sumiu']);
    await renderApp(<HomeScreen />, repos);
    expect(await screen.findByText('Favoritas')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: /^Tabata clássico, .*, favorita$/ }),
    ).toBeOnTheScreen();
    await options('Tabata clássico');
    // Modelo pronto: só favoritar e editar uma cópia.
    expect(screen.queryByRole('button', { name: 'Duplicar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Apagar rotina' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Editar uma cópia' }));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: '/rotina/[id]',
      params: { id: 'nova', de: 'tabata-classic' },
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Nova rotina' }));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: '/rotina/[id]',
      params: { id: 'nova' },
    });
  });

  it('favoritas gravadas fora do formato não quebram a Início', async () => {
    const { repos } = await appRepos();
    await repos.prefs.set('favoritos', { nao: 'lista' });
    await renderApp(<HomeScreen />, repos);
    await screen.findByRole('header', { name: 'Modalidades' });
    expect(screen.queryByText('Favoritas')).toBeNull();
  });
});
