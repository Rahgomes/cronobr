import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useColorScheme as useSystemColorScheme, Appearance } from "react-native";
import { Colors } from "@/constants/theme";
import { getSettings, saveSettings, Settings } from "@/lib/storage";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  theme: typeof Colors.light;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    systemColorScheme === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme === "dark" ? "dark" : "light");
    });
    return () => listener.remove();
  }, []);

  const loadTheme = async () => {
    const settings = await getSettings();
    if (settings.theme) {
      setThemeModeState(settings.theme);
    }
    setIsLoaded(true);
  };

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveSettings({ theme: mode });
  }, []);

  const isDark = themeMode === "system" 
    ? systemTheme === "dark" 
    : themeMode === "dark";

  const theme = Colors[isDark ? "dark" : "light"];

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        isDark,
        theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
