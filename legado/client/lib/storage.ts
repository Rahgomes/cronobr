import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateUUID } from "@/utils/uuid";

const STORAGE_KEYS = {
  SETTINGS: "@cronobr/settings",
  PROFILE: "@cronobr/profile",
  TIMER_CONFIG: "@cronobr/timer_config",
  SOUND_SETTINGS: "@cronobr/sound_settings",
  APP_PREFERENCES: "@cronobr/app_preferences",
  WORKOUT_PROFILES: "@cronobr/workout_profiles",
  ACTIVE_PROFILE_ID: "@cronobr/active_profile_id",
  WORKOUT_HISTORY: "@cronobr/workout_history",
  VIEW_MODE: "@cronobr/view_mode",
  SPEECH_SETTINGS: "@cronobr/speech_settings",
};

const MAX_HISTORY_ENTRIES = 100;

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  language: "pt-BR" | "en" | "es" | "fr";
  theme: "system" | "light" | "dark";
}

export interface Profile {
  name: string;
  avatarIndex: number;
}

export interface TimerConfig {
  prepTime: number;
  exerciseTime: number;
  restTime: number;
  rounds: number;
}

export type SoundType = "none" | "beep1" | "beep2" | "beep3";

export type VibrationPattern = "none" | "short" | "long" | "pulsed";

export interface SoundSettings {
  countdownSound: SoundType;
  roundStartSound: SoundType;
  roundEndSound: SoundType;
  halfwaySound: SoundType;
  beforeEndSound: SoundType;
  beforeEndSeconds: number;
  volume: number;
  // Padrões de vibração por categoria
  countdownVibration: VibrationPattern;
  roundStartVibration: VibrationPattern;
  roundEndVibration: VibrationPattern;
  halfwayVibration: VibrationPattern;
  beforeEndVibration: VibrationPattern;
}

export interface AppPreferences {
  silentModeEnabled: boolean;
  screenLockEnabled: boolean;
  preventAccidentalTouch: boolean;
}

export type WorkoutCategory = "EMOM" | "AMRAP" | "HIIT" | "TABATA" | "BOXE" | "CIRCUITO";

export interface WorkoutProfile {
  id: string;
  category: WorkoutCategory;
  name: string;
  description: string;
  config: TimerConfig;
  isBuiltIn: boolean;
}

export interface WorkoutHistoryEntry {
  id: string;
  timestamp: number;
  date: string;
  duration: number;
  type: "preset" | "manual";
  presetName?: string;
  presetCategory?: WorkoutCategory;
  config: TimerConfig;
  completedRounds: number;
  totalRounds: number;
  wasInterrupted: boolean;
}

// TTS event types that can be narrated
export type SpeechEvent =
  | "preparationStart"
  | "countdown"
  | "roundStart"
  | "exerciseHalfway"
  | "roundEnd"
  | "restStart"
  | "restEnd"
  | "workoutCompleted"
  | "workoutInterrupted";

export interface SpeechSettings {
  enabled: boolean;
  voiceLanguage: string; // e.g., "pt-BR", "en-US"
  voiceId: string | null; // Specific voice identifier (null = auto-select)
  volume: number; // 0-100
  rate: number; // 0.5-2.0 (speech speed, 1.0 = normal)
  pitch: number; // 0.5-2.0 (voice pitch, 1.0 = normal)
  enabledEvents: Record<SpeechEvent, boolean>;
}

const defaultSettings: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  language: "pt-BR",
  theme: "system",
};

const defaultProfile: Profile = {
  name: "Atleta",
  avatarIndex: 0,
};

const defaultTimerConfig: TimerConfig = {
  prepTime: 10,
  exerciseTime: 30,
  restTime: 15,
  rounds: 5,
};

const defaultSoundSettings: SoundSettings = {
  countdownSound: "beep1",
  roundStartSound: "beep2",
  roundEndSound: "beep3",
  halfwaySound: "none",
  beforeEndSound: "none",
  beforeEndSeconds: 10,
  volume: 80,
  countdownVibration: "short",
  roundStartVibration: "long",
  roundEndVibration: "long",
  halfwayVibration: "short",
  beforeEndVibration: "pulsed",
};

const defaultAppPreferences: AppPreferences = {
  silentModeEnabled: false,
  screenLockEnabled: true,
  preventAccidentalTouch: false,
};

const defaultSpeechSettings: SpeechSettings = {
  enabled: false, // Disabled by default (user must opt-in)
  voiceLanguage: "pt-BR", // Match app language initially
  voiceId: null, // Auto-select best voice for language
  volume: 80, // 80% volume
  rate: 1.0, // Normal speed
  pitch: 1.0, // Normal pitch
  enabledEvents: {
    preparationStart: true,
    countdown: true,
    roundStart: true,
    exerciseHalfway: false, // Disabled by default (per user preference - only for rounds ≥30s)
    roundEnd: true,
    restStart: true,
    restEnd: false, // Redundant with roundStart
    workoutCompleted: true,
    workoutInterrupted: true,
  },
};

const BUILTIN_PROFILES: WorkoutProfile[] = [
  // EMOM
  {
    id: "emom-15s",
    category: "EMOM",
    name: "EMOM 15s",
    description: "15s exercício, 45s descanso",
    config: { prepTime: 10, exerciseTime: 15, restTime: 45, rounds: 10 },
    isBuiltIn: true,
  },
  {
    id: "emom-30s",
    category: "EMOM",
    name: "EMOM 30s",
    description: "30s exercício, 30s descanso",
    config: { prepTime: 10, exerciseTime: 30, restTime: 30, rounds: 8 },
    isBuiltIn: true,
  },
  {
    id: "emom-45s",
    category: "EMOM",
    name: "EMOM 45s",
    description: "45s exercício, 15s descanso",
    config: { prepTime: 10, exerciseTime: 45, restTime: 15, rounds: 6 },
    isBuiltIn: true,
  },
  // AMRAP
  {
    id: "amrap-quick",
    category: "AMRAP",
    name: "AMRAP Rápido",
    description: "20s máximo, 10s pausa",
    config: { prepTime: 10, exerciseTime: 20, restTime: 10, rounds: 12 },
    isBuiltIn: true,
  },
  {
    id: "amrap-intense",
    category: "AMRAP",
    name: "AMRAP Intenso",
    description: "40s máximo, 20s pausa",
    config: { prepTime: 10, exerciseTime: 40, restTime: 20, rounds: 8 },
    isBuiltIn: true,
  },
  // HIIT Intenso
  {
    id: "hiit-sprint",
    category: "HIIT",
    name: "HIIT Sprint",
    description: "30s explosão, 30s recuperação",
    config: { prepTime: 15, exerciseTime: 30, restTime: 30, rounds: 10 },
    isBuiltIn: true,
  },
  {
    id: "hiit-power",
    category: "HIIT",
    name: "HIIT Power",
    description: "20s máximo, 40s ativo",
    config: { prepTime: 15, exerciseTime: 20, restTime: 40, rounds: 8 },
    isBuiltIn: true,
  },
  // Tabata Clássico
  {
    id: "tabata-classic",
    category: "TABATA",
    name: "Tabata Clássico",
    description: "20s trabalho, 10s pausa - 8 rounds",
    config: { prepTime: 10, exerciseTime: 20, restTime: 10, rounds: 8 },
    isBuiltIn: true,
  },
  {
    id: "tabata-extended",
    category: "TABATA",
    name: "Tabata Estendido",
    description: "20s/10s - 12 rounds",
    config: { prepTime: 10, exerciseTime: 20, restTime: 10, rounds: 12 },
    isBuiltIn: true,
  },
  // Boxe Suave
  {
    id: "boxe-beginner",
    category: "BOXE",
    name: "Boxe Iniciante",
    description: "2min round, 1min descanso",
    config: { prepTime: 30, exerciseTime: 120, restTime: 60, rounds: 3 },
    isBuiltIn: true,
  },
  {
    id: "boxe-pro",
    category: "BOXE",
    name: "Boxe Avançado",
    description: "3min round, 1min descanso",
    config: { prepTime: 30, exerciseTime: 180, restTime: 60, rounds: 5 },
    isBuiltIn: true,
  },
  // Circuito Ágil
  {
    id: "circuit-fast",
    category: "CIRCUITO",
    name: "Circuito Rápido",
    description: "45s exercício, 15s troca",
    config: { prepTime: 10, exerciseTime: 45, restTime: 15, rounds: 6 },
    isBuiltIn: true,
  },
  {
    id: "circuit-endurance",
    category: "CIRCUITO",
    name: "Circuito Resistência",
    description: "1min exercício, 30s troca",
    config: { prepTime: 10, exerciseTime: 60, restTime: 30, rounds: 8 },
    isBuiltIn: true,
  },
];

export async function getSettings(): Promise<Settings> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (json) {
      return { ...defaultSettings, ...JSON.parse(json) };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return defaultSettings;
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

export async function getProfile(): Promise<Profile> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    if (json) {
      return { ...defaultProfile, ...JSON.parse(json) };
    }
  } catch (error) {
    console.error("Error loading profile:", error);
  }
  return defaultProfile;
}

export async function saveProfile(profile: Partial<Profile>): Promise<void> {
  try {
    const current = await getProfile();
    const updated = { ...current, ...profile };
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving profile:", error);
  }
}

export async function getTimerConfig(): Promise<TimerConfig> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.TIMER_CONFIG);
    if (json) {
      return { ...defaultTimerConfig, ...JSON.parse(json) };
    }
  } catch (error) {
    console.error("Error loading timer config:", error);
  }
  return defaultTimerConfig;
}

export async function saveTimerConfig(config: Partial<TimerConfig>): Promise<void> {
  try {
    const current = await getTimerConfig();
    const updated = { ...current, ...config };
    await AsyncStorage.setItem(STORAGE_KEYS.TIMER_CONFIG, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving timer config:", error);
  }
}

export async function getSoundSettings(): Promise<SoundSettings> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.SOUND_SETTINGS);
    if (json) {
      return { ...defaultSoundSettings, ...JSON.parse(json) };
    }
  } catch (error) {
    console.error("Error loading sound settings:", error);
  }
  return defaultSoundSettings;
}

export async function saveSoundSettings(settings: Partial<SoundSettings>): Promise<void> {
  try {
    const current = await getSoundSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.SOUND_SETTINGS, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving sound settings:", error);
  }
}

export async function getAppPreferences(): Promise<AppPreferences> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.APP_PREFERENCES);
    if (json) {
      return { ...defaultAppPreferences, ...JSON.parse(json) };
    }
  } catch (error) {
    console.error("Error loading app preferences:", error);
  }
  return defaultAppPreferences;
}

export async function saveAppPreferences(preferences: Partial<AppPreferences>): Promise<void> {
  try {
    const current = await getAppPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(STORAGE_KEYS.APP_PREFERENCES, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving app preferences:", error);
  }
}

export async function getSpeechSettings(): Promise<SpeechSettings> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.SPEECH_SETTINGS);
    if (json) {
      return { ...defaultSpeechSettings, ...JSON.parse(json) };
    }
  } catch (error) {
    console.error("Error loading speech settings:", error);
  }
  return defaultSpeechSettings;
}

export async function saveSpeechSettings(settings: Partial<SpeechSettings>): Promise<void> {
  try {
    const current = await getSpeechSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.SPEECH_SETTINGS, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving speech settings:", error);
    throw error;
  }
}

export async function getWorkoutProfiles(): Promise<WorkoutProfile[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_PROFILES);
    const customProfiles = json ? JSON.parse(json) : [];
    return [...BUILTIN_PROFILES, ...customProfiles];
  } catch (error) {
    console.error("Error loading workout profiles:", error);
    return BUILTIN_PROFILES;
  }
}

export async function getProfileById(id: string): Promise<WorkoutProfile | null> {
  const profiles = await getWorkoutProfiles();
  return profiles.find(p => p.id === id) || null;
}

export async function saveCustomProfile(profile: Omit<WorkoutProfile, "isBuiltIn">): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_PROFILES);
    const customProfiles = json ? JSON.parse(json) : [];
    const newProfile: WorkoutProfile = { ...profile, isBuiltIn: false };
    customProfiles.push(newProfile);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PROFILES, JSON.stringify(customProfiles));
  } catch (error) {
    console.error("Error saving custom profile:", error);
  }
}

export async function deleteCustomProfile(id: string): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_PROFILES);
    const customProfiles = json ? JSON.parse(json) : [];
    const filtered = customProfiles.filter((p: WorkoutProfile) => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PROFILES, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting custom profile:", error);
  }
}

export async function applyProfile(profileId: string): Promise<void> {
  try {
    const profile = await getProfileById(profileId);
    if (!profile) throw new Error("Profile not found");
    await saveTimerConfig(profile.config);
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, profileId);
  } catch (error) {
    console.error("Error applying profile:", error);
  }
}

export async function getActiveProfileId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
  } catch (error) {
    console.error("Error loading active profile ID:", error);
    return null;
  }
}

export async function clearActiveProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
  } catch (error) {
    console.error("Error clearing active profile:", error);
  }
}

// Workout History Functions
export async function getWorkoutHistory(): Promise<WorkoutHistoryEntry[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
    if (json) {
      const history: WorkoutHistoryEntry[] = JSON.parse(json);
      return history.sort((a, b) => b.timestamp - a.timestamp);
    }
  } catch (error) {
    console.error("Error loading workout history:", error);
  }
  return [];
}

export async function addWorkoutToHistory(entry: Omit<WorkoutHistoryEntry, "id" | "timestamp" | "date">): Promise<void> {
  try {
    const history = await getWorkoutHistory();

    const newEntry: WorkoutHistoryEntry = {
      ...entry,
      id: generateUUID(),
      timestamp: Date.now(),
      date: new Date().toISOString(),
    };

    history.unshift(newEntry);

    if (history.length > MAX_HISTORY_ENTRIES) {
      history.splice(MAX_HISTORY_ENTRIES);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error("Error adding workout to history:", error);
  }
}

export async function clearWorkoutHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.WORKOUT_HISTORY);
  } catch (error) {
    console.error("Error clearing workout history:", error);
  }
}

export async function getHistoryEntryById(id: string): Promise<WorkoutHistoryEntry | null> {
  const history = await getWorkoutHistory();
  return history.find(entry => entry.id === id) || null;
}

export async function removeWorkoutFromHistory(id: string): Promise<void> {
  try {
    const history = await getWorkoutHistory();
    const filtered = history.filter(entry => entry.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing workout from history:", error);
    throw error;
  }
}

// View Mode Functions
export async function getViewMode(): Promise<"grid" | "list"> {
  try {
    const mode = await AsyncStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    return (mode as "grid" | "list") || "grid";
  } catch (error) {
    console.error("Error loading view mode:", error);
    return "grid";
  }
}

export async function saveViewMode(mode: "grid" | "list"): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
  } catch (error) {
    console.error("Error saving view mode:", error);
  }
}
