import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAudioPlayer } from "expo-audio";
import { SoundSettings, SoundType, getSoundSettings, saveSoundSettings } from "@/lib/storage";

interface SoundContextType {
  settings: SoundSettings;
  updateSettings: (updates: Partial<SoundSettings>) => Promise<void>;
  playSound: (type: SoundType) => void;
  isLoading: boolean;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>({
    countdownSound: "beep1",
    roundStartSound: "beep2",
    roundEndSound: "beep3",
    halfwaySound: "none",
    beforeEndSound: "none",
    beforeEndSeconds: 10,
    volume: 80,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentSound, setCurrentSound] = useState<SoundType>("beep1");

  const player = useAudioPlayer(null);

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

  const playSound = useCallback((type: SoundType) => {
    if (type === "none") return;
    setCurrentSound(type);
  }, []);

  return (
    <SoundContext.Provider value={{ settings, updateSettings, playSound, isLoading }}>
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
