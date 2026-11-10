import { act, fireEvent, screen } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { HistoryScreen } from '@/features/history/history-screen';
import { HomeScreen } from '@/features/home/home-screen';
import { AppearanceProvider } from '@/features/settings/appearance-context';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { appRepos, fakeAds, renderApp } from '@/test/app';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.restoreAllMocks();
});

async function home(ads = fakeAds()) {
  const { repos } = await appRepos();
  await renderApp(<HomeScreen />, repos, undefined, undefined, ads);
  await screen.findByRole('header', { name: 'Modalidades' });
  return ads;
}

describe('Banner (E08 C)', () => {
  it('carregou: aparece no fim da Início, marcado como publicidade', async () => {
    const ads = await home();
    expect(await screen.findByText('Publicidade')).toBeOnTheScreen();
    expect(screen.getByText('Banner de teste')).toBeOnTheScreen();
    expect(ads.start).toHaveBeenCalledTimes(1);
    // A Início segue igual: nada some por causa do anúncio.
    expect(screen.getByRole('button', { name: 'Nova rotina' })).toBeOnTheScreen();
  });

  it('também no fim do Histórico', async () => {
    const { repos } = await appRepos();
    await renderApp(<HistoryScreen />, repos, undefined, undefined, fakeAds());
    expect(await screen.findByText('Publicidade')).toBeOnTheScreen();
  });

  it.each([
    ['sem preenchimento', 'no-fill'],
    ['offline', 'network-error'],
    ['tempo esgotado', 'timeout'],
    ['erro qualquer', 'internal-error'],
  ])('%s: o espaço some sem aviso e a tela funciona igual', async (_, reason) => {
    await home(fakeAds({ banner: reason }));
    expect(screen.queryByText('Banner de teste')).toBeNull();
    expect(screen.queryByText('Publicidade')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Nova rotina' })).toBeEnabled();
  });

  it('offline e depois com rede: tenta de novo quando o app volta para a frente', async () => {
    let listener: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, fn) => {
      listener = fn;
      return { remove: () => undefined };
    });
    const ads = fakeAds({ banner: 'network-error' });
    await home(ads);
    expect(screen.queryByText('Banner de teste')).toBeNull();
    ads.outcome.banner = 'loaded';
    await act(async () => {
      listener?.('active');
      await Promise.resolve();
    });
    expect(await screen.findByText('Publicidade')).toBeOnTheScreen();
  });

  it('sem consentimento para anúncio: nada de banner', async () => {
    await home(fakeAds({ start: false }));
    expect(screen.queryByText('Banner de teste')).toBeNull();
  });

  it('SDK falhou ao começar: nada de banner, e o app segue', async () => {
    const ads = await home(fakeAds({ start: 'reject' }));
    expect(ads.start).toHaveBeenCalled();
    expect(screen.queryByText('Banner de teste')).toBeNull();
    expect(screen.getByRole('button', { name: 'Nova rotina' })).toBeEnabled();
  });

  it('sem provedor (a web): nenhum espaço de anúncio', async () => {
    const { repos } = await appRepos();
    await renderApp(<HomeScreen />, repos);
    await screen.findByRole('header', { name: 'Modalidades' });
    expect(screen.queryByText('Publicidade')).toBeNull();
  });
});

describe('Privacidade dos anúncios em Ajustes', () => {
  async function settings(privacy: boolean) {
    const { repos } = await appRepos();
    const ads = fakeAds({ privacy });
    await renderApp(
      <AppearanceProvider>
        <SettingsScreen />
      </AppearanceProvider>,
      repos,
      undefined,
      undefined,
      ads,
    );
    await screen.findByRole('button', { name: 'Backup e transferência' });
    return ads;
  }

  it('onde a lei pede: link que abre o formulário de consentimento de novo', async () => {
    const ads = await settings(true);
    await fireEvent.press(await screen.findByRole('button', { name: 'Privacidade dos anúncios' }));
    expect(ads.showPrivacy).toHaveBeenCalledTimes(1);
  });

  it('nos outros lugares: sem o link', async () => {
    await settings(false);
    expect(screen.queryByRole('button', { name: 'Privacidade dos anúncios' })).toBeNull();
  });
});
