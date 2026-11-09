import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { presetsOf } from '@/domain/presets';
import { appRepos, renderApp } from '@/test/app';
import { routine } from '@/test/domain';
import { router } from '@/test/expo-router-mock';

import { MODALITY } from './catalog';
import { ModalitiesScreen } from './modalities-screen';
import { ModalityScreen } from './modality-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.clearAllMocks();
});

describe('Modalidade', () => {
  it('título, chamada e os modelos prontos; tocar um abre a sessão', async () => {
    const { repos } = await appRepos();
    await renderApp(<ModalityScreen id="tabata" />, repos);
    expect(await screen.findByRole('header', { name: 'Tabata' })).toBeOnTheScreen();
    expect(screen.getByText('20 s forte, 10 s leve')).toBeOnTheScreen();
    expect(screen.getByText('Modelos prontos')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Tabata estendido, 6:00 · 12 exercícios' }),
    );
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/sessao',
      params: { rotina: 'tabata-extended' },
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it.each(['nao-existe', undefined, 'personalizada'])(
    'modalidade inválida ou sem modelos (%s): explica e volta',
    async (id) => {
      const { repos } = await appRepos();
      await renderApp(<ModalityScreen id={id} />, repos);
      expect(
        await screen.findByRole('header', { name: 'Modalidade não encontrada' }),
      ).toBeOnTheScreen();
      await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao início' }));
      expect(router.replace).toHaveBeenCalledWith('/');
    },
  );
});

describe('Modalidade: rotinas próprias', () => {
  it('lista as suas daquela modalidade, cria nova e edita cópia de modelo', async () => {
    const { repos } = await appRepos();
    await repos.routines.save(routine({ id: 'm1', name: 'Meu Tabata', modality: 'tabata' }));
    await repos.routines.save(routine({ id: 'm2', name: 'Meu boxe', modality: 'boxe' }));
    await renderApp(<ModalityScreen id="tabata" />, repos);
    expect(await screen.findByText('Suas rotinas de Tabata')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Meu Tabata, / })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Meu boxe, / })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Criar rotina de Tabata' }));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: '/rotina/[id]',
      params: { id: 'nova', modalidade: 'tabata' },
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Opções de Tabata clássico' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Editar uma cópia' }));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: '/rotina/[id]',
      params: { id: 'nova', de: 'tabata-classic' },
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Opções de Meu Tabata' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Editar' }));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: '/rotina/[id]',
      params: { id: 'm1' },
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Opções de Tabata clássico' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Favoritar' }));
    expect(
      await screen.findByRole('button', { name: /^Tabata clássico, .*, favorita$/ }),
    ).toBeOnTheScreen();
    await waitFor(async () => {
      expect(await repos.prefs.get('favoritos')).toEqual(['tabata-classic']);
    });
  });
});

describe('Modalidades (ver todas)', () => {
  it('um card por modalidade com modelos, e tocar abre a modalidade', async () => {
    await render(<ModalitiesScreen />);
    expect(screen.getByRole('header', { name: 'Modalidades' })).toBeOnTheScreen();
    const cards = screen.getAllByRole('button', { name: / modelos?$/ });
    expect(cards).toHaveLength(11);
    await fireEvent.press(screen.getByRole('button', { name: /^Boxe: / }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/modalidade/[id]',
      params: { id: 'boxe' },
    });
  });
});

describe('catálogo', () => {
  it('toda modalidade com modelo pronto tem foto', () => {
    for (const [id, info] of Object.entries(MODALITY)) {
      if (presetsOf(id as keyof typeof MODALITY).length > 0) expect(info.photo).not.toBeNull();
    }
  });
});

describe('Modalidade: do profissional (E07 D)', () => {
  it('tem o atalho para cadastrar a sequência recebida; as outras não', async () => {
    const { repos } = await appRepos();
    const { unmount } = await renderApp(<ModalityScreen id="profissional" />, repos);
    expect(await screen.findByRole('header', { name: 'Do profissional' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar sequência recebida' }));
    expect(router.push).toHaveBeenCalledWith('/sequencia');
    await unmount();
    await renderApp(<ModalityScreen id="foco" />, repos);
    expect(await screen.findByRole('header', { name: 'Estudo e foco' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Cadastrar sequência recebida' })).toBeNull();
  });
});
