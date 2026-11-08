import type { Messages } from './pt';

export const es: Messages = {
  common: {
    back: 'Volver',
    retry: 'Intentar de nuevo',
  },
  boot: {
    opening: 'Abriendo tus entrenamientos',
    unavailable: 'Almacenamiento no disponible',
    fallback: 'No se pudieron abrir tus entrenamientos en este dispositivo.',
    notErased: 'Tus datos no se borraron.',
  },
  crash: {
    title: 'Algo salió mal',
    body: 'Tus entrenamientos están guardados. Inténtalo de nuevo.',
  },
  home: {
    history: 'Historial',
    backup: 'Copia de seguridad y transferencia',
    settings: 'Ajustes',
  },
  settings: {
    title: 'Ajustes',
    theme: 'Tema',
    themeAuto: 'Del dispositivo',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    language: 'Idioma',
    languageAuto: (name) => `Del dispositivo (${name})`,
    languageHint: 'Los nombres de tus rutinas quedan como los escribiste.',
    cues: 'Sonido y avisos',
    cuesHint: 'Sonidos de cada fase, voz, vibración y cuenta 3, 2, 1.',
    saveFailed: 'No se pudo guardar la elección. Inténtalo de nuevo.',
  },
};
