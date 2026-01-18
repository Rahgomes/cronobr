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
      history: "Histórico de Treinos",
      settings: "Configurações",
      soundSettings: "Configurações de Som",
      about: "Sobre",
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
    history: {
      title: "Histórico",
      empty: "Nenhum treino registrado",
      emptySubtitle: "Complete um treino para ver seu histórico aqui",
      clearAll: "Limpar Histórico",
      clearConfirmTitle: "Limpar Histórico",
      clearConfirmMessage: "Tem certeza que deseja apagar todo o histórico? Esta ação não pode ser desfeita.",
      confirmClear: "Apagar",
      cancel: "Cancelar",
      removeOne: {
        title: "Remover Treino",
        message: "Tem certeza que deseja apagar este treino do histórico? Esta ação não pode ser desfeita.",
        confirm: "Apagar",
        cancel: "Cancelar",
      },
      workoutsCount_one: "{{count}} treino registrado",
      workoutsCount_other: "{{count}} treinos registrados",
      statusCompleted: "Completado",
      statusInterrupted: "Interrompido",
      repeatWorkout: "Repetir Treino",
      workoutManual: "Treino Manual",
      durationTotal: "DURAÇÃO TOTAL",
      configuration: "CONFIGURAÇÃO",
      preparation: "Preparação",
      exercise: "Exercício",
      rest: "Descanso",
      rounds: "Rounds",
      loading: "Carregando...",
    },
    relativeTime: {
      today: "Hoje",
      yesterday: "Ontem",
      daysAgo: "há {{count}} dias",
      weeksAgo_one: "há 1 semana",
      weeksAgo_other: "há {{count}} semanas",
      monthsAgo_one: "há 1 mês",
      monthsAgo_other: "há {{count}} meses",
      yearsAgo_one: "há 1 ano",
      yearsAgo_other: "há {{count}} anos",
    },
    months: {
      short: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
      long: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
    },
    speech: {
      preparationStart: "Preparação. Prepare-se.",
      roundStart: "Round {{number}}. Vamos lá!",
      exerciseHalfway: "Metade do exercício.",
      roundEnd: "Fim do round. Descanse.",
      restStart: "Descanso.",
      restEnd: "Prepare-se para o próximo round.",
      workoutCompleted: "Treino completo! Parabéns!",
      workoutInterrupted: "Treino interrompido.",
      countdown5: "Cinco",
      countdown4: "Quatro",
      countdown3: "Três",
      countdown2: "Dois",
      countdown1: "Um",
      settingsTitle: "Configurações de Narração",
      sectionTitle: "Som e Narração",
      enabled: "Ativar Narração",
      enabledDesc: "Narrar eventos durante o treino por voz",
      voiceLanguage: "Idioma da Voz",
      voiceSelection: "Voz",
      selectVoice: "Selecionar Voz",
      volume: "Volume da Narração",
      rate: "Velocidade da Fala",
      pitch: "Tom da Voz",
      testSpeech: "Testar Narração",
      events: "Eventos para Narrar",
      eventPreparationStart: "Início da Preparação",
      eventCountdown: "Contagem Regressiva (5-1)",
      eventRoundStart: "Início do Round",
      eventExerciseHalfway: "Metade do Exercício",
      eventRoundEnd: "Fim do Round",
      eventRestStart: "Início do Descanso",
      eventRestEnd: "Fim do Descanso",
      eventWorkoutCompleted: "Treino Completo",
      eventWorkoutInterrupted: "Treino Interrompido",
      qualityDefault: "Padrão",
      qualityEnhanced: "Aprimorada",
      qualityPremium: "Premium",
      notAvailable: "Narração por voz não disponível neste dispositivo",
      engineUnavailable: "Motor de síntese de voz indisponível",
    },
    home: {
      subtitle: "Escolha sua modalidade de treino",
      quickStart: {
        title: "Início Rápido",
        description: "Configure seu treino manualmente",
      },
      lastWorkout: {
        title: "Último Treino",
        manual: "Treino Manual",
        completed: "Concluído",
        interrupted: "Interrompido",
        repeat: "Repetir Treino",
      },
      modalitiesTitle: "Modalidades",
      modalities: {
        hiit: {
          name: "HIIT / Funcional",
          description: "Alta intensidade em ciclos curtos",
        },
        tabata: {
          name: "Tabata Clássico",
          description: "20s de esforço, 10s de descanso",
        },
        emom: {
          name: "EMOM",
          description: "Um exercício a cada minuto",
        },
        amrap: {
          name: "AMRAP",
          description: "Máximo de repetições possível",
        },
        boxe: {
          name: "Boxe / Rounds",
          description: "Rounds de luta com intervalos",
        },
        mobilidade: {
          name: "Mobilidade",
          description: "Aquecimento e alongamento",
        },
      },
    },
    manualConfig: {
      title: "Configuração Manual",
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
      history: "Workout History",
      settings: "Settings",
      soundSettings: "Sound Settings",
      about: "About",
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
    history: {
      title: "History",
      empty: "No workouts recorded",
      emptySubtitle: "Complete a workout to see your history here",
      clearAll: "Clear History",
      clearConfirmTitle: "Clear History",
      clearConfirmMessage: "Are you sure you want to delete all workout history? This action cannot be undone.",
      confirmClear: "Delete",
      cancel: "Cancel",
      removeOne: {
        title: "Remove Workout",
        message: "Are you sure you want to delete this workout from history? This action cannot be undone.",
        confirm: "Delete",
        cancel: "Cancel",
      },
      workoutsCount_one: "{{count}} workout recorded",
      workoutsCount_other: "{{count}} workouts recorded",
      statusCompleted: "Completed",
      statusInterrupted: "Interrupted",
      repeatWorkout: "Repeat Workout",
      workoutManual: "Manual Workout",
      durationTotal: "TOTAL DURATION",
      configuration: "CONFIGURATION",
      preparation: "Preparation",
      exercise: "Exercise",
      rest: "Rest",
      rounds: "Rounds",
      loading: "Loading...",
    },
    relativeTime: {
      today: "Today",
      yesterday: "Yesterday",
      daysAgo: "{{count}} days ago",
      weeksAgo_one: "1 week ago",
      weeksAgo_other: "{{count}} weeks ago",
      monthsAgo_one: "1 month ago",
      monthsAgo_other: "{{count}} months ago",
      yearsAgo_one: "1 year ago",
      yearsAgo_other: "{{count}} years ago",
    },
    months: {
      short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      long: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    },
    speech: {
      preparationStart: "Preparation. Get ready.",
      roundStart: "Round {{number}}. Let's go!",
      exerciseHalfway: "Halfway through.",
      roundEnd: "Round complete. Rest.",
      restStart: "Rest time.",
      restEnd: "Prepare for next round.",
      workoutCompleted: "Workout complete! Great job!",
      workoutInterrupted: "Workout stopped.",
      countdown5: "Five",
      countdown4: "Four",
      countdown3: "Three",
      countdown2: "Two",
      countdown1: "One",
      settingsTitle: "Voice Narration Settings",
      sectionTitle: "Sound & Narration",
      enabled: "Enable Narration",
      enabledDesc: "Narrate workout events with voice",
      voiceLanguage: "Voice Language",
      voiceSelection: "Voice",
      selectVoice: "Select Voice",
      volume: "Narration Volume",
      rate: "Speech Rate",
      pitch: "Voice Pitch",
      testSpeech: "Test Narration",
      events: "Events to Narrate",
      eventPreparationStart: "Preparation Start",
      eventCountdown: "Countdown (5-1)",
      eventRoundStart: "Round Start",
      eventExerciseHalfway: "Exercise Halfway",
      eventRoundEnd: "Round End",
      eventRestStart: "Rest Start",
      eventRestEnd: "Rest End",
      eventWorkoutCompleted: "Workout Complete",
      eventWorkoutInterrupted: "Workout Interrupted",
      qualityDefault: "Default",
      qualityEnhanced: "Enhanced",
      qualityPremium: "Premium",
      notAvailable: "Voice narration not available on this device",
      engineUnavailable: "Voice synthesis engine unavailable",
    },
    home: {
      subtitle: "Choose your workout modality",
      quickStart: {
        title: "Quick Start",
        description: "Configure your workout manually",
      },
      lastWorkout: {
        title: "Last Workout",
        manual: "Manual Workout",
        completed: "Completed",
        interrupted: "Interrupted",
        repeat: "Repeat Workout",
      },
      modalitiesTitle: "Modalities",
      modalities: {
        hiit: {
          name: "HIIT / Functional",
          description: "High intensity in short cycles",
        },
        tabata: {
          name: "Classic Tabata",
          description: "20s work, 10s rest",
        },
        emom: {
          name: "EMOM",
          description: "One exercise every minute",
        },
        amrap: {
          name: "AMRAP",
          description: "As many reps as possible",
        },
        boxe: {
          name: "Boxing / Rounds",
          description: "Fight rounds with intervals",
        },
        mobilidade: {
          name: "Mobility",
          description: "Warm-up and stretching",
        },
      },
    },
    manualConfig: {
      title: "Manual Configuration",
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
      history: "Historial de Entrenamientos",
      settings: "Configuración",
      soundSettings: "Configuración de Sonido",
      about: "Acerca de",
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
    history: {
      title: "Historial",
      empty: "Ningún entrenamiento registrado",
      emptySubtitle: "Completa un entrenamiento para ver tu historial aquí",
      clearAll: "Borrar Historial",
      clearConfirmTitle: "Borrar Historial",
      clearConfirmMessage: "¿Estás seguro de que deseas eliminar todo el historial? Esta acción no se puede deshacer.",
      confirmClear: "Eliminar",
      cancel: "Cancelar",
      removeOne: {
        title: "Eliminar Entrenamiento",
        message: "¿Estás seguro de que deseas eliminar este entrenamiento del historial? Esta acción no se puede deshacer.",
        confirm: "Eliminar",
        cancel: "Cancelar",
      },
      workoutsCount_one: "{{count}} entrenamiento registrado",
      workoutsCount_other: "{{count}} entrenamientos registrados",
      statusCompleted: "Completado",
      statusInterrupted: "Interrumpido",
      repeatWorkout: "Repetir Entrenamiento",
      workoutManual: "Entrenamiento Manual",
      durationTotal: "DURACIÓN TOTAL",
      configuration: "CONFIGURACIÓN",
      preparation: "Preparación",
      exercise: "Ejercicio",
      rest: "Descanso",
      rounds: "Rondas",
      loading: "Cargando...",
    },
    relativeTime: {
      today: "Hoy",
      yesterday: "Ayer",
      daysAgo: "hace {{count}} días",
      weeksAgo_one: "hace 1 semana",
      weeksAgo_other: "hace {{count}} semanas",
      monthsAgo_one: "hace 1 mes",
      monthsAgo_other: "hace {{count}} meses",
      yearsAgo_one: "hace 1 año",
      yearsAgo_other: "hace {{count}} años",
    },
    months: {
      short: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
      long: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    },
    speech: {
      preparationStart: "Preparación. Prepárate.",
      roundStart: "Ronda {{number}}. ¡Vamos!",
      exerciseHalfway: "Mitad del ejercicio.",
      roundEnd: "Fin de la ronda. Descansa.",
      restStart: "Descanso.",
      restEnd: "Prepárate para la siguiente ronda.",
      workoutCompleted: "¡Entrenamiento completo! ¡Felicidades!",
      workoutInterrupted: "Entrenamiento interrumpido.",
      countdown5: "Cinco",
      countdown4: "Cuatro",
      countdown3: "Tres",
      countdown2: "Dos",
      countdown1: "Uno",
      settingsTitle: "Configuración de Narración",
      sectionTitle: "Sonido y Narración",
      enabled: "Activar Narración",
      enabledDesc: "Narrar eventos durante el entrenamiento por voz",
      voiceLanguage: "Idioma de Voz",
      voiceSelection: "Voz",
      selectVoice: "Seleccionar Voz",
      volume: "Volumen de Narración",
      rate: "Velocidad de Habla",
      pitch: "Tono de Voz",
      testSpeech: "Probar Narración",
      events: "Eventos para Narrar",
      eventPreparationStart: "Inicio de Preparación",
      eventCountdown: "Cuenta Regresiva (5-1)",
      eventRoundStart: "Inicio de Ronda",
      eventExerciseHalfway: "Mitad del Ejercicio",
      eventRoundEnd: "Fin de Ronda",
      eventRestStart: "Inicio de Descanso",
      eventRestEnd: "Fin de Descanso",
      eventWorkoutCompleted: "Entrenamiento Completo",
      eventWorkoutInterrupted: "Entrenamiento Interrumpido",
      qualityDefault: "Predeterminada",
      qualityEnhanced: "Mejorada",
      qualityPremium: "Premium",
      notAvailable: "Narración por voz no disponible en este dispositivo",
      engineUnavailable: "Motor de síntesis de voz no disponible",
    },
    home: {
      subtitle: "Elige tu modalidad de entrenamiento",
      quickStart: {
        title: "Inicio Rápido",
        description: "Configura tu entrenamiento manualmente",
      },
      lastWorkout: {
        title: "Último Entrenamiento",
        manual: "Entrenamiento Manual",
        completed: "Completado",
        interrupted: "Interrumpido",
        repeat: "Repetir Entrenamiento",
      },
      modalitiesTitle: "Modalidades",
      modalities: {
        hiit: {
          name: "HIIT / Funcional",
          description: "Alta intensidad en ciclos cortos",
        },
        tabata: {
          name: "Tabata Clásico",
          description: "20s esfuerzo, 10s descanso",
        },
        emom: {
          name: "EMOM",
          description: "Un ejercicio cada minuto",
        },
        amrap: {
          name: "AMRAP",
          description: "Máximas repeticiones posibles",
        },
        boxe: {
          name: "Boxeo / Rounds",
          description: "Rounds de combate con intervalos",
        },
        mobilidade: {
          name: "Movilidad",
          description: "Calentamiento y estiramiento",
        },
      },
    },
    manualConfig: {
      title: "Configuración Manual",
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
      history: "Historique des Entraînements",
      settings: "Paramètres",
      soundSettings: "Paramètres Audio",
      about: "À Propos",
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
    history: {
      title: "Historique",
      empty: "Aucun entraînement enregistré",
      emptySubtitle: "Complétez un entraînement pour voir votre historique ici",
      clearAll: "Effacer l'Historique",
      clearConfirmTitle: "Effacer l'Historique",
      clearConfirmMessage: "Êtes-vous sûr de vouloir supprimer tout l'historique? Cette action ne peut pas être annulée.",
      confirmClear: "Supprimer",
      cancel: "Annuler",
      removeOne: {
        title: "Supprimer l'entraînement",
        message: "Êtes-vous sûr de vouloir supprimer cet entraînement de l'historique ? Cette action est irréversible.",
        confirm: "Supprimer",
        cancel: "Annuler",
      },
      workoutsCount_one: "{{count}} entraînement enregistré",
      workoutsCount_other: "{{count}} entraînements enregistrés",
      statusCompleted: "Terminé",
      statusInterrupted: "Interrompu",
      repeatWorkout: "Répéter l'Entraînement",
      workoutManual: "Entraînement Manuel",
      durationTotal: "DURÉE TOTALE",
      configuration: "CONFIGURATION",
      preparation: "Préparation",
      exercise: "Exercice",
      rest: "Repos",
      rounds: "Rounds",
      loading: "Chargement...",
    },
    relativeTime: {
      today: "Aujourd'hui",
      yesterday: "Hier",
      daysAgo: "il y a {{count}} jours",
      weeksAgo_one: "il y a 1 semaine",
      weeksAgo_other: "il y a {{count}} semaines",
      monthsAgo_one: "il y a 1 mois",
      monthsAgo_other: "il y a {{count}} mois",
      yearsAgo_one: "il y a 1 an",
      yearsAgo_other: "il y a {{count}} ans",
    },
    months: {
      short: ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"],
      long: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
    },
    speech: {
      preparationStart: "Préparation. Préparez-vous.",
      roundStart: "Round {{number}}. Allons-y!",
      exerciseHalfway: "Mi-exercice.",
      roundEnd: "Fin du round. Reposez-vous.",
      restStart: "Repos.",
      restEnd: "Préparez-vous pour le prochain round.",
      workoutCompleted: "Entraînement terminé! Bravo!",
      workoutInterrupted: "Entraînement interrompu.",
      countdown5: "Cinq",
      countdown4: "Quatre",
      countdown3: "Trois",
      countdown2: "Deux",
      countdown1: "Un",
      settingsTitle: "Paramètres de Narration",
      sectionTitle: "Son et Narration",
      enabled: "Activer la Narration",
      enabledDesc: "Narrer les événements pendant l'entraînement par voix",
      voiceLanguage: "Langue de la Voix",
      voiceSelection: "Voix",
      selectVoice: "Sélectionner la Voix",
      volume: "Volume de Narration",
      rate: "Vitesse de Parole",
      pitch: "Ton de la Voix",
      testSpeech: "Tester la Narration",
      events: "Événements à Narrer",
      eventPreparationStart: "Début de Préparation",
      eventCountdown: "Compte à Rebours (5-1)",
      eventRoundStart: "Début du Round",
      eventExerciseHalfway: "Mi-Exercice",
      eventRoundEnd: "Fin du Round",
      eventRestStart: "Début du Repos",
      eventRestEnd: "Fin du Repos",
      eventWorkoutCompleted: "Entraînement Terminé",
      eventWorkoutInterrupted: "Entraînement Interrompu",
      qualityDefault: "Par Défaut",
      qualityEnhanced: "Améliorée",
      qualityPremium: "Premium",
      notAvailable: "Narration vocale non disponible sur cet appareil",
      engineUnavailable: "Moteur de synthèse vocale indisponible",
    },
    home: {
      subtitle: "Choisissez votre modalité d'entraînement",
      quickStart: {
        title: "Démarrage Rapide",
        description: "Configurez votre entraînement manuellement",
      },
      lastWorkout: {
        title: "Dernier Entraînement",
        manual: "Entraînement Manuel",
        completed: "Terminé",
        interrupted: "Interrompu",
        repeat: "Répéter l'Entraînement",
      },
      modalitiesTitle: "Modalités",
      modalities: {
        hiit: {
          name: "HIIT / Fonctionnel",
          description: "Haute intensité en cycles courts",
        },
        tabata: {
          name: "Tabata Classique",
          description: "20s effort, 10s repos",
        },
        emom: {
          name: "EMOM",
          description: "Un exercice chaque minute",
        },
        amrap: {
          name: "AMRAP",
          description: "Maximum de répétitions possible",
        },
        boxe: {
          name: "Boxe / Rounds",
          description: "Rounds de combat avec intervalles",
        },
        mobilidade: {
          name: "Mobilité",
          description: "Échauffement et étirement",
        },
      },
    },
    manualConfig: {
      title: "Configuration Manuelle",
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
