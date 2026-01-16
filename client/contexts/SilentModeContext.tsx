import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useSound } from "@/contexts/SoundContext";
import { getAppPreferences, saveAppPreferences } from "@/lib/storage";

interface SilentModeContextType {
  isSilentMode: boolean;
  autoDetect: boolean;
  setAutoDetect: (enabled: boolean) => void;
  manualToggle: () => void;
}

const SilentModeContext = createContext<SilentModeContextType | undefined>(undefined);

export function SilentModeProvider({ children }: { children: ReactNode }) {
  const { settings: soundSettings } = useSound();
  const [autoDetect, setAutoDetect] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getAppPreferences();
      setAutoDetect(prefs.silentModeEnabled);
    } catch (error) {
      console.error("Error loading silent mode preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Detectar modo silencioso automaticamente
  const isSilentMode = useMemo(() => {
    if (!autoDetect) return false;

    // Verificar se volume = 0 ou todos os sons = "none"
    const allSoundsDisabled =
      soundSettings.countdownSound === "none" &&
      soundSettings.roundStartSound === "none" &&
      soundSettings.roundEndSound === "none" &&
      soundSettings.halfwaySound === "none" &&
      soundSettings.beforeEndSound === "none";

    return soundSettings.volume === 0 || allSoundsDisabled;
  }, [soundSettings, autoDetect]);

  const handleSetAutoDetect = async (enabled: boolean) => {
    setAutoDetect(enabled);
    try {
      await saveAppPreferences({ silentModeEnabled: enabled });
    } catch (error) {
      console.error("Error saving silent mode preference:", error);
    }
  };

  const manualToggle = () => {
    handleSetAutoDetect(!autoDetect);
  };

  if (isLoading) {
    return null; // ou um loading spinner
  }

  return (
    <SilentModeContext.Provider
      value={{
        isSilentMode,
        autoDetect,
        setAutoDetect: handleSetAutoDetect,
        manualToggle,
      }}
    >
      {children}
    </SilentModeContext.Provider>
  );
}

export function useSilentMode() {
  const context = useContext(SilentModeContext);
  if (!context) {
    throw new Error("useSilentMode must be used within SilentModeProvider");
  }
  return context;
}
