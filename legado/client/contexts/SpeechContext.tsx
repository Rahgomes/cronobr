import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import * as Speech from "expo-speech";
import { Platform } from "react-native";
import { SpeechSettings, SpeechEvent, getSpeechSettings, saveSpeechSettings } from "../lib/storage";
import { useI18n } from "./I18nContext";

interface AvailableVoice {
  identifier: string;
  name: string;
  language: string;
  quality: "Default" | "Enhanced" | "Premium";
}

interface SpeechContextType {
  settings: SpeechSettings;
  updateSettings: (updates: Partial<SpeechSettings>) => Promise<void>;
  speak: (event: SpeechEvent, metadata?: { roundNumber?: number; countdown?: number }) => Promise<void>;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  availableVoices: AvailableVoice[];
  isLoading: boolean;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

export function SpeechProvider({ children }: { children: ReactNode }) {
  const { t, language } = useI18n();
  const [settings, setSettings] = useState<SpeechSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<AvailableVoice[]>([]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadAvailableVoices();
  }, []);

  // Update voice language when app language changes
  useEffect(() => {
    if (settings && language) {
      // Map app language to voice language code
      const voiceLanguageMap: Record<string, string> = {
        "pt-BR": "pt-BR",
        "en": "en-US",
        "es": "es-ES",
        "fr": "fr-FR",
      };
      const voiceLanguage = voiceLanguageMap[language] || "pt-BR";

      if (settings.voiceLanguage !== voiceLanguage) {
        updateSettings({ voiceLanguage });
      }
    }
  }, [language]);

  const loadSettings = async () => {
    try {
      const loaded = await getSpeechSettings();
      setSettings(loaded);
    } catch (error) {
      console.error("Error loading speech settings:", error);
      // Create default settings if load fails
      const defaultSettings: SpeechSettings = {
        enabled: false,
        voiceLanguage: "pt-BR",
        voiceId: null,
        volume: 80,
        rate: 1.0,
        pitch: 1.0,
        enabledEvents: {
          preparationStart: true,
          countdown: true,
          roundStart: true,
          exerciseHalfway: false,
          roundEnd: true,
          restStart: true,
          restEnd: false,
          workoutCompleted: true,
          workoutInterrupted: true,
        },
      };
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableVoices = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        // Web Speech API has limited support
        return;
      }

      const voices = await Speech.getAvailableVoicesAsync();
      setAvailableVoices(voices.map(v => ({
        identifier: v.identifier,
        name: v.name,
        language: v.language,
        quality: v.quality,
      })));
    } catch (error) {
      console.error("Error loading available voices:", error);
      setAvailableVoices([]);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<SpeechSettings>) => {
    if (!settings) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSpeechSettings(updates);
  }, [settings]);

  const getPhraseForEvent = useCallback((
    event: SpeechEvent,
    metadata?: { roundNumber?: number; countdown?: number }
  ): string => {
    switch (event) {
      case "preparationStart":
        return t("speech.preparationStart");

      case "countdown":
        // Numbers only: "5", "4", "3", "2", "1" (per user preference)
        if (metadata?.countdown) {
          return t(`speech.countdown${metadata.countdown}`);
        }
        return "";

      case "roundStart":
        if (metadata?.roundNumber) {
          return t("speech.roundStart").replace("{{number}}", String(metadata.roundNumber));
        }
        return t("speech.roundStart").replace(" {{number}}", "");

      case "exerciseHalfway":
        return t("speech.exerciseHalfway");

      case "roundEnd":
        return t("speech.roundEnd");

      case "restStart":
        return t("speech.restStart");

      case "restEnd":
        return t("speech.restEnd");

      case "workoutCompleted":
        return t("speech.workoutCompleted");

      case "workoutInterrupted":
        return t("speech.workoutInterrupted");

      default:
        return "";
    }
  }, [t]);

  const speak = useCallback(async (
    event: SpeechEvent,
    metadata?: { roundNumber?: number; countdown?: number }
  ) => {
    // Guard clauses
    if (!settings || !settings.enabled) return;
    if (!settings.enabledEvents[event]) return;
    if (settings.volume === 0) return;

    const phrase = getPhraseForEvent(event, metadata);
    if (!phrase) return;

    try {
      setIsSpeaking(true);

      const options: Speech.SpeechOptions = {
        language: settings.voiceLanguage,
        pitch: settings.pitch,
        rate: settings.rate,
        voice: settings.voiceId || undefined,
        volume: settings.volume / 100, // Convert 0-100 to 0-1

        // Callbacks
        onDone: () => setIsSpeaking(false),
        onError: (error) => {
          console.error("Speech error:", error);
          setIsSpeaking(false);
        },
        onStopped: () => setIsSpeaking(false),
      };

      await Speech.speak(phrase, options);
    } catch (error) {
      console.error("Error speaking:", error);
      setIsSpeaking(false);
    }
  }, [settings, getPhraseForEvent]);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  if (isLoading || !settings) {
    return null; // Loading guard
  }

  return (
    <SpeechContext.Provider
      value={{
        settings,
        updateSettings,
        speak,
        stopSpeaking,
        isSpeaking,
        availableVoices,
        isLoading,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }
  return context;
}
