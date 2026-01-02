import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { NumericStepper } from "@/components/NumericStepper";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getTimerConfig, saveTimerConfig, TimerConfig } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "TimerConfig">;

export default function TimerConfigScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t, formatTime } = useI18n();

  const [config, setConfig] = useState<TimerConfig>({
    prepTime: 10,
    exerciseTime: 30,
    restTime: 15,
    rounds: 5,
  });

  const loadConfig = useCallback(async () => {
    const loadedConfig = await getTimerConfig();
    setConfig(loadedConfig);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConfig();
    }, [loadConfig])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton
          onPress={() => navigation.navigate("Settings")}
          pressColor={Colors.primary + "20"}
        >
          <Feather name="settings" size={24} color={theme.text} />
        </HeaderButton>
      ),
    });
  }, [navigation, theme]);

  const handleConfigChange = async (key: keyof TimerConfig, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    await saveTimerConfig({ [key]: value });
  };

  const handleStart = () => {
    navigation.navigate("ActiveTimer", {
      prepTime: config.prepTime,
      exerciseTime: config.exerciseTime,
      restTime: config.restTime,
      rounds: config.rounds,
    });
  };

  const totalTime = config.prepTime + (config.exerciseTime + config.restTime) * config.rounds - config.restTime;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: Spacing.buttonHeight + Spacing.xxl + insets.bottom,
          paddingHorizontal: Spacing.m,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <ThemedText type="bodySmall" style={{ color: theme.textSecondary, textAlign: "center" }}>
            {t("timerConfig.subtitle")}
          </ThemedText>
        </View>

        <View style={styles.totalTimeCard}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {t("timerConfig.estimatedTime")}
          </ThemedText>
          <ThemedText type="h2" style={{ color: Colors.primary }}>
            {formatTime(totalTime)}
          </ThemedText>
        </View>

        <View style={styles.steppersContainer}>
          <NumericStepper
            value={config.prepTime}
            onValueChange={(v) => handleConfigChange("prepTime", v)}
            min={5}
            max={120}
            step={5}
            label={t("timerConfig.preparation")}
            icon="clock"
            formatValue={formatTime}
            isTimeInput={true}
          />

          <NumericStepper
            value={config.exerciseTime}
            onValueChange={(v) => handleConfigChange("exerciseTime", v)}
            min={5}
            max={600}
            step={5}
            label={t("timerConfig.exercise")}
            icon="zap"
            formatValue={formatTime}
            isTimeInput={true}
          />

          <NumericStepper
            value={config.restTime}
            onValueChange={(v) => handleConfigChange("restTime", v)}
            min={5}
            max={300}
            step={5}
            label={t("timerConfig.rest")}
            icon="wind"
            formatValue={formatTime}
            isTimeInput={true}
          />

          <NumericStepper
            value={config.rounds}
            onValueChange={(v) => handleConfigChange("rounds", v)}
            min={1}
            max={50}
            step={1}
            label={t("timerConfig.rounds")}
            icon="repeat"
            formatValue={(v) => `${v}x`}
            isTimeInput={false}
          />
        </View>
      </ScrollView>

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
  steppersContainer: {
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
