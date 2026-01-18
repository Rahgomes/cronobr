import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import QuickStartCard from "@/components/QuickStartCard";
import LastWorkoutCard from "@/components/LastWorkoutCard";
import ModalityCard from "@/components/ModalityCard";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { useHistory } from "@/contexts/HistoryContext";
import { Colors, Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Modality } from "@/types/modality";
import { WorkoutCategory } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { history, refreshHistory } = useHistory();

  // Refresh history when screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshHistory();
    }, [refreshHistory])
  );

  // Get last workout (most recent by timestamp)
  const lastWorkout = useMemo(() => {
    if (history.length === 0) return null;
    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }, [history]);

  // Define modalities with colors and icons
  const modalities: Modality[] = useMemo(
    () => [
      {
        id: "hiit",
        category: "HIIT" as WorkoutCategory,
        displayName: t("home.modalities.hiit.name"),
        technicalName: "HIIT",
        description: t("home.modalities.hiit.description"),
        icon: "flame-outline" as keyof typeof Ionicons.glyphMap,
        color: "#F44336",
      },
      {
        id: "tabata",
        category: "TABATA" as WorkoutCategory,
        displayName: t("home.modalities.tabata.name"),
        technicalName: "TABATA",
        description: t("home.modalities.tabata.description"),
        icon: "repeat-outline" as keyof typeof Ionicons.glyphMap,
        color: "#2196F3",
      },
      {
        id: "emom",
        category: "EMOM" as WorkoutCategory,
        displayName: t("home.modalities.emom.name"),
        technicalName: "EMOM",
        description: t("home.modalities.emom.description"),
        icon: "time-outline" as keyof typeof Ionicons.glyphMap,
        color: "#FFC107",
      },
      {
        id: "amrap",
        category: "AMRAP" as WorkoutCategory,
        displayName: t("home.modalities.amrap.name"),
        technicalName: "AMRAP",
        description: t("home.modalities.amrap.description"),
        icon: "flash-outline" as keyof typeof Ionicons.glyphMap,
        color: "#FF6B35",
      },
      {
        id: "boxe",
        category: "BOXE" as WorkoutCategory,
        displayName: t("home.modalities.boxe.name"),
        technicalName: "BOXE",
        description: t("home.modalities.boxe.description"),
        icon: "fitness-outline" as keyof typeof Ionicons.glyphMap,
        color: "#9C27B0",
      },
      {
        id: "mobilidade",
        category: "CIRCUITO" as WorkoutCategory,
        displayName: t("home.modalities.mobilidade.name"),
        technicalName: "MOBILIDADE",
        description: t("home.modalities.mobilidade.description"),
        icon: "body-outline" as keyof typeof Ionicons.glyphMap,
        color: "#4CAF50",
      },
    ],
    [t]
  );

  const handleQuickStart = () => {
    navigation.navigate("ManualConfig");
  };

  const handleModalityPress = (category: WorkoutCategory) => {
    navigation.navigate("CategoryPresets", { category });
  };

  const handleRepeatWorkout = () => {
    if (!lastWorkout) return;

    // Navigate to ActiveTimer with last workout configuration
    navigation.navigate("ActiveTimer", {
      prepTime: lastWorkout.config.prepTime,
      exerciseTime: lastWorkout.config.exerciseTime,
      restTime: lastWorkout.config.restTime,
      rounds: lastWorkout.config.rounds,
      workoutType: lastWorkout.type,
      presetName: lastWorkout.presetName,
      presetCategory: lastWorkout.presetCategory,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
          paddingHorizontal: Spacing.m,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="h1">CronôBR</ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t("home.subtitle")}
          </ThemedText>
        </View>

        {/* Quick Start Card */}
        <QuickStartCard onPress={handleQuickStart} />

        {/* Last Workout Card (conditional) */}
        {lastWorkout && <LastWorkoutCard entry={lastWorkout} onRepeat={handleRepeatWorkout} />}

        {/* Modalities Section Title */}
        <ThemedText type="h2" style={styles.modalitiesTitle}>
          {t("home.modalitiesTitle")}
        </ThemedText>

        {/* Modalities Grid (2 columns) */}
        <View style={styles.grid}>
          {modalities.map((modality, index) => (
            <View key={modality.id} style={styles.gridItem}>
              <ModalityCard modality={modality} onPress={handleModalityPress} index={index} />
            </View>
          ))}
        </View>
      </ScrollView>
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
  header: {
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  subtitle: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  modalitiesTitle: {
    marginTop: Spacing.m,
    marginBottom: Spacing.m,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.m,
  },
  gridItem: {
    width: "48%",
  },
});
