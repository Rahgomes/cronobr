import { fireEvent, render, screen } from '@testing-library/react-native';

import { presetsOf } from '@/domain/presets';
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
    await render(<ModalityScreen id="tabata" />);
    expect(screen.getByRole('header', { name: 'Tabata' })).toBeOnTheScreen();
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

  it.each(['nao-existe', undefined, 'corrida'])(
    'modalidade inválida ou sem modelos (%s): explica e volta',
    async (id) => {
      await render(<ModalityScreen id={id} />);
      expect(screen.getByRole('header', { name: 'Modalidade não encontrada' })).toBeOnTheScreen();
      await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao início' }));
      expect(router.replace).toHaveBeenCalledWith('/');
    },
  );
});

describe('Modalidades (ver todas)', () => {
  it('um card por modalidade com modelos, e tocar abre a modalidade', async () => {
    await render(<ModalitiesScreen />);
    expect(screen.getByRole('header', { name: 'Modalidades' })).toBeOnTheScreen();
    const cards = screen.getAllByRole('button', { name: / modelos?$/ });
    expect(cards).toHaveLength(6);
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
