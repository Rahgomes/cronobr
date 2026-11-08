import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import type { PlannedAlert } from '@/domain/alerts';
import { must } from '@/test/domain';

import { createExpoPort } from './expo-port';

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({ seekTo: jest.fn(() => Promise.resolve()), play: jest.fn() })),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(() => Promise.resolve()),
  deactivateKeepAwake: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExactAlarmPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

const N = jest.mocked(Notifications);
const flush = () =>
  new Promise<void>((resolve) => {
    setImmediate(() => {
      resolve();
    });
  });

const ALERT: PlannedAlert = {
  at: 1_000,
  segment: 1,
  title: 'Vai, 20 segundos',
  body: 'Rodada 1 de 8 · Tabata clássico',
  sound: 'bell',
};

function setOS(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
}

beforeEach(() => {
  jest.clearAllMocks();
  setOS('android');
  N.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true } as never);
});

describe('porta real dos avisos', () => {
  it('abaixa a música dos outros apps e respeita o modo silencioso', () => {
    createExpoPort();
    expect(setAudioModeAsync).toHaveBeenCalledWith({
      interruptionMode: 'duckOthers',
      playsInSilentMode: false,
    });
  });

  it('som: um player por som, reaproveitado e tocado do começo', () => {
    const port = createExpoPort();
    port.play({ sound: 'bell', speech: null, haptic: null });
    port.preview('bell');
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    const player = jest.mocked(createAudioPlayer).mock.results[0]?.value as {
      seekTo: jest.Mock;
      play: jest.Mock;
    };
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalledTimes(2);
  });

  it('som que falha ao carregar não derruba a voz', async () => {
    jest.mocked(createAudioPlayer).mockImplementationOnce(() => {
      throw new Error('sem decodificador');
    });
    const port = createExpoPort();
    port.play({ sound: 'gong', speech: 'Descanso', haptic: null });
    await flush();
    expect(Speech.speak).toHaveBeenCalledWith('Descanso', { language: 'pt-BR' });
  });

  it('voz: a frase nova interrompe a anterior', async () => {
    const port = createExpoPort();
    port.play({ sound: null, speech: 'Metade', haptic: null });
    await flush();
    expect(Speech.stop).toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledWith('Metade', { language: 'pt-BR' });
  });

  it.each([
    [
      'tick',
      () => {
        expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
      },
    ],
    [
      'phase',
      () => {
        expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
      },
    ],
    [
      'finish',
      () => {
        expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
      },
    ],
  ] as const)('vibração %s', (haptic, check) => {
    createExpoPort().play({ sound: null, speech: null, haptic });
    check();
  });

  it('no web não vibra nem agenda', async () => {
    setOS('web');
    const port = createExpoPort();
    port.play({ sound: null, speech: null, haptic: 'phase' });
    port.schedule([ALERT]);
    await flush();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(N.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    expect(N.setNotificationHandler).not.toHaveBeenCalled();
  });

  it('Android: um canal por som e um mudo, e o handler só mostra com o app fora da tela', async () => {
    createExpoPort();
    await flush();
    const channels = N.setNotificationChannelAsync.mock.calls.map(([id]) => id);
    expect(channels).toContain('avisos-bell');
    expect(channels).toContain('avisos-sem-som');
    expect(channels).toHaveLength(7);
    const handler = must(N.setNotificationHandler.mock.calls[0]?.[0]);
    await expect(handler.handleNotification({} as never)).resolves.toMatchObject({
      shouldPlaySound: false,
      shouldShowBanner: false,
    });
  });

  it('agendar troca tudo: cancela e agenda com som, canal e alarme exato', async () => {
    const port = createExpoPort();
    port.schedule([ALERT, { ...ALERT, at: 2_000, sound: null }]);
    await flush();
    await flush();
    expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(N.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: ALERT.title,
        body: ALERT.body,
        sound: 'bell.wav',
        interruptionLevel: 'timeSensitive',
      },
      trigger: { type: 'date', date: 1_000, channelId: 'avisos-bell', delivery: 'alarmClock' },
    });
    expect(N.scheduleNotificationAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ sound: false }) as unknown,
        trigger: expect.objectContaining({ channelId: 'avisos-sem-som' }) as unknown,
      }),
    );
  });

  it('iOS usa melhor esforço; sem permissão (e sem poder pedir) só cancela', async () => {
    setOS('ios');
    const port = createExpoPort();
    port.schedule([ALERT]);
    await flush();
    await flush();
    expect(N.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ delivery: 'bestEffort' }) as unknown,
      }),
    );
    jest.clearAllMocks();
    N.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false } as never);
    port.schedule([ALERT]);
    await flush();
    await flush();
    expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('pede permissão uma vez quando ainda pode; negada, não agenda', async () => {
    N.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true } as never);
    N.requestPermissionsAsync.mockResolvedValue({ granted: false } as never);
    const port = createExpoPort();
    port.schedule([ALERT]);
    await flush();
    await flush();
    expect(N.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('lista vazia só cancela, sem pedir permissão', async () => {
    const port = createExpoPort();
    port.schedule([]);
    await flush();
    expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(N.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it('tela acesa liga e desliga pela mesma etiqueta', () => {
    const port = createExpoPort();
    port.keepAwake(true);
    port.keepAwake(false);
    expect(activateKeepAwakeAsync).toHaveBeenCalledWith('sessao');
    expect(deactivateKeepAwake).toHaveBeenCalledWith('sessao');
  });
});
