import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ConfigCard } from "@/components/ConfigCard";
import { TimePickerModal } from "@/components/TimePickerModal";
import { RoundsPickerModal } from "@/components/RoundsPickerModal";
import MenuDrawer from "@/components/MenuDrawer";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getTimerConfig, saveTimerConfig, TimerConfig } from "@/lib/storage";

type Props = NativeStackScreenProps<RootStackParamList, "ManualConfig">;

type ModalType = "prep" | "exercise" | "rest" | "rounds" | null;

export default function ManualConfigScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, formatTime } = useI18n();
  const [menuVisible, setMenuVisible] = useState(false);

  const [config, setConfig] = useState<TimerConfig>({
    prepTime: 10,
    exerciseTime: 30,
    restTime: 15,
    rounds: 5,
  });

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    // Check if preset was passed via route params
    if (route.params?.preset) {
      const { preset } = route.params;
      setConfig({
        prepTime: preset.prepTime,
        exerciseTime: preset.exerciseTime,
        restTime: preset.restTime,
        rounds: preset.rounds,
      });
      return; // Don't load from storage if preset exists
    }

    // Check if quick start (empty params object)
    const isQuickStart = route.params && Object.keys(route.params).length === 0;
    if (isQuickStart) {
      setConfig({
        prepTime: 1,
        exerciseTime: 1,
        restTime: 1,
        rounds: 1,
      });
      return;
    }

    // Load from storage for normal manual config
    const loadedConfig = await getTimerConfig();
    setConfig(loadedConfig);
  }, [route.params]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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

  const handleConfigChange = async (key: keyof TimerConfig, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    await saveTimerConfig({ [key]: value });

    setHighlightedCard(key);
    setTimeout(() => setHighlightedCard(null), 300);
  };

  const handleStart = () => {
    navigation.navigate("ActiveTimer", {
      prepTime: config.prepTime,
      exerciseTime: config.exerciseTime,
      restTime: config.restTime,
      rounds: config.rounds,
      workoutType: "manual",
    });
  };

  const totalTime =
    config.rounds > 0
      ? config.prepTime + (config.exerciseTime + config.restTime) * config.rounds - config.restTime
      : 0;

  const formatDisplayTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) {
      return `${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m`;
    }
    return `${secs}s`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: Spacing.buttonHeight + Spacing.xxl + insets.bottom,
          paddingHorizontal: Spacing.m,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.heroSection}>
          <ThemedText type="h2">
            {(() => {
              const isQuickStart = route.params && Object.keys(route.params).length === 0;
              const preset = route.params?.preset;

              if (isQuickStart) {
                return t("manualConfig.quickStartTitle");
              } else if (preset?.category) {
                return preset.category;
              } else {
                return t("manualConfig.title");
              }
            })()}
          </ThemedText>
          <ThemedText type="bodySmall" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xs }}>
            {(() => {
              const isQuickStart = route.params && Object.keys(route.params).length === 0;
              const preset = route.params?.preset;

              if (isQuickStart) {
                return t("manualConfig.quickStartSubtitle");
              } else if (preset?.presetName) {
                return preset.presetName;
              } else {
                return t("timerConfig.subtitle");
              }
            })()}
          </ThemedText>
        </View>

        {/* Total Time Card */}
        <View style={styles.totalTimeCard}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {t("timerConfig.estimatedTime")}
          </ThemedText>
          <ThemedText type="h2" style={{ color: Colors.primary }}>
            {config.rounds === 0 ? formatDisplayTime(config.prepTime) : formatTime(totalTime)}
          </ThemedText>
        </View>

        {/* Config Cards */}
        <View style={styles.cardsContainer}>
          <ConfigCard
            label={t("timerConfig.preparation")}
            value={formatDisplayTime(config.prepTime)}
            icon="clock"
            onPress={() => setActiveModal("prep")}
            highlightBorder={highlightedCard === "prepTime"}
          />

          <ConfigCard
            label={t("timerConfig.exercise")}
            value={formatDisplayTime(config.exerciseTime)}
            icon="zap"
            onPress={() => setActiveModal("exercise")}
            highlightBorder={highlightedCard === "exerciseTime"}
          />

          <ConfigCard
            label={t("timerConfig.rest")}
            value={formatDisplayTime(config.restTime)}
            icon="wind"
            onPress={() => setActiveModal("rest")}
            highlightBorder={highlightedCard === "restTime"}
          />

          <ConfigCard
            label={t("timerConfig.rounds")}
            value={`${config.rounds}x`}
            icon="repeat"
            onPress={() => setActiveModal("rounds")}
            highlightBorder={highlightedCard === "rounds"}
          />
        </View>
      </ScrollView>

      {/* Fixed Start Button */}
      <View
        style={[
          styles.startButtonContainer,
          {
            paddingBottom: insets.bottom + Spacing.m,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <Button onPress={handleStart} style={styles.startButton}>
          {t("common.start")}
        </Button>
      </View>

      {/* Modals */}
      <TimePickerModal
        visible={activeModal === "prep"}
        onClose={() => setActiveModal(null)}
        onConfirm={(seconds) => handleConfigChange("prepTime", Math.max(1, seconds))}
        initialValue={config.prepTime}
        title={t("timerConfig.preparation")}
        maxMinutes={10}
      />

      <TimePickerModal
        visible={activeModal === "exercise"}
        onClose={() => setActiveModal(null)}
        onConfirm={(seconds) => handleConfigChange("exerciseTime", Math.max(1, seconds))}
        initialValue={config.exerciseTime}
        title={t("timerConfig.exercise")}
        maxMinutes={60}
      />

      <TimePickerModal
        visible={activeModal === "rest"}
        onClose={() => setActiveModal(null)}
        onConfirm={(seconds) => handleConfigChange("restTime", Math.max(1, seconds))}
        initialValue={config.restTime}
        title={t("timerConfig.rest")}
        maxMinutes={30}
      />

      <RoundsPickerModal
        visible={activeModal === "rounds"}
        onClose={() => setActiveModal(null)}
        onConfirm={(rounds) => handleConfigChange("rounds", rounds)}
        initialValue={config.rounds}
        title={t("timerConfig.rounds")}
        min={0}
        max={99}
      />

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
  heroSection: {
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  totalTimeCard: {
    alignItems: "center",
    marginBottom: Spacing.l,
    padding: Spacing.m,
  },
  cardsContainer: {
    gap: Spacing.m,
  },
  startButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
  },
  startButton: {
    width: "100%",
  },
});
