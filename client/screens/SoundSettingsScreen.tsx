import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { SoundPickerModal } from "@/components/SoundPickerModal";
import { VibrationPatternPickerModal } from "@/components/VibrationPatternPickerModal";
import { TimePickerModal } from "@/components/TimePickerModal";
import { SpeechSettingsSection } from "@/components/SpeechSettingsSection";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { SoundSettings, SoundType, VibrationPattern, getSoundSettings, saveSoundSettings } from "@/lib/storage";

type SoundCategory = "countdown" | "roundStart" | "roundEnd" | "halfway" | "beforeEnd";

export default function SoundSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useI18n();

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

  const [activeModal, setActiveModal] = useState<SoundCategory | "beforeEndTime" | null>(null);
  const [activeVibrationModal, setActiveVibrationModal] = useState<SoundCategory | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await getSoundSettings();
    setSettings(loaded);
  };

  const handleSoundChange = async (category: SoundCategory, sound: SoundType) => {
    const key = `${category}Sound` as keyof SoundSettings;
    const newSettings = { ...settings, [key]: sound };
    setSettings(newSettings);
    await saveSoundSettings({ [key]: sound });
  };

  const handleVolumeChange = useCallback(async (value: number) => {
    const newSettings = { ...settings, volume: Math.round(value) };
    setSettings(newSettings);
  }, [settings]);

  const handleVolumeChangeEnd = async (value: number) => {
    await saveSoundSettings({ volume: Math.round(value) });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBeforeEndSecondsChange = async (seconds: number) => {
    const newSettings = { ...settings, beforeEndSeconds: seconds };
    setSettings(newSettings);
    await saveSoundSettings({ beforeEndSeconds: seconds });
  };

  const handleVibrationChange = async (category: SoundCategory, pattern: VibrationPattern) => {
    const key = `${category}Vibration` as keyof SoundSettings;
    const newSettings = { ...settings, [key]: pattern };
    setSettings(newSettings);
    await saveSoundSettings({ [key]: pattern });
  };

  const getSoundLabel = (sound: SoundType): string => {
    switch (sound) {
      case "none":
        return t("soundSettings.noSound");
      case "beep1":
        return t("soundSettings.sound1");
      case "beep2":
        return t("soundSettings.sound2");
      case "beep3":
        return t("soundSettings.sound3");
      default:
        return sound;
    }
  };

  const getVibrationLabel = (pattern: VibrationPattern): string => {
    switch (pattern) {
      case "none":
        return t("vibration.none");
      case "short":
        return t("vibration.short");
      case "long":
        return t("vibration.long");
      case "pulsed":
        return t("vibration.pulsed");
      default:
        return pattern;
    }
  };

  const categories: {
    key: SoundCategory;
    icon: keyof typeof Feather.glyphMap;
    settingKey: keyof SoundSettings;
    vibrationKey: keyof SoundSettings;
  }[] = [
    { key: "countdown", icon: "clock", settingKey: "countdownSound", vibrationKey: "countdownVibration" },
    { key: "roundStart", icon: "play-circle", settingKey: "roundStartSound", vibrationKey: "roundStartVibration" },
    { key: "roundEnd", icon: "stop-circle", settingKey: "roundEndSound", vibrationKey: "roundEndVibration" },
    { key: "halfway", icon: "divide", settingKey: "halfwaySound", vibrationKey: "halfwayVibration" },
    { key: "beforeEnd", icon: "alert-circle", settingKey: "beforeEndSound", vibrationKey: "beforeEndVibration" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.m,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.m,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.volumeSection}>
          <View style={styles.volumeHeader}>
            <Feather name="volume-2" size={20} color={theme.text} />
            <ThemedText type="h3">{t("soundSettings.volume")}</ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {settings.volume}%
            </ThemedText>
          </View>
          <View style={[styles.sliderContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="volume" size={16} color={theme.textSecondary} />
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={settings.volume}
              onValueChange={handleVolumeChange}
              onSlidingComplete={handleVolumeChangeEnd}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={theme.backgroundDefault}
              thumbTintColor={Colors.primary}
            />
            <Feather name="volume-2" size={16} color={theme.textSecondary} />
          </View>
        </View>

        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <Card key={category.key} style={styles.categoryCard}>
              <Pressable
                onPress={() => setActiveModal(category.key)}
                style={({ pressed }) => [styles.categoryRow, pressed && { opacity: 0.7 }]}
              >
                <View style={styles.categoryInfo}>
                  <View style={[styles.iconContainer, { backgroundColor: Colors.primary + "20" }]}>
                    <Feather name={category.icon} size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.categoryText}>
                    <ThemedText type="body">{t(`soundSettings.${category.key}`)}</ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {t(`soundSettings.${category.key}Desc`)}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.categoryValue}>
                  <ThemedText type="bodySmall" style={{ color: Colors.primary }}>
                    {getSoundLabel(settings[category.settingKey] as SoundType)}
                  </ThemedText>
                  <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                </View>
              </Pressable>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <Pressable
                onPress={() => setActiveVibrationModal(category.key)}
                style={({ pressed }) => [
                  styles.subRow,
                  { backgroundColor: theme.backgroundSecondary },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={styles.subRowContent}>
                  <Feather name="smartphone" size={16} color={theme.textSecondary} />
                  <ThemedText type="bodySmall">{t("vibration.selectPattern")}</ThemedText>
                </View>
                <View style={styles.subRowValue}>
                  <ThemedText type="bodySmall" style={{ color: Colors.primary }}>
                    {getVibrationLabel(settings[category.vibrationKey] as VibrationPattern)}
                  </ThemedText>
                  <Feather name="chevron-right" size={16} color={theme.textSecondary} />
                </View>
              </Pressable>

              {category.key === "beforeEnd" && settings.beforeEndSound !== "none" ? (
                <Pressable
                  onPress={() => setActiveModal("beforeEndTime")}
                  style={({ pressed }) => [
                    styles.subRow,
                    { backgroundColor: theme.backgroundSecondary },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <ThemedText type="bodySmall">{settings.beforeEndSeconds}s {t("soundSettings.secondsBefore")}</ThemedText>
                  <Feather name="chevron-right" size={16} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </Card>
          ))}
        </View>

        {/* Divider */}
        <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />

        {/* TTS Section Header */}
        <View style={styles.sectionHeader}>
          <Feather name="volume-2" size={24} color={Colors.primary} />
          <ThemedText type="h2" style={{ marginLeft: Spacing.s }}>
            {t("speech.sectionTitle")}
          </ThemedText>
        </View>

        {/* TTS Settings */}
        <SpeechSettingsSection />
      </ScrollView>

      {categories.map((category) => (
        <SoundPickerModal
          key={category.key}
          visible={activeModal === category.key}
          onClose={() => setActiveModal(null)}
          onConfirm={(sound) => handleSoundChange(category.key, sound)}
          currentValue={settings[category.settingKey] as SoundType}
          title={t(`soundSettings.${category.key}`)}
        />
      ))}

      {categories.map((category) => (
        <VibrationPatternPickerModal
          key={`vibration-${category.key}`}
          visible={activeVibrationModal === category.key}
          onClose={() => setActiveVibrationModal(null)}
          onConfirm={(pattern) => handleVibrationChange(category.key, pattern)}
          currentValue={settings[category.vibrationKey] as VibrationPattern}
          title={t(`soundSettings.${category.key}`)}
        />
      ))}

      <TimePickerModal
        visible={activeModal === "beforeEndTime"}
        onClose={() => setActiveModal(null)}
        onConfirm={(seconds) => handleBeforeEndSecondsChange(Math.max(1, seconds))}
        initialValue={settings.beforeEndSeconds}
        title={t("soundSettings.beforeEnd")}
        maxMinutes={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  volumeSection: {
    marginBottom: Spacing.l,
  },
  volumeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  categoriesContainer: {
    gap: Spacing.m,
  },
  categoryCard: {
    padding: 0,
    overflow: "hidden",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.m,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryText: {
    flex: 1,
    gap: 2,
  },
  categoryValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.m,
  },
  subRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    marginHorizontal: Spacing.s,
    marginBottom: Spacing.s,
    borderRadius: BorderRadius.s,
  },
  subRowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  subRowValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  sectionDivider: {
    height: 1,
    marginVertical: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
});
