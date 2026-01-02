import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Alert, Pressable, Platform } from "react-native";
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
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getSettings, saveSettings, getProfile, Settings, Profile } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Settings">;

const avatarIcons: (keyof typeof Feather.glyphMap)[] = ["activity", "user", "clock"];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const profileScale = useSharedValue(1);

  const [settings, setSettings] = useState<Settings>({
    soundEnabled: true,
    vibrationEnabled: true,
    language: "pt-BR",
    theme: "system",
  });
  const [profile, setProfile] = useState<Profile>({
    name: "Atleta",
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

  const handleToggleSetting = async (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings({ [key]: value });
  };

  const handleLanguagePress = () => {
    Alert.alert(
      "Idioma",
      "Selecione o idioma",
      [
        { text: "Portugues (BR)", onPress: () => handleLanguageChange("pt-BR") },
        { text: "English", onPress: () => handleLanguageChange("en") },
        { text: "Espanol", onPress: () => handleLanguageChange("es") },
        { text: "Francais", onPress: () => handleLanguageChange("fr") },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const handleLanguageChange = async (language: Settings["language"]) => {
    const newSettings = { ...settings, language };
    setSettings(newSettings);
    await saveSettings({ language });
  };

  const handleThemePress = () => {
    Alert.alert(
      "Tema",
      "Selecione o tema",
      [
        { text: "Sistema", onPress: () => handleThemeChange("system") },
        { text: "Claro", onPress: () => handleThemeChange("light") },
        { text: "Escuro", onPress: () => handleThemeChange("dark") },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const handleThemeChange = async (themeOption: Settings["theme"]) => {
    const newSettings = { ...settings, theme: themeOption };
    setSettings(newSettings);
    await saveSettings({ theme: themeOption });
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case "pt-BR": return "Portugues";
      case "en": return "English";
      case "es": return "Espanol";
      case "fr": return "Francais";
      default: return lang;
    }
  };

  const getThemeLabel = (t: string) => {
    switch (t) {
      case "system": return "Sistema";
      case "light": return "Claro";
      case "dark": return "Escuro";
      default: return t;
    }
  };

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.m,
      }}
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
          <Feather name={avatarIcons[profile.avatarIndex]} size={32} color={Colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <ThemedText type="h3">{profile.name}</ThemedText>
          <ThemedText type="bodySmall" style={{ color: theme.textSecondary }}>
            Toque para editar perfil
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </AnimatedPressable>

      <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        PREFERENCIAS
      </ThemedText>
      
      <View style={styles.section}>
        <SettingRow
          label="Som"
          icon="volume-2"
          toggle
          toggleValue={settings.soundEnabled}
          onToggleChange={(v) => handleToggleSetting("soundEnabled", v)}
        />
        <SettingRow
          label="Vibracao"
          icon="smartphone"
          toggle
          toggleValue={settings.vibrationEnabled}
          onToggleChange={(v) => handleToggleSetting("vibrationEnabled", v)}
        />
      </View>

      <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        APARENCIA
      </ThemedText>

      <View style={styles.section}>
        <SettingRow
          label="Idioma"
          icon="globe"
          value={getLanguageLabel(settings.language)}
          onPress={handleLanguagePress}
        />
        <SettingRow
          label="Tema"
          icon="moon"
          value={getThemeLabel(settings.theme)}
          onPress={handleThemePress}
        />
      </View>

      <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        SOBRE
      </ThemedText>

      <View style={styles.section}>
        <SettingRow
          label="Versao"
          icon="info"
          value="1.0.0"
          showChevron={false}
        />
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
    gap: Spacing.s,
  },
});
