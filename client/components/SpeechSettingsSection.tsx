import React, { useState } from "react";
import { View, StyleSheet, Pressable, Switch, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { ThemedText } from "./ThemedText";
import { Button } from "./Button";
import { VoicePickerModal } from "./VoicePickerModal";
import { useI18n } from "../contexts/I18nContext";
import { useSpeech } from "../contexts/SpeechContext";
import { Colors, Spacing, BorderRadius } from "../constants/theme";
import { SpeechEvent } from "../lib/storage";

export function SpeechSettingsSection() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const { t } = useI18n();
  const { settings, updateSettings, speak, availableVoices } = useSpeech();
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  const handleTestSpeech = async () => {
    await speak("workoutCompleted");
  };

  const eventsList: { key: SpeechEvent; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "preparationStart", icon: "time-outline" },
    { key: "countdown", icon: "timer-outline" },
    { key: "roundStart", icon: "play-circle-outline" },
    { key: "exerciseHalfway", icon: "contrast-outline" },
    { key: "roundEnd", icon: "stop-circle-outline" },
    { key: "restStart", icon: "pause-circle-outline" },
    { key: "workoutCompleted", icon: "checkmark-circle-outline" },
    { key: "workoutInterrupted", icon: "close-circle-outline" },
  ];

  return (
    <View style={styles.container}>
      {/* Master Enable/Disable Toggle */}
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Ionicons name="volume-high-outline" size={24} color={Colors.primary} />
            <View style={styles.textContainer}>
              <ThemedText type="body">{t("speech.enabled")}</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {t("speech.enabledDesc")}
              </ThemedText>
            </View>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={(enabled) => updateSettings({ enabled })}
            trackColor={{ false: theme.border, true: Colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={theme.border}
          />
        </View>
      </View>

      {settings.enabled && (
        <>
          {/* Volume Slider */}
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <View style={styles.sliderHeader}>
              <ThemedText type="body">{t("speech.volume")}</ThemedText>
              <ThemedText type="bodySmall" style={{ color: theme.textSecondary }}>
                {settings.volume}%
              </ThemedText>
            </View>
            <View style={styles.sliderContainer}>
              <Ionicons name="volume-low-outline" size={20} color={theme.textSecondary} />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={settings.volume}
                onValueChange={(volume) => updateSettings({ volume: Math.round(volume) })}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={Colors.primary}
              />
              <Ionicons name="volume-high-outline" size={20} color={theme.textSecondary} />
            </View>
          </View>

          {/* Voice Selection */}
          <Pressable
            style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
            onPress={() => setShowVoicePicker(true)}
          >
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Ionicons name="person-outline" size={24} color={Colors.primary} />
                <ThemedText type="body">{t("speech.voiceSelection")}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </View>
          </Pressable>

          {/* Events to Narrate */}
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              {t("speech.events")}
            </ThemedText>

            {eventsList.map((event, index) => (
              <View
                key={event.key}
                style={[
                  styles.eventRow,
                  index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                ]}
              >
                <View style={styles.rowContent}>
                  <Ionicons name={event.icon} size={20} color={theme.textSecondary} />
                  <ThemedText type="bodySmall">
                    {t(`speech.event${event.key.charAt(0).toUpperCase() + event.key.slice(1)}`)}
                  </ThemedText>
                </View>
                <Switch
                  value={settings.enabledEvents[event.key]}
                  onValueChange={(value) =>
                    updateSettings({
                      enabledEvents: { ...settings.enabledEvents, [event.key]: value },
                    })
                  }
                  trackColor={{ false: theme.border, true: Colors.primary }}
                  thumbColor={"#FFFFFF"}
                  ios_backgroundColor={theme.border}
                />
              </View>
            ))}
          </View>

          {/* Test Button */}
          <View style={styles.testButtonContainer}>
            <Button onPress={handleTestSpeech} variant="secondary">
              <View style={styles.buttonContent}>
                <Ionicons name="play-outline" size={20} color={Colors.light.buttonText} />
                <ThemedText type="button" style={{ color: Colors.light.buttonText, marginLeft: Spacing.s }}>
                  {t("speech.testSpeech")}
                </ThemedText>
              </View>
            </Button>
          </View>
        </>
      )}

      {/* Voice Picker Modal */}
      <VoicePickerModal
        visible={showVoicePicker}
        onClose={() => setShowVoicePicker(false)}
        onConfirm={(voiceId, voiceLanguage) => {
          updateSettings({ voiceId, voiceLanguage });
          setShowVoicePicker(false);
        }}
        currentVoiceId={settings.voiceId}
        currentLanguage={settings.voiceLanguage}
        availableVoices={availableVoices}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.m,
  },
  card: {
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.m,
  },
  testButtonContainer: {
    marginTop: Spacing.s,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
