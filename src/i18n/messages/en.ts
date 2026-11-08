import type { Messages } from './pt';

export const en: Messages = {
  common: {
    back: 'Back',
    retry: 'Try again',
  },
  boot: {
    opening: 'Opening your workouts',
    unavailable: 'Storage unavailable',
    fallback: "Couldn't open your workouts on this device.",
    notErased: 'Your data was not erased.',
  },
  crash: {
    title: 'Something went wrong',
    body: 'Your workouts are safe. Try again.',
  },
  home: {
    history: 'History',
    backup: 'Backup and transfer',
    settings: 'Settings',
  },
  settings: {
    title: 'Settings',
    theme: 'Theme',
    themeAuto: 'Device',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    languageAuto: (name) => `Device (${name})`,
    languageHint: 'Your routine names stay as you wrote them.',
    cues: 'Sounds and alerts',
    cuesHint: 'Phase sounds, voice, vibration and 3, 2, 1 countdown.',
    saveFailed: "Couldn't save your choice. Try again.",
  },
};
