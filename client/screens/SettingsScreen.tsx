import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { SettingRow } from "@/components/SettingRow";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getSettings, saveSettings, getProfile, Settings, Profile } from "@/lib/storage";
import { Language } from "@/lib/i18n";
import { ThemeMode } from "@/contexts/ThemeContext";
import { avatars } from "@/constants/avatars";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Settings">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function OptionButton({ label, selected, onPress }: OptionButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.optionButton,
        {
          backgroundColor: selected ? Colors.primary : theme.backgroundSecondary,
          borderColor: selected ? Colors.primary : theme.border,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        type="bodySmall"
        style={{ color: selected ? "#FFFFFF" : theme.text }}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { t, language, setLanguage, languages } = useI18n();

  const [settings, setSettings] = useState<Settings>({
    soundEnabled: true,
    vibrationEnabled: true,
    language: "pt-BR",
    theme: "system",
  });
  const [profile, setProfile] = useState<Profile>({
    name: t("profile.athlete"),
    avatarIndex: 0,
  });

  const loadData = useCallback(async () => {
    const [loadedSettings, loadedProfile] = await Promise.all([
      getSettings(),
      getProfile(),
    ]);
    setSettings(loadedSettings);
    setProfile(loadedProfile);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleToggle = async (key: "soundEnabled" | "vibrationEnabled") => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    await saveSettings({ [key]: newValue });
  };

  const handleLanguageChange = async (lang: Language) => {
    setSettings((prev) => ({ ...prev, language: lang }));
    await setLanguage(lang);
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme: mode }));
    await setThemeMode(mode);
  };

  const themeOptions: { mode: ThemeMode; labelKey: string }[] = [
    { mode: "system", labelKey: "settings.themeSystem" },
    { mode: "light", labelKey: "settings.themeLight" },
    { mode: "dark", labelKey: "settings.themeDark" },
  ];

  const profileScale = useSharedValue(1);

  const profileAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: profileScale.value }],
  }));

  const handleProfilePressIn = () => {
    profileScale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  };

  const handleProfilePressOut = () => {
    profileScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handleProfilePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("Profile");
  };

  const currentAvatar = avatars[profile.avatarIndex] || avatars[0];

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
      <AnimatedPressable
        onPress={handleProfilePress}
        onPressIn={handleProfilePressIn}
        onPressOut={handleProfilePressOut}
        style={[
          styles.profileCard,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          profileAnimatedStyle,
        ]}
      >
        <View style={[styles.avatarContainer, { backgroundColor: Colors.primaryLight + "20" }]}>
          <Feather name={currentAvatar.icon} size={32} color={Colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <ThemedText type="h3">{profile.name}</ThemedText>
          <ThemedText type="bodySmall" style={{ color: theme.textSecondary }}>
            {t("settings.editProfile")}
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </AnimatedPressable>

      <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {t("settings.preferences")}
      </ThemedText>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <SettingRow
          icon="volume-2"
          title={t("settings.sound")}
          subtitle={t("settings.soundDescription")}
          type="toggle"
          value={settings.soundEnabled ? "true" : "false"}
          onToggle={() => handleToggle("soundEnabled")}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingRow
          icon="smartphone"
          title={t("settings.vibration")}
          subtitle={t("settings.vibrationDescription")}
          type="toggle"
          value={settings.vibrationEnabled ? "true" : "false"}
          onToggle={() => handleToggle("vibrationEnabled")}
        />
      </View>

      <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {t("settings.appearance")}
      </ThemedText>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <View style={styles.settingItem}>
          <View style={styles.settingHeader}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight + "20" }]}>
              <Feather name="globe" size={20} color={Colors.primary} />
            </View>
            <ThemedText type="body">{t("settings.language")}</ThemedText>
          </View>
          <View style={styles.optionsRow}>
            {languages.map((lang) => (
              <OptionButton
                key={lang.code}
                label={lang.code === "pt-BR" ? "PT" : lang.code.toUpperCase()}
                selected={language === lang.code}
                onPress={() => handleLanguageChange(lang.code)}
              />
            ))}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.settingItem}>
          <View style={styles.settingHeader}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight + "20" }]}>
              <Feather name="moon" size={20} color={Colors.primary} />
            </View>
            <ThemedText type="body">{t("settings.theme")}</ThemedText>
          </View>
          <View style={styles.optionsRow}>
            {themeOptions.map((option) => (
              <OptionButton
                key={option.mode}
                label={t(option.labelKey)}
                selected={themeMode === option.mode}
                onPress={() => handleThemeChange(option.mode)}
              />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    marginBottom: Spacing.l,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.m,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
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
  settingItem: {
    padding: Spacing.m,
    gap: Spacing.m,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.s,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsRow: {
    flexDirection: "row",
    gap: Spacing.s,
    flexWrap: "wrap",
  },
  optionButton: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.s,
    borderWidth: 1,
  },
});
