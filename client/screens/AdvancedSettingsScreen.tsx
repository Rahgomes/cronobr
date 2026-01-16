import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { SettingRow } from "@/components/SettingRow";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getAppPreferences, saveAppPreferences, AppPreferences } from "@/lib/storage";

export default function AdvancedSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useI18n();

  const [preferences, setPreferences] = useState<AppPreferences>({
    silentModeEnabled: false,
    screenLockEnabled: true,
    preventAccidentalTouch: false,
  });

  const loadPreferences = useCallback(async () => {
    const prefs = await getAppPreferences();
    setPreferences(prefs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPreferences();
    }, [loadPreferences])
  );

  const handleToggle = async (key: keyof AppPreferences) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newValue = !preferences[key];
    setPreferences((prev) => ({ ...prev, [key]: newValue }));
    await saveAppPreferences({ [key]: newValue });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.m,
      }}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {t("silentMode.title")}
      </ThemedText>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <SettingRow
          icon="volume-x"
          title={t("silentMode.autoDetect")}
          subtitle={t("silentMode.autoDetectDescription")}
          type="toggle"
          value={preferences.silentModeEnabled ? "true" : "false"}
          onToggle={() => handleToggle("silentModeEnabled")}
        />
      </View>

      <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {t("screenLock.title")}
      </ThemedText>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <SettingRow
          icon="lock"
          title={t("screenLock.enabled")}
          subtitle={t("screenLock.description")}
          type="toggle"
          value={preferences.screenLockEnabled ? "true" : "false"}
          onToggle={() => handleToggle("screenLockEnabled")}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingRow
          icon="shield"
          title={t("screenLock.preventTouch")}
          subtitle={t("screenLock.preventTouchDescription")}
          type="toggle"
          value={preferences.preventAccidentalTouch ? "true" : "false"}
          onToggle={() => handleToggle("preventAccidentalTouch")}
        />
      </View>

      <View style={[styles.infoBox, { backgroundColor: theme.backgroundSecondary }]}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, lineHeight: 20 }}>
          {t("advancedSettings.info")}
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    marginTop: Spacing.l,
    marginBottom: Spacing.s,
    marginLeft: Spacing.s,
    letterSpacing: 1,
  },
  section: {
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    marginLeft: Spacing.xxl + Spacing.m,
  },
  infoBox: {
    marginTop: Spacing.l,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
  },
});
