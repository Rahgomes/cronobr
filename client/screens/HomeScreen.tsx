import React, { useMemo, useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import QuickStartCardV2 from "@/components/QuickStartCardV2";
import ModalidadeCardV2 from "@/components/ModalidadeCardV2";
import MenuDrawer from "@/components/MenuDrawer";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Modality } from "@/types/modality";
import { WorkoutCategory, getTimerConfig, TimerConfig } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useI18n();
  const [menuVisible, setMenuVisible] = useState(false);
  const [hasValidConfig, setHasValidConfig] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<TimerConfig | null>(null);

  // Load config on focus to check if preview should be shown
  useFocusEffect(
    React.useCallback(() => {
      const checkConfig = async () => {
        const config = await getTimerConfig();
        setCurrentConfig(config);
        // Valid if any value > 0 (excluding prep time, since it's optional)
        const isValid = config.exerciseTime > 0 && config.rounds > 0;
        setHasValidConfig(isValid);
      };
      checkConfig();
    }, [])
  );

  // Configure header buttons
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setMenuVisible(true);
          }}
          style={({ pressed }) => ({
            padding: 8,
            marginLeft: 8,
            borderRadius: 8,
            backgroundColor: pressed ? Colors.primary + "20" : "transparent",
          })}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            navigation.navigate("Settings");
          }}
          style={({ pressed }) => ({
            padding: 8,
            marginRight: 8,
            borderRadius: 8,
            backgroundColor: pressed ? Colors.primary + "20" : "transparent",
          })}
        >
          <Feather name="settings" size={24} color={theme.text} />
        </Pressable>
      ),
    });
  }, [navigation, theme]);

  // Define modalities with colors and icons
  const modalities: Modality[] = useMemo(
    () => [
      {
        id: "hiit",
        category: "HIIT" as WorkoutCategory,
        displayName: t("home.modalities.hiit.name"),
        technicalName: "HIIT",
        description: t("home.modalities.hiit.description"),
        icon: "flame" as keyof typeof Ionicons.glyphMap,
        color: "#F44336",
      },
      {
        id: "tabata",
        category: "TABATA" as WorkoutCategory,
        displayName: t("home.modalities.tabata.name"),
        technicalName: "TABATA",
        description: t("home.modalities.tabata.description"),
        icon: "repeat" as keyof typeof Ionicons.glyphMap,
        color: "#2196F3",
      },
      {
        id: "emom",
        category: "EMOM" as WorkoutCategory,
        displayName: t("home.modalities.emom.name"),
        technicalName: "EMOM",
        description: t("home.modalities.emom.description"),
        icon: "time" as keyof typeof Ionicons.glyphMap,
        color: "#FFC107",
      },
      {
        id: "amrap",
        category: "AMRAP" as WorkoutCategory,
        displayName: t("home.modalities.amrap.name"),
        technicalName: "AMRAP",
        description: t("home.modalities.amrap.description"),
        icon: "flash" as keyof typeof Ionicons.glyphMap,
        color: "#FF6B35",
      },
      {
        id: "boxe",
        category: "BOXE" as WorkoutCategory,
        displayName: t("home.modalities.boxe.name"),
        technicalName: "BOXE",
        description: t("home.modalities.boxe.description"),
        icon: "fitness" as keyof typeof Ionicons.glyphMap,
        color: "#9C27B0",
      },
      {
        id: "mobilidade",
        category: "CIRCUITO" as WorkoutCategory,
        displayName: t("home.modalities.mobilidade.name"),
        technicalName: "MOBILIDADE",
        description: t("home.modalities.mobilidade.description"),
        icon: "leaf" as keyof typeof Ionicons.glyphMap,
        color: "#4CAF50",
      },
    ],
    [t]
  );

  const handleQuickStart = () => {
    navigation.navigate("ManualConfig", {});
  };

  const handleModalityPress = (category: WorkoutCategory) => {
    navigation.navigate("CategoryPresets", { category });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: Colors.primary }]}>
              <Ionicons name="timer-outline" size={24} color="#FFFFFF" />
            </View>
            <ThemedText type="h2" style={styles.title}>
              CronôBR
            </ThemedText>
          </View>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t("home.subtitle")}
          </ThemedText>
        </View>

        {/* Quick Start Card V2 */}
        <QuickStartCardV2 onPress={handleQuickStart} />

        {/* Preview Button (conditionally shown) */}
        {hasValidConfig && currentConfig && (
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate("WorkoutPreview", {
                prepTime: currentConfig.prepTime,
                exerciseTime: currentConfig.exerciseTime,
                restTime: currentConfig.restTime,
                rounds: currentConfig.rounds,
              });
            }}
            style={({ pressed }) => [
              styles.previewButton,
              { backgroundColor: theme.backgroundSecondary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={styles.previewIconContainer}>
              <Feather name="play" size={16} color="#FFFFFF" />
            </View>
            <ThemedText type="bodySmall">{t("home.previewCurrent")}</ThemedText>
          </Pressable>
        )}

        {/* Modalities Section */}
        <View style={styles.modalitiesSection}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            {t("home.modalitiesTitle")}
          </ThemedText>

          <View style={styles.grid}>
            {modalities.map((modality, index) => (
              <ModalidadeCardV2
                key={modality.id}
                modality={modality}
                onPress={handleModalityPress}
                index={index}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Menu Drawer */}
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
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
  scrollContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.l,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    textAlign: "center"
  },
  modalitiesSection: {
    marginTop: 0,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: Spacing.m,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.m,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.l,
    gap: Spacing.xs,
  },
  previewIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
