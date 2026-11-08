import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Language, t as translate, getDeviceLanguage, translations, formatTime as formatTimeUtil, parseTimeInput } from "@/lib/i18n";
import { getSettings, saveSettings } from "@/lib/storage";

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (path: string) => string;
  formatTime: (seconds: number) => string;
  parseTimeInput: (input: string) => number | null;
  languages: { code: Language; name: string }[];
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt-BR");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    const settings = await getSettings();
    if (settings.language) {
      setLanguageState(settings.language);
    } else {
      const deviceLang = getDeviceLanguage();
      setLanguageState(deviceLang);
      await saveSettings({ language: deviceLang });
    }
    setIsLoaded(true);
  };

  const setLanguage = useCallback(async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    await saveSettings({ language: newLanguage });
  }, []);

  const t = useCallback((path: string): string => {
    return translate(language, path);
  }, [language]);

  const formatTime = useCallback((seconds: number): string => {
    return formatTimeUtil(seconds, language);
  }, [language]);

  const languages: { code: Language; name: string }[] = [
    { code: "pt-BR", name: translations[language].languages["pt-BR"] },
    { code: "en", name: translations[language].languages.en },
    { code: "es", name: translations[language].languages.es },
    { code: "fr", name: translations[language].languages.fr },
  ];

  if (!isLoaded) {
    return null;
  }

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatTime,
        parseTimeInput,
        languages,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
