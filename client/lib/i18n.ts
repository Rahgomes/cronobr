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
      title: "Algo sali\u00f3 mal",
      message: "Por favor, reinicia CronoBR para continuar.",
      restart: "Reiniciar App",
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
      message: "Veuillez red\u00e9marrer CronoBR pour continuer.",
      restart: "Red\u00e9marrer",
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
