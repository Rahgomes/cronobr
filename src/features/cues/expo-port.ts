// Adaptador real dos avisos (E03). Cada canal falha sozinho: um som que não carrega não cala a
// voz, e notificação negada não impede o treino. Erros dos módulos nativos são engolidos de
// propósito: aviso é acessório, o treino é o principal.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import type { PlannedAlert } from '@/domain/alerts';
import { SOUND_IDS, type Haptic, type SoundId } from '@/domain/cues';

import { isAway } from './away';
import { SOUND_LABEL } from './labels';
import type { CuePort } from './port';

const SOURCES: Record<SoundId, number> = {
  beepShort: require('@assets/sounds/beepShort.wav') as number,
  beepLong: require('@assets/sounds/beepLong.wav') as number,
  bell: require('@assets/sounds/bell.wav') as number,
  gong: require('@assets/sounds/gong.wav') as number,
  whistle: require('@assets/sounds/whistle.wav') as number,
  finish: require('@assets/sounds/finish.wav') as number,
};

/**
 * Som e voz juntos viram ruído: a voz entra depois do ataque do som (no máximo SPEECH_AFTER_MS)
 * e, a partir daí, o som segue baixinho por baixo dela.
 */
export const SPEECH_AFTER_MS = 650;
const SOUND_MS: Record<SoundId, number> = {
  beepShort: 110,
  beepLong: 500,
  bell: 2560,
  gong: 3000,
  whistle: 900,
  finish: 1520,
};
const UNDER_SPEECH_VOLUME = 0.25;

const KEEP_AWAKE_TAG = 'sessao';
const SILENT_CHANNEL = 'avisos-sem-som';
const channelFor = (sound: SoundId | null) => (sound ? `avisos-${sound}` : SILENT_CHANNEL);
const ignore = () => undefined;

function vibrate(kind: Haptic) {
  if (Platform.OS === 'web') return;
  const run =
    kind === 'tick'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : kind === 'phase'
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  run.catch(ignore);
}

/**
 * Notificações: com o app na tela não aparecem nem tocam (os avisos do próprio app já tocaram);
 * fora dela, aparecem com o som da fase. No Android o som é do canal, então há um por som.
 */
async function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: () => {
      const away = isAway();
      return Promise.resolve({
        shouldShowBanner: away,
        shouldShowList: away,
        shouldPlaySound: away,
        shouldSetBadge: false,
      });
    },
  });
  if (Platform.OS !== 'android') return;
  const base = {
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 120, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  };
  await Promise.all([
    ...SOUND_IDS.map((sound) =>
      Notifications.setNotificationChannelAsync(channelFor(sound), {
        ...base,
        name: `Treino: ${SOUND_LABEL[sound]}`,
        sound: `${sound}.wav`,
      }),
    ),
    Notifications.setNotificationChannelAsync(SILENT_CHANNEL, {
      ...base,
      name: 'Treino: sem som',
      sound: null,
    }),
  ]);
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function replaceAlerts(alerts: PlannedAlert[]) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (alerts.length === 0 || !(await ensurePermission())) return;
  // alarmClock: o Android não adia (sem a permissão de alarme exato, cai no melhor esforço).
  const { granted: exact } =
    Platform.OS === 'android'
      ? await Notifications.getExactAlarmPermissionsAsync()
      : { granted: false };
  await Promise.all(
    alerts.map((alert) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: alert.title,
          body: alert.body,
          sound: alert.sound ? `${alert.sound}.wav` : false,
          interruptionLevel: 'timeSensitive',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: alert.at,
          channelId: channelFor(alert.sound),
          delivery: exact ? 'alarmClock' : 'bestEffort',
        },
      }),
    ),
  );
}

export function createExpoPort(): CuePort {
  const players = new Map<SoundId, AudioPlayer>();
  const native = Platform.OS !== 'web';
  // Abaixa a música dos outros apps durante o aviso e respeita o modo silencioso.
  setAudioModeAsync({ interruptionMode: 'duckOthers', playsInSilentMode: false }).catch(ignore);
  if (native) setupNotifications().catch(ignore);
  // Agendamentos em fila: um cancelar-e-agendar não pode se misturar com o seguinte.
  let queue: Promise<void> = Promise.resolve();

  let pendingSpeech: ReturnType<typeof setTimeout> | null = null;

  function playSound(sound: SoundId): AudioPlayer | null {
    try {
      let player = players.get(sound);
      if (!player) {
        player = createAudioPlayer(SOURCES[sound]);
        players.set(sound, player);
      }
      player.volume = 1;
      player.seekTo(0).catch(ignore);
      player.play();
      return player;
    } catch {
      // Som que não toca não derruba o treino.
      return null;
    }
  }

  function speak(text: string, under: AudioPlayer | null) {
    if (under) under.volume = UNDER_SPEECH_VOLUME;
    // A frase nova substitui a anterior: nunca uma fila de avisos atrasados.
    Speech.stop()
      .catch(ignore)
      .finally(() => {
        Speech.speak(text, { language: 'pt-BR' });
      });
  }

  return {
    play: ({ sound, speech, haptic }) => {
      if (pendingSpeech) clearTimeout(pendingSpeech);
      pendingSpeech = null;
      const player = sound ? playSound(sound) : null;
      if (haptic) vibrate(haptic);
      if (!speech) return;
      const wait = sound && player ? Math.min(SOUND_MS[sound], SPEECH_AFTER_MS) : 0;
      if (wait === 0) {
        speak(speech, null);
        return;
      }
      pendingSpeech = setTimeout(() => {
        pendingSpeech = null;
        speak(speech, player);
      }, wait);
    },
    preview: (sound) => {
      playSound(sound);
    },
    schedule: (alerts) => {
      if (!native) return;
      queue = queue.then(() => replaceAlerts(alerts)).catch(ignore);
    },
    keepAwake: (on) => {
      const run = on ? activateKeepAwakeAsync(KEEP_AWAKE_TAG) : deactivateKeepAwake(KEEP_AWAKE_TAG);
      run.catch(ignore);
    },
  };
}
