import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import * as ScreenOrientation from "expo-screen-orientation";
import { getAppPreferences, saveAppPreferences } from "@/lib/storage";

interface ScreenLockContextType {
  isScreenLocked: boolean;
  enableScreenLock: () => Promise<void>;
  disableScreenLock: () => Promise<void>;
  preventAccidentalTouch: boolean;
  setPreventAccidentalTouch: (enabled: boolean) => Promise<void>;
  screenLockEnabled: boolean;
  setScreenLockEnabled: (enabled: boolean) => Promise<void>;
}

const ScreenLockContext = createContext<ScreenLockContextType | undefined>(undefined);

export function ScreenLockProvider({ children }: { children: ReactNode }) {
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [preventAccidentalTouch, setPreventAccidentalTouchState] = useState(false);
  const [screenLockEnabled, setScreenLockEnabledState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar preferências ao iniciar
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getAppPreferences();
      setPreventAccidentalTouchState(prefs.preventAccidentalTouch);
      setScreenLockEnabledState(prefs.screenLockEnabled);
    } catch (error) {
      console.error("Error loading screen lock preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const enableScreenLock = async () => {
    if (!screenLockEnabled) {
      return; // Não ativar se desabilitado nas configurações
    }

    try {
      // Manter tela ligada
      await activateKeepAwakeAsync();

      // Bloquear rotação para retrato
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

      setIsScreenLocked(true);
    } catch (error) {
      console.error("Failed to enable screen lock:", error);
    }
  };

  const disableScreenLock = async () => {
    try {
      // Desativar keep awake
      deactivateKeepAwake();

      // Liberar rotação
      await ScreenOrientation.unlockAsync();

      setIsScreenLocked(false);
    } catch (error) {
      console.error("Failed to disable screen lock:", error);
    }
  };

  const setPreventAccidentalTouch = async (enabled: boolean) => {
    setPreventAccidentalTouchState(enabled);
    try {
      await saveAppPreferences({ preventAccidentalTouch: enabled });
    } catch (error) {
      console.error("Error saving prevent accidental touch preference:", error);
    }
  };

  const setScreenLockEnabled = async (enabled: boolean) => {
    setScreenLockEnabledState(enabled);
    try {
      await saveAppPreferences({ screenLockEnabled: enabled });
    } catch (error) {
      console.error("Error saving screen lock enabled preference:", error);
    }
  };

  if (isLoading) {
    return null; // ou um loading spinner
  }

  return (
    <ScreenLockContext.Provider
      value={{
        isScreenLocked,
        enableScreenLock,
        disableScreenLock,
        preventAccidentalTouch,
        setPreventAccidentalTouch,
        screenLockEnabled,
        setScreenLockEnabled,
      }}
    >
      {children}
    </ScreenLockContext.Provider>
  );
}

export function useScreenLock() {
  const context = useContext(ScreenLockContext);
  if (!context) {
    throw new Error("useScreenLock must be used within ScreenLockProvider");
  }
  return context;
}
