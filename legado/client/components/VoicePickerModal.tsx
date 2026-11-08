import React, { useState } from "react";
import { Modal, View, StyleSheet, Pressable, ScrollView } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Button } from "./Button";
import { useI18n } from "../contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "../constants/theme";
import { useColorScheme } from "react-native";

interface AvailableVoice {
  identifier: string;
  name: string;
  language: string;
  quality: "Default" | "Enhanced" | "Premium";
}

interface VoicePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (voiceId: string | null, voiceLanguage: string) => void;
  currentVoiceId: string | null;
  currentLanguage: string;
  availableVoices: AvailableVoice[];
}

export function VoicePickerModal({
  visible,
  onClose,
  onConfirm,
  currentVoiceId,
  currentLanguage,
  availableVoices,
}: VoicePickerModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const { t } = useI18n();
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(currentVoiceId);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLanguage);

  // Group voices by language
  const voicesByLanguage = availableVoices.reduce((acc, voice) => {
    if (!acc[voice.language]) acc[voice.language] = [];
    acc[voice.language].push(voice);
    return acc;
  }, {} as Record<string, AvailableVoice[]>);

  const handlePreview = async (voice: AvailableVoice) => {
    try {
      const testPhrase = t("speech.workoutCompleted");
      await Speech.speak(testPhrase, {
        language: voice.language,
        voice: voice.identifier,
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8,
      });
    } catch (error) {
      console.error("Error previewing voice:", error);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedVoiceId, selectedLanguage);
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "Premium":
        return Colors.success;
      case "Enhanced":
        return Colors.info;
      default:
        return theme.textSecondary;
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.modal,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <View style={styles.header}>
            <ThemedText type="h3">{t("speech.selectVoice")}</ThemedText>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {Object.entries(voicesByLanguage).map(([language, voices]) => (
              <View key={language} style={styles.languageSection}>
                <ThemedText
                  type="bodySmall"
                  style={[styles.languageHeader, { color: theme.textSecondary }]}
                >
                  {language}
                </ThemedText>

                {voices.map((voice) => (
                  <Pressable
                    key={voice.identifier}
                    style={[
                      styles.voiceRow,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setSelectedVoiceId(voice.identifier);
                      setSelectedLanguage(voice.language);
                    }}
                  >
                    <View style={styles.voiceInfo}>
                      <View style={styles.voiceNameRow}>
                        <ThemedText type="body">{voice.name}</ThemedText>
                        <View
                          style={[
                            styles.qualityBadge,
                            { backgroundColor: getQualityColor(voice.quality) },
                          ]}
                        >
                          <ThemedText type="caption" style={{ color: "#FFFFFF", fontSize: 10 }}>
                            {t(`speech.quality${voice.quality}`)}
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    <View style={styles.voiceActions}>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handlePreview(voice);
                        }}
                        style={styles.previewButton}
                      >
                        <Ionicons name="play" size={16} color={Colors.primary} />
                      </Pressable>

                      {selectedVoiceId === voice.identifier && (
                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.button}>
              <Button onPress={onClose} variant="secondary">
                {t("history.cancel")}
              </Button>
            </View>
            <View style={styles.button}>
              <Button onPress={handleConfirm} variant="primary">
                {t("common.save")}
              </Button>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
  modal: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    padding: Spacing.l,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  scrollView: {
    maxHeight: 400,
  },
  languageSection: {
    marginBottom: Spacing.l,
  },
  languageHeader: {
    fontWeight: "600",
    marginBottom: Spacing.s,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  qualityBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    borderRadius: BorderRadius.s,
  },
  voiceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  previewButton: {
    padding: Spacing.s,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.m,
    marginTop: Spacing.l,
  },
  button: {
    flex: 1,
  },
});
