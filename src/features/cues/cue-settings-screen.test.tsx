import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { DataProvider } from '@/data/data-context';
import { DEFAULT_CUE_PREFS } from '@/domain/cues';
import { LocaleProvider } from '@/i18n/i18n-context';
import { appRepos, fakePort, renderApp } from '@/test/app';
import { Button } from '@/ui/button';

import { CUE_PREFS_KEY, CueProvider, useCues } from './cue-context';
import { CueSettingsScreen } from './cue-settings-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

async function open(saved?: unknown) {
  const { repos } = await appRepos();
  if (saved !== undefined) await repos.prefs.set(CUE_PREFS_KEY, saved);
  const port = fakePort();
  await renderApp(<CueSettingsScreen />, repos, port);
  return { repos, port };
}

describe('Som e avisos', () => {
  it('padrão: os canais e o pulso da cadência ligados, um som marcado por fase', async () => {
    await open();
    expect(await screen.findByRole('header', { name: 'Som e avisos' })).toBeOnTheScreen();
    for (const name of ['Som', 'Contagem 3, 2, 1', 'Voz', 'Vibração', 'Pulso da cadência']) {
      expect(screen.getByRole('switch', { name })).toBeChecked();
    }
    expect(screen.getAllByRole('button', { name: 'Sino de ringue', selected: true })).toHaveLength(
      1,
    );
  });

  it('escolher um som toca a prévia e grava no banco', async () => {
    const { repos, port } = await open();
    const gongs = await screen.findAllByRole('button', { name: 'Gongo' });
    // Ordem das seções: preparação, exercício, descanso, fim.
    await fireEvent.press(gongs[1] as never);
    expect(port.preview).toHaveBeenCalledWith('gong');
    await waitFor(async () => {
      expect(await repos.prefs.get(CUE_PREFS_KEY)).toMatchObject({
        sounds: { ...DEFAULT_CUE_PREFS.sounds, work: 'gong' },
      });
    });
  });

  it('desligar o som esconde a escolha de sons e trava a contagem; o resto segue', async () => {
    const { repos } = await open();
    await fireEvent(await screen.findByRole('switch', { name: 'Som' }), 'press');
    expect(screen.queryByRole('button', { name: 'Gongo' })).toBeNull();
    // Travada com motivo: tocar explica e não muda nada.
    const countdown = screen.getByRole('switch', { name: 'Contagem 3, 2, 1' });
    expect(countdown.props.accessibilityHint).toBe('Ligue o som para usar a contagem.');
    await fireEvent(countdown, 'press');
    expect(countdown).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Voz' })).toBeChecked();
    await waitFor(async () => {
      expect(await repos.prefs.get(CUE_PREFS_KEY)).toMatchObject({ sound: false, voice: true });
    });
  });

  it('desligar o pulso da cadência grava no banco', async () => {
    const { repos } = await open();
    await fireEvent(await screen.findByRole('switch', { name: 'Pulso da cadência' }), 'press');
    await waitFor(async () => {
      expect(await repos.prefs.get(CUE_PREFS_KEY)).toMatchObject({ pulse: false });
    });
  });

  it('abre com o que estava gravado', async () => {
    await open({ voice: false, sounds: { rest: 'gong' } });
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Voz' })).not.toBeChecked();
    });
    expect(screen.getAllByRole('button', { name: 'Gongo', selected: true })).toHaveLength(1);
  });
});

describe('voz na língua do app', () => {
  it('a porta recebe a língua em uso junto com os avisos', async () => {
    const { repos } = await appRepos();
    const port = fakePort();
    function Probe() {
      const cues = useCues();
      return (
        <Button
          label="tocar"
          onPress={() => {
            cues.port.play({ sound: null, speech: 'Repos', haptic: null });
          }}
        />
      );
    }
    await render(
      <DataProvider open={() => Promise.resolve(repos)}>
        <LocaleProvider language="fr">
          <CueProvider port={port}>
            <Probe />
          </CueProvider>
        </LocaleProvider>
      </DataProvider>,
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'tocar' }));
    expect(port.play).toHaveBeenCalledWith({ sound: null, speech: 'Repos', haptic: null }, 'fr');
  });
});
