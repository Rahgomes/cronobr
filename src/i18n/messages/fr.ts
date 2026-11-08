import type { Messages } from './pt';

export const fr: Messages = {
  common: {
    back: 'Retour',
    retry: 'Réessayer',
  },
  boot: {
    opening: 'Ouverture de vos entraînements',
    unavailable: 'Stockage indisponible',
    fallback: "Impossible d'ouvrir vos entraînements sur cet appareil.",
    notErased: "Vos données n'ont pas été effacées.",
  },
  crash: {
    title: 'Un problème est survenu',
    body: 'Vos entraînements sont en sécurité. Réessayez.',
  },
  home: {
    history: 'Historique',
    backup: 'Sauvegarde et transfert',
    settings: 'Réglages',
  },
  settings: {
    title: 'Réglages',
    theme: 'Thème',
    themeAuto: "De l'appareil",
    themeLight: 'Clair',
    themeDark: 'Sombre',
    language: 'Langue',
    languageAuto: (name) => `De l'appareil (${name})`,
    languageHint: 'Les noms de vos routines restent tels que vous les avez écrits.',
    cues: 'Sons et alertes',
    cuesHint: 'Sons de chaque phase, voix, vibration et décompte 3, 2, 1.',
    saveFailed: "Impossible d'enregistrer votre choix. Réessayez.",
  },
};
