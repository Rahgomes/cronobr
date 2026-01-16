import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import * as Haptics from "expo-haptics";
import { SoundSettings, SoundType, VibrationPattern, getSoundSettings, saveSoundSettings } from "@/lib/storage";

interface SoundContextType {
  settings: SoundSettings;
  updateSettings: (updates: Partial<SoundSettings>) => Promise<void>;
  playSound: (type: SoundType) => void;
  triggerVibration: (pattern: VibrationPattern) => Promise<void>;
  isLoading: boolean;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Map sound types to haptic feedback styles
const hapticMap: Record<SoundType, Haptics.ImpactFeedbackStyle | null> = {
  beep1: Haptics.ImpactFeedbackStyle.Light,   // Light vibration (high pitch equivalent)
  beep2: Haptics.ImpactFeedbackStyle.Medium,  // Medium vibration (mid pitch equivalent)
  beep3: Haptics.ImpactFeedbackStyle.Heavy,   // Heavy vibration (low pitch equivalent)
  none: null,
};

// Map vibration patterns to execution functions
const vibrationPatternMap: Record<VibrationPattern, () => Promise<void>> = {
  none: async () => {},
  short: async () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  long: async () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  pulsed: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
  },
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>({
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
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await getSoundSettings();
      setSettings(loaded);
    } catch (error) {
      console.error("Error loading sound settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(async (updates: Partial<SoundSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSoundSettings(updates);
  }, [settings]);

  const triggerVibration = useCallback(async (pattern: VibrationPattern) => {
    if (pattern === "none") return;

    // Respect volume setting (0 = disabled)
    if (settings.volume === 0) return;

    try {
      await vibrationPatternMap[pattern]();
    } catch (error) {
      console.error("Error triggering vibration:", error);
    }
  }, [settings.volume]);

  const playSound = useCallback(async (type: SoundType) => {
    if (type === "none") return;

    // Respect volume setting (0 = disabled)
    if (settings.volume === 0) return;

    const hapticStyle = hapticMap[type];
    if (!hapticStyle) return;

    try {
      // Play haptic feedback
      await Haptics.impactAsync(hapticStyle);

      // For high volume with heavy impact, add double pattern for emphasis
      if (settings.volume > 80 && type === "beep3") {
        setTimeout(() => {
          Haptics.impactAsync(hapticStyle);
        }, 100);
      }
    } catch (error) {
      console.error("Error playing haptic feedback:", error);
    }
  }, [settings.volume]);

  return (
    <SoundContext.Provider value={{ settings, updateSettings, playSound, triggerVibration, isLoading }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
