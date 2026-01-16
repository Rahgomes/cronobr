import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type DynamicPreviewRouteProp = RouteProp<RootStackParamList, "DynamicPreview">;

type SimulationPhase = "preparation" | "exercise" | "rest" | "completed";

const SIMULATION_SPEED = 10; // 10x mais rápido (1s real = 0.1s simulação)

export default function DynamicPreviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<DynamicPreviewRouteProp>();
  const { theme } = useTheme();
  const { t } = useI18n();

  const { prepTime, exerciseTime, restTime, rounds } = route.params;

  const phaseConfig = {
    preparation: {
      color: Colors.phasePreparation,
      label: t("activeTimer.preparation"),
      icon: "clock" as const,
    },
    exercise: {
      color: Colors.phaseExercise,
      label: t("activeTimer.exercise"),
      icon: "zap" as const,
    },
    rest: {
      color: Colors.phaseRest,
      label: t("activeTimer.rest"),
      icon: "wind" as const,
    },
    completed: {
      color: Colors.success,
      label: t("activeTimer.completed"),
      icon: "check-circle" as const,
    },
  };

  const [phase, setPhase] = useState<SimulationPhase>("preparation");
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(prepTime);
  const [totalPhaseTime, setTotalPhaseTime] = useState(prepTime);
  const [isPlaying, setIsPlaying] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const backgroundColor = useSharedValue(phaseConfig.preparation.color);
  const progressWidth = useSharedValue(0);
  const phaseIconScale = useSharedValue(1);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const animatedPhaseIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: phaseIconScale.value }],
  }));

  const animatePhaseTransition = () => {
    phaseIconScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  };

  const transitionToPhase = (newPhase: SimulationPhase, time: number) => {
    setPhase(newPhase);
    setTimeRemaining(time);
    setTotalPhaseTime(time);

    backgroundColor.value = withTiming(phaseConfig[newPhase].color, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });

    progressWidth.value = 0;
    animatePhaseTransition();

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  useEffect(() => {
    if (!isPlaying || phase === "completed") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Intervalo de 100ms (10x mais rápido = a cada 100ms simulamos 1 segundo)
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;

        // Atualizar barra de progresso
        const progress = ((totalPhaseTime - newTime) / totalPhaseTime) * 100;
        progressWidth.value = withTiming(progress, { duration: 90 });

        if (newTime <= 0) {
          if (phase === "preparation") {
            if (rounds === 0) {
              transitionToPhase("completed", 0);
              setIsPlaying(false);
            } else {
              transitionToPhase("exercise", exerciseTime);
            }
          } else if (phase === "exercise") {
            if (currentRound < rounds) {
              transitionToPhase("rest", restTime);
            } else {
              transitionToPhase("completed", 0);
              setIsPlaying(false);
            }
          } else if (phase === "rest") {
            setCurrentRound((r) => r + 1);
            transitionToPhase("exercise", exerciseTime);
          }
          return prev;
        }

        return newTime;
      });
    }, 100); // 100ms interval = 10x speed

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, phase, currentRound, rounds, exerciseTime, restTime, totalPhaseTime]);

  const handlePlayPause = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setIsPlaying(false);
    setPhase("preparation");
    setCurrentRound(1);
    setTimeRemaining(prepTime);
    setTotalPhaseTime(prepTime);
    backgroundColor.value = withTiming(phaseConfig.preparation.color, { duration: 300 });
    progressWidth.value = 0;
  };

  const handleClose = () => {
    setIsPlaying(false);
    navigation.goBack();
  };

  const formatTimerDisplay = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const config = phaseConfig[phase];

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <Pressable
        style={[styles.closeButton, { top: insets.top + Spacing.m }]}
        onPress={handleClose}
        hitSlop={20}
      >
        <Feather name="x" size={28} color="#FFFFFF" />
      </Pressable>

      <View style={styles.speedIndicator}>
        <Feather name="fast-forward" size={16} color="#FFFFFF" />
        <ThemedText type="caption" style={styles.whiteText}>
          {t("simulation.speed")}
        </ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.roundIndicator}>
          <ThemedText type="h2" style={styles.whiteText}>
            {rounds > 0 && phase !== "preparation" && phase !== "completed"
              ? `${t("activeTimer.round")} ${currentRound}/${rounds}`
              : phase === "preparation"
              ? t("activeTimer.preparation")
              : ""}
          </ThemedText>
        </View>

        <Animated.View style={[styles.phaseIndicator, animatedPhaseIconStyle]}>
          <Feather name={config.icon} size={48} color="#FFFFFF" />
          <ThemedText type="h2" style={styles.whiteText}>
            {config.label}
          </ThemedText>
        </Animated.View>

        <ThemedText type="display" style={[styles.timerText, { fontFamily: Fonts?.mono }]}>
          {phase === "completed" ? "00:00" : formatTimerDisplay(timeRemaining)}
        </ThemedText>

        {phase === "completed" && (
          <View style={styles.congratsContainer}>
            <ThemedText type="body" style={[styles.whiteText, styles.congratsText]}>
              {t("simulation.title")} {t("activeTimer.completed")}
            </ThemedText>
          </View>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
          </View>
        </View>

        <View style={styles.controlsContainer}>
          {phase !== "completed" ? (
            <>
              <Pressable
                onPress={handlePlayPause}
                style={({ pressed }) => [
                  styles.controlButton,
                  { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Feather
                  name={isPlaying ? "pause" : "play"}
                  size={32}
                  color="#FFFFFF"
                />
                <ThemedText type="button" style={styles.whiteText}>
                  {isPlaying ? t("simulation.pause") : t("simulation.play")}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handleReset}
                style={({ pressed }) => [
                  styles.controlButton,
                  { backgroundColor: "rgba(255, 255, 255, 0.15)" },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Feather name="rotate-ccw" size={24} color="#FFFFFF" />
                <ThemedText type="bodySmall" style={styles.whiteText}>
                  {t("simulation.reset")}
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.controlButton,
                styles.closeControlButton,
                { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name="check" size={24} color="#FFFFFF" />
              <ThemedText type="button" style={styles.whiteText}>
                {t("activeTimer.close")}
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    left: Spacing.m,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  speedIndicator: {
    position: "absolute",
    top: Spacing.m,
    right: Spacing.m,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.round,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
  },
  roundIndicator: {
    marginBottom: Spacing.m,
    minHeight: 32,
  },
  phaseIndicator: {
    alignItems: "center",
    gap: Spacing.m,
    marginBottom: Spacing.xl,
  },
  timerText: {
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  whiteText: {
    color: "#FFFFFF",
  },
  congratsContainer: {
    marginBottom: Spacing.l,
  },
  congratsText: {
    textAlign: "center",
    opacity: 0.9,
  },
  progressContainer: {
    width: "80%",
    marginBottom: Spacing.xxl,
  },
  progressBackground: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: BorderRadius.round,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.round,
  },
  controlsContainer: {
    flexDirection: "row",
    gap: Spacing.m,
    width: "100%",
    paddingHorizontal: Spacing.m,
  },
  controlButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.s,
    paddingVertical: Spacing.l,
    borderRadius: BorderRadius.m,
  },
  closeControlButton: {
    flex: 1,
  },
});
