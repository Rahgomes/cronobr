import { getSettings, saveSettings } from "./storage";
import { NativeModules, Platform } from "react-native";

export type Language = "pt-BR" | "en" | "es" | "fr";

export const translations = {
  "pt-BR": {
    common: {
      save: "Salvar",
      cancel: "Cancelar",
      start: "INICIAR",
      pause: "PAUSAR",
      resume: "CONTINUAR",
      stop: "PARAR",
      finish: "FINALIZAR",
      back: "Voltar",
      settings: "Configura\u00e7\u00f5es",
      profile: "Perfil",
    },
    timerConfig: {
      title: "Cron\u00f4BR",
      subtitle: "Seu parceiro de treino",
      estimatedTime: "Tempo total estimado",
      preparation: "Prepara\u00e7\u00e3o",
      exercise: "Exerc\u00edcio",
      rest: "Descanso",
      rounds: "Rounds",
    },
    activeTimer: {
      round: "Round",
      of: "de",
      preparation: "Prepara\u00e7\u00e3o",
      exercise: "Exerc\u00edcio",
      rest: "Descanso",
      completed: "Treino Completo!",
      congratulations: "Parab\u00e9ns pelo esfor\u00e7o!",
      close: "Fechar",
    },
    settings: {
      title: "Configura\u00e7\u00f5es",
      preferences: "PREFER\u00caNCIAS",
      sound: "Som",
      soundDescription: "Alertas sonoros durante o treino",
      vibration: "Vibra\u00e7\u00e3o",
      vibrationDescription: "Feedback t\u00e1til durante o treino",
      appearance: "APAR\u00caNCIA",
      language: "Idioma",
      theme: "Tema",
      themeSystem: "Sistema",
      themeLight: "Claro",
      themeDark: "Escuro",
      account: "CONTA",
      editProfile: "Editar Perfil",
    },
    profile: {
      title: "Perfil",
      avatar: "AVATAR",
      name: "NOME",
      namePlaceholder: "Digite seu nome",
      athlete: "Atleta",
    },
    languages: {
      "pt-BR": "Portugu\u00eas (Brasil)",
      en: "English",
      es: "Espa\u00f1ol",
      fr: "Fran\u00e7ais",
    },
    time: {
      seconds: "seg",
      minutes: "min",
    },
    error: {
      title: "Algo deu errado",
      message: "Por favor, reinicie o Cron\u00f4BR para continuar.",
      restart: "Reiniciar App",
    },
    soundSettings: {
      title: "Configurações de Som",
      countdown: "Contagem Regressiva",
      countdownDesc: "Últimos 5 segundos",
      roundStart: "Início do Round",
      roundStartDesc: "Quando o round começa",
      roundEnd: "Fim do Round",
      roundEndDesc: "Quando o round termina",
      halfway: "Metade do Round",
      halfwayDesc: "Na metade do exercício",
      beforeEnd: "Antes do Fim",
      beforeEndDesc: "Segundos antes do fim",
      volume: "Volume",
      testSound: "Testar Som",
      noSound: "Sem Som",
      sound1: "Som 1",
      sound2: "Som 2",
      sound3: "Som 3",
      secondsBefore: "segundos antes",
    },
    vibration: {
      none: "Sem Vibração",
      short: "Curta",
      long: "Longa",
      pulsed: "Pulsada",
      test: "Testar Vibração",
      noneDescription: "Nenhum feedback tátil",
      shortDescription: "Vibração rápida e sutil",
      longDescription: "Vibração intensa e prolongada",
      pulsedDescription: "Duas vibrações rápidas",
      selectPattern: "Selecionar Padrão de Vibração",
    },
    advancedSettings: {
      title: "Configurações Avançadas",
      info: "Estas configurações afetam o comportamento do timer durante o treino. O modo silencioso prioriza vibração quando o volume está zerado. A trava de tela mantém a tela ligada e pode exigir duplo toque para pausar.",
    },
    silentMode: {
      title: "MODO SILENCIOSO",
      active: "Modo Silencioso Ativo",
      description: "Sons desabilitados, prioridade para vibração",
      autoDetect: "Modo Silencioso Automático",
      autoDetectDescription: "Detecta automaticamente quando volume está zerado",
    },
    screenLock: {
      title: "TRAVA DE TELA",
      enabled: "Trava de Tela",
      description: "Mantém a tela ligada durante o treino",
      preventTouch: "Prevenir Toques Acidentais",
      preventTouchDescription: "Requer duplo toque para pausar o timer",
      doubleTapHint: "Toque novamente para pausar",
    },
    simulation: {
      title: "Simulação do Treino",
      play: "Reproduzir",
      pause: "Pausar",
      reset: "Reiniciar",
      speed: "Velocidade: 10x",
    },
    preview: {
      title: "Pré-visualização",
      totalTime: "Tempo Total",
      prep: "Preparação",
      exercise: "Exercício",
      rest: "Descanso",
      round: "Round",
      viewSimulation: "Ver Simulação Interativa",
      summary: "Resumo da Sessão",
    },
    menu: {
      soundSettings: "Configurações de Som",
      preview: "Pré-visualizar Treino",
      advancedSettings: "Configurações Avançadas",
      profiles: "Perfis de Treino",
    },
    profiles: {
      title: "Perfis de Treino",
      selectProfile: "Escolha um perfil ou configure manualmente",
      categories: {
        emom: "EMOM",
        amrap: "AMRAP",
        hiit: "HIIT Intenso",
        tabata: "Tabata Clássico",
        boxe: "Boxe Suave",
        circuito: "Circuito Ágil",
      },
    },
  },
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      start: "START",
      pause: "PAUSE",
      resume: "RESUME",
      stop: "STOP",
      finish: "FINISH",
      back: "Back",
      settings: "Settings",
      profile: "Profile",
    },
    timerConfig: {
      title: "CronoBR",
      subtitle: "Your workout partner",
      estimatedTime: "Estimated total time",
      preparation: "Preparation",
      exercise: "Exercise",
      rest: "Rest",
      rounds: "Rounds",
    },
    activeTimer: {
      round: "Round",
      of: "of",
      preparation: "Preparation",
      exercise: "Exercise",
      rest: "Rest",
      completed: "Workout Complete!",
      congratulations: "Great job on your workout!",
      close: "Close",
    },
    settings: {
      title: "Settings",
      preferences: "PREFERENCES",
      sound: "Sound",
      soundDescription: "Sound alerts during workout",
      vibration: "Vibration",
      vibrationDescription: "Haptic feedback during workout",
      appearance: "APPEARANCE",
      language: "Language",
      theme: "Theme",
      themeSystem: "System",
      themeLight: "Light",
      themeDark: "Dark",
      account: "ACCOUNT",
      editProfile: "Edit Profile",
    },
    profile: {
      title: "Profile",
      avatar: "AVATAR",
      name: "NAME",
      namePlaceholder: "Enter your name",
      athlete: "Athlete",
    },
    languages: {
      "pt-BR": "Portuguese (Brazil)",
      en: "English",
      es: "Spanish",
      fr: "French",
    },
    time: {
      seconds: "sec",
      minutes: "min",
    },
    error: {
      title: "Something went wrong",
      message: "Please restart CronoBR to continue.",
      restart: "Restart App",
    },
    soundSettings: {
      title: "Sound Settings",
      countdown: "Countdown",
      countdownDesc: "Last 5 seconds",
      roundStart: "Round Start",
      roundStartDesc: "When the round begins",
      roundEnd: "Round End",
      roundEndDesc: "When the round ends",
      halfway: "Halfway",
      halfwayDesc: "At exercise midpoint",
      beforeEnd: "Before End",
      beforeEndDesc: "Seconds before end",
      volume: "Volume",
      testSound: "Test Sound",
      noSound: "No Sound",
      sound1: "Sound 1",
      sound2: "Sound 2",
      sound3: "Sound 3",
      secondsBefore: "seconds before",
    },
    vibration: {
      none: "No Vibration",
      short: "Short",
      long: "Long",
      pulsed: "Pulsed",
      test: "Test Vibration",
      noneDescription: "No haptic feedback",
      shortDescription: "Quick and subtle vibration",
      longDescription: "Intense and prolonged vibration",
      pulsedDescription: "Two quick vibrations",
      selectPattern: "Select Vibration Pattern",
    },
    advancedSettings: {
      title: "Advanced Settings",
      info: "These settings affect timer behavior during workout. Silent mode prioritizes vibration when volume is zero. Screen lock keeps the screen on and can require double tap to pause.",
    },
    silentMode: {
      title: "SILENT MODE",
      active: "Silent Mode Active",
      description: "Sounds disabled, vibration prioritized",
      autoDetect: "Auto Silent Mode",
      autoDetectDescription: "Automatically detects when volume is zero",
    },
    screenLock: {
      title: "SCREEN LOCK",
      enabled: "Screen Lock",
      description: "Keeps screen on during workout",
      preventTouch: "Prevent Accidental Touch",
      preventTouchDescription: "Requires double tap to pause timer",
      doubleTapHint: "Tap again to pause",
    },
    simulation: {
      title: "Workout Simulation",
      play: "Play",
      pause: "Pause",
      reset: "Reset",
      speed: "Speed: 10x",
    },
    preview: {
      title: "Preview",
      totalTime: "Total Time",
      prep: "Preparation",
      exercise: "Exercise",
      rest: "Rest",
      round: "Round",
      viewSimulation: "View Interactive Simulation",
      summary: "Session Summary",
    },
    menu: {
      soundSettings: "Sound Settings",
      preview: "Preview Workout",
      advancedSettings: "Advanced Settings",
      profiles: "Workout Profiles",
    },
    profiles: {
      title: "Workout Profiles",
      selectProfile: "Choose a profile or configure manually",
      categories: {
        emom: "EMOM",
        amrap: "AMRAP",
        hiit: "Intense HIIT",
        tabata: "Classic Tabata",
        boxe: "Smooth Boxing",
        circuito: "Agile Circuit",
      },
    },
  },
  es: {
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      start: "INICIAR",
      pause: "PAUSAR",
      resume: "CONTINUAR",
      stop: "PARAR",
      finish: "FINALIZAR",
      back: "Volver",
      settings: "Configuraci\u00f3n",
      profile: "Perfil",
    },
    timerConfig: {
      title: "CronoBR",
      subtitle: "Tu compa\u00f1ero de entrenamiento",
      estimatedTime: "Tiempo total estimado",
      preparation: "Preparaci\u00f3n",
      exercise: "Ejercicio",
      rest: "Descanso",
      rounds: "Rondas",
    },
    activeTimer: {
      round: "Ronda",
      of: "de",
      preparation: "Preparaci\u00f3n",
      exercise: "Ejercicio",
      rest: "Descanso",
      completed: "\u00a1Entrenamiento Completo!",
      congratulations: "\u00a1Felicidades por tu esfuerzo!",
      close: "Cerrar",
    },
    settings: {
      title: "Configuraci\u00f3n",
      preferences: "PREFERENCIAS",
      sound: "Sonido",
      soundDescription: "Alertas de sonido durante el entrenamiento",
      vibration: "Vibraci\u00f3n",
      vibrationDescription: "Feedback t\u00e1ctil durante el entrenamiento",
      appearance: "APARIENCIA",
      language: "Idioma",
      theme: "Tema",
      themeSystem: "Sistema",
      themeLight: "Claro",
      themeDark: "Oscuro",
      account: "CUENTA",
      editProfile: "Editar Perfil",
    },
    profile: {
      title: "Perfil",
      avatar: "AVATAR",
      name: "NOMBRE",
      namePlaceholder: "Ingresa tu nombre",
      athlete: "Atleta",
    },
    languages: {
      "pt-BR": "Portugu\u00e9s (Brasil)",
      en: "Ingl\u00e9s",
      es: "Espa\u00f1ol",
      fr: "Franc\u00e9s",
    },
    time: {
      seconds: "seg",
      minutes: "min",
    },
    error: {
      title: "Algo salió mal",
      message: "Por favor, reinicia CronoBR para continuar.",
      restart: "Reiniciar App",
    },
    soundSettings: {
      title: "Configuración de Sonido",
      countdown: "Cuenta Regresiva",
      countdownDesc: "Últimos 5 segundos",
      roundStart: "Inicio de Ronda",
      roundStartDesc: "Cuando comienza la ronda",
      roundEnd: "Fin de Ronda",
      roundEndDesc: "Cuando termina la ronda",
      halfway: "Mitad de Ronda",
      halfwayDesc: "En la mitad del ejercicio",
      beforeEnd: "Antes del Fin",
      beforeEndDesc: "Segundos antes del fin",
      volume: "Volumen",
      testSound: "Probar Sonido",
      noSound: "Sin Sonido",
      sound1: "Sonido 1",
      sound2: "Sonido 2",
      sound3: "Sonido 3",
      secondsBefore: "segundos antes",
    },
    vibration: {
      none: "Sin Vibración",
      short: "Corta",
      long: "Larga",
      pulsed: "Pulsada",
      test: "Probar Vibración",
      noneDescription: "Sin feedback háptico",
      shortDescription: "Vibración rápida y sutil",
      longDescription: "Vibración intensa y prolongada",
      pulsedDescription: "Dos vibraciones rápidas",
      selectPattern: "Seleccionar Patrón de Vibración",
    },
    advancedSettings: {
      title: "Configuración Avanzada",
      info: "Estas configuraciones afectan el comportamiento del temporizador durante el entrenamiento. El modo silencioso prioriza la vibración cuando el volumen es cero. El bloqueo de pantalla mantiene la pantalla encendida y puede requerir doble toque para pausar.",
    },
    silentMode: {
      title: "MODO SILENCIOSO",
      active: "Modo Silencioso Activo",
      description: "Sonidos deshabilitados, vibración priorizada",
      autoDetect: "Modo Silencioso Automático",
      autoDetectDescription: "Detecta automáticamente cuando el volumen es cero",
    },
    screenLock: {
      title: "BLOQUEO DE PANTALLA",
      enabled: "Bloqueo de Pantalla",
      description: "Mantiene la pantalla encendida durante el entrenamiento",
      preventTouch: "Prevenir Toques Accidentales",
      preventTouchDescription: "Requiere doble toque para pausar el temporizador",
      doubleTapHint: "Toca nuevamente para pausar",
    },
    simulation: {
      title: "Simulación del Entrenamiento",
      play: "Reproducir",
      pause: "Pausar",
      reset: "Reiniciar",
      speed: "Velocidad: 10x",
    },
    preview: {
      title: "Vista Previa",
      totalTime: "Tiempo Total",
      prep: "Preparación",
      exercise: "Ejercicio",
      rest: "Descanso",
      round: "Ronda",
      viewSimulation: "Ver Simulación Interactiva",
      summary: "Resumen de la Sesión",
    },
    menu: {
      soundSettings: "Configuración de Sonido",
      preview: "Vista Previa del Entrenamiento",
      advancedSettings: "Configuración Avanzada",
      profiles: "Perfiles de Entrenamiento",
    },
    profiles: {
      title: "Perfiles de Entrenamiento",
      selectProfile: "Elige un perfil o configura manualmente",
      categories: {
        emom: "EMOM",
        amrap: "AMRAP",
        hiit: "HIIT Intenso",
        tabata: "Tabata Clásico",
        boxe: "Boxeo Suave",
        circuito: "Circuito Ágil",
      },
    },
  },
  fr: {
    common: {
      save: "Sauvegarder",
      cancel: "Annuler",
      start: "D\u00c9MARRER",
      pause: "PAUSE",
      resume: "REPRENDRE",
      stop: "ARR\u00caTER",
      finish: "TERMINER",
      back: "Retour",
      settings: "Param\u00e8tres",
      profile: "Profil",
    },
    timerConfig: {
      title: "CronoBR",
      subtitle: "Votre partenaire d'entra\u00eenement",
      estimatedTime: "Temps total estim\u00e9",
      preparation: "Pr\u00e9paration",
      exercise: "Exercice",
      rest: "Repos",
      rounds: "Rounds",
    },
    activeTimer: {
      round: "Round",
      of: "sur",
      preparation: "Pr\u00e9paration",
      exercise: "Exercice",
      rest: "Repos",
      completed: "Entra\u00eenement Termin\u00e9!",
      congratulations: "F\u00e9licitations pour vos efforts!",
      close: "Fermer",
    },
    settings: {
      title: "Param\u00e8tres",
      preferences: "PR\u00c9F\u00c9RENCES",
      sound: "Son",
      soundDescription: "Alertes sonores pendant l'entra\u00eenement",
      vibration: "Vibration",
      vibrationDescription: "Retour haptique pendant l'entra\u00eenement",
      appearance: "APPARENCE",
      language: "Langue",
      theme: "Th\u00e8me",
      themeSystem: "Syst\u00e8me",
      themeLight: "Clair",
      themeDark: "Sombre",
      account: "COMPTE",
      editProfile: "Modifier le Profil",
    },
    profile: {
      title: "Profil",
      avatar: "AVATAR",
      name: "NOM",
      namePlaceholder: "Entrez votre nom",
      athlete: "Athl\u00e8te",
    },
    languages: {
      "pt-BR": "Portugais (Br\u00e9sil)",
      en: "Anglais",
      es: "Espagnol",
      fr: "Fran\u00e7ais",
    },
    time: {
      seconds: "sec",
      minutes: "min",
    },
    error: {
      title: "Une erreur s'est produite",
      message: "Veuillez redémarrer CronoBR pour continuer.",
      restart: "Redémarrer",
    },
    soundSettings: {
      title: "Paramètres Audio",
      countdown: "Compte à Rebours",
      countdownDesc: "Dernières 5 secondes",
      roundStart: "Début du Round",
      roundStartDesc: "Quand le round commence",
      roundEnd: "Fin du Round",
      roundEndDesc: "Quand le round se termine",
      halfway: "Mi-parcours",
      halfwayDesc: "À la moitié de l'exercice",
      beforeEnd: "Avant la Fin",
      beforeEndDesc: "Secondes avant la fin",
      volume: "Volume",
      testSound: "Tester le Son",
      noSound: "Sans Son",
      sound1: "Son 1",
      sound2: "Son 2",
      sound3: "Son 3",
      secondsBefore: "secondes avant",
    },
    vibration: {
      none: "Sans Vibration",
      short: "Courte",
      long: "Longue",
      pulsed: "Pulsée",
      test: "Tester la Vibration",
      noneDescription: "Aucun retour haptique",
      shortDescription: "Vibration rapide et subtile",
      longDescription: "Vibration intense et prolongée",
      pulsedDescription: "Deux vibrations rapides",
      selectPattern: "Sélectionner le Modèle de Vibration",
    },
    advancedSettings: {
      title: "Paramètres Avancés",
      info: "Ces paramètres affectent le comportement du minuteur pendant l'entraînement. Le mode silencieux priorise la vibration quand le volume est à zéro. Le verrouillage d'écran garde l'écran allumé et peut nécessiter un double toucher pour mettre en pause.",
    },
    silentMode: {
      title: "MODE SILENCIEUX",
      active: "Mode Silencieux Actif",
      description: "Sons désactivés, vibration priorisée",
      autoDetect: "Mode Silencieux Automatique",
      autoDetectDescription: "Détecte automatiquement quand le volume est à zéro",
    },
    screenLock: {
      title: "VERROUILLAGE D'ÉCRAN",
      enabled: "Verrouillage d'Écran",
      description: "Garde l'écran allumé pendant l'entraînement",
      preventTouch: "Prévenir les Touches Accidentelles",
      preventTouchDescription: "Nécessite un double toucher pour mettre en pause le minuteur",
      doubleTapHint: "Touchez à nouveau pour mettre en pause",
    },
    simulation: {
      title: "Simulation d'Entraînement",
      play: "Lecture",
      pause: "Pause",
      reset: "Réinitialiser",
      speed: "Vitesse: 10x",
    },
    preview: {
      title: "Aperçu",
      totalTime: "Temps Total",
      prep: "Préparation",
      exercise: "Exercice",
      rest: "Repos",
      round: "Round",
      viewSimulation: "Voir la Simulation Interactive",
      summary: "Résumé de la Séance",
    },
    menu: {
      soundSettings: "Paramètres Audio",
      preview: "Aperçu de l'Entraînement",
      advancedSettings: "Paramètres Avancés",
      profiles: "Profils d'Entraînement",
    },
    profiles: {
      title: "Profils d'Entraînement",
      selectProfile: "Choisissez un profil ou configurez manuellement",
      categories: {
        emom: "EMOM",
        amrap: "AMRAP",
        hiit: "HIIT Intense",
        tabata: "Tabata Classique",
        boxe: "Boxe Douce",
        circuito: "Circuit Agile",
      },
    },
  },
};

export type TranslationKeys = typeof translations["pt-BR"];

export function getDeviceLanguage(): Language {
  try {
    let locale = "pt-BR";
    
    if (Platform.OS === "ios") {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale ||
               NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
               "pt-BR";
    } else if (Platform.OS === "android") {
      locale = NativeModules.I18nManager?.localeIdentifier || "pt-BR";
    } else {
      locale = typeof navigator !== "undefined" ? navigator.language : "pt-BR";
    }
    
    if (locale.startsWith("pt")) return "pt-BR";
    if (locale.startsWith("en")) return "en";
    if (locale.startsWith("es")) return "es";
    if (locale.startsWith("fr")) return "fr";
    
    return "pt-BR";
  } catch {
    return "pt-BR";
  }
}

export function t(language: Language, path: string): string {
  const keys = path.split(".");
  let result: unknown = translations[language];
  
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      const fallback = translations["pt-BR"];
      let fallbackResult: unknown = fallback;
      for (const k of keys) {
        if (fallbackResult && typeof fallbackResult === "object" && k in fallbackResult) {
          fallbackResult = (fallbackResult as Record<string, unknown>)[k];
        } else {
          return path;
        }
      }
      return String(fallbackResult);
    }
  }
  
  return String(result);
}

export function formatTime(seconds: number, language: Language): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  const translations_local = translations[language].time;
  
  if (mins > 0) {
    return secs > 0 
      ? `${mins}${translations_local.minutes} ${secs}${translations_local.seconds}` 
      : `${mins}${translations_local.minutes}`;
  }
  return `${secs}${translations_local.seconds}`;
}

export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  
  if (!trimmed) return null;
  
  const colonMatch = trimmed.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (colonMatch) {
    const minutes = parseFloat(colonMatch[1]);
    const seconds = parseFloat(colonMatch[2]);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      return Math.round(minutes * 60 + seconds);
    }
  }
  
  const minuteMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*m(?:in)?$/);
  if (minuteMatch) {
    const minutes = parseFloat(minuteMatch[1]);
    if (!isNaN(minutes)) {
      return Math.round(minutes * 60);
    }
  }
  
  const secondMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*s(?:ec)?$/);
  if (secondMatch) {
    const seconds = parseFloat(secondMatch[1]);
    if (!isNaN(seconds)) {
      return Math.round(seconds);
    }
  }
  
  const numericMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  if (numericMatch) {
    const value = parseFloat(numericMatch[1]);
    if (!isNaN(value)) {
      return Math.round(value);
    }
  }
  
  return null;
}
