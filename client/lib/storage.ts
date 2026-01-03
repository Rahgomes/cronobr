import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  SETTINGS: "@cronobr/settings",
  PROFILE: "@cronobr/profile",
  TIMER_CONFIG: "@cronobr/timer_config",
  SOUND_SETTINGS: "@cronobr/sound_settings",
};

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

export interface SoundSettings {
  countdownSound: SoundType;
  roundStartSound: SoundType;
  roundEndSound: SoundType;
  halfwaySound: SoundType;
  beforeEndSound: SoundType;
  beforeEndSeconds: number;
  volume: number;
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
};

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
