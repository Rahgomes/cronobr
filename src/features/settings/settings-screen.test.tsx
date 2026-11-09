import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useDataChanged, useRepos } from '@/data/data-context';
import { useT } from '@/i18n/i18n-context';
import { appRepos, renderApp } from '@/test/app';
import { Button } from '@/ui/button';
import { useColorSchemeInUse } from '@/ui/theme-context';

import { APPEARANCE_KEY, AppearanceProvider } from './appearance-context';
import { SettingsScreen } from './settings-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));

function Probe() {
  const scheme = useColorSchemeInUse();
  const t = useT();
  return <Button label={`${scheme} ${t.home.newRoutine}`} onPress={() => undefined} />;
}

const settings = (
  <AppearanceProvider>
    <SettingsScreen />
    <Probe />
  </AppearanceProvider>
);

describe('Ajustes', () => {
  it('padrão: tema e idioma do aparelho; escolher grava e aplica na hora', async () => {
    const { repos } = await appRepos();
    await renderApp(settings, repos);
    expect(await screen.findByRole('header', { name: 'Ajustes' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Do aparelho', selected: true })).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Do aparelho (Português)', selected: true }),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Claro' }));
    expect(await screen.findByRole('button', { name: 'light Nova rotina' })).toBeOnTheScreen();
    expect(await repos.prefs.get(APPEARANCE_KEY)).toEqual({ theme: 'light', language: 'auto' });

    await fireEvent.press(screen.getByRole('button', { name: 'Français' }));
    expect(await screen.findByRole('header', { name: 'Réglages' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Clair', selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: "De l'appareil (Português)" })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Retour' })).toBeOnTheScreen();
    expect(await repos.prefs.get(APPEARANCE_KEY)).toEqual({ theme: 'light', language: 'fr' });
  });

  it('abre com o que estava gravado; valor estranho volta ao padrão', async () => {
    const { repos } = await appRepos();
    await repos.prefs.set(APPEARANCE_KEY, { theme: 'dark', language: 'es' });
    await renderApp(settings, repos);
    expect(await screen.findByRole('header', { name: 'Ajustes' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Oscuro', selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'dark Nueva rutina' })).toBeOnTheScreen();
    await screen.unmount();

    await repos.prefs.set(APPEARANCE_KEY, { theme: 'roxo', language: 'de' });
    await renderApp(settings, repos);
    expect(await screen.findByRole('header', { name: 'Ajustes' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Do aparelho', selected: true })).toBeOnTheScreen();
  });

  it('falha ao gravar: avisa e mantém a escolha anterior', async () => {
    const { repos } = await appRepos();
    await renderApp(settings, repos);
    await screen.findByRole('header', { name: 'Ajustes' });
    jest.spyOn(repos.prefs, 'set').mockRejectedValueOnce(new Error('disco cheio'));
    await fireEvent.press(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByText('Não deu para guardar a escolha. Tente de novo.'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Ajustes' })).toBeOnTheScreen();
  });

  it('som e avisos fica um toque adiante', async () => {
    const { repos } = await appRepos();
    await renderApp(settings, repos);
    await fireEvent.press(await screen.findByRole('button', { name: 'Som e avisos' }));
    expect(router.push).toHaveBeenCalledWith('/avisos');
  });

  it('dados trocados por um backup: a aparência é relida sem reabrir o app', async () => {
    const { repos } = await appRepos();
    function Restore() {
      const r = useRepos();
      const changed = useDataChanged();
      return (
        <Button
          label="restaurar"
          onPress={() => {
            void r.prefs.set(APPEARANCE_KEY, { theme: 'auto', language: 'en' }).then(changed);
          }}
        />
      );
    }
    await renderApp(
      <AppearanceProvider>
        <SettingsScreen />
        <Restore />
      </AppearanceProvider>,
      repos,
    );
    await screen.findByRole('header', { name: 'Ajustes' });
    await fireEvent.press(screen.getByRole('button', { name: 'restaurar' }));
    expect(await screen.findByRole('header', { name: 'Settings' })).toBeOnTheScreen();
  });
});
