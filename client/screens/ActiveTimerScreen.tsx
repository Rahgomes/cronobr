import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getSettings, Settings } from "@/lib/storage";

type ActiveTimerRouteProp = RouteProp<RootStackParamList, "ActiveTimer">;

type Phase = "preparation" | "exercise" | "rest" | "completed";

const phaseConfig = {
  preparation: {
    color: Colors.phasePreparation,
    label: "Preparacao",
    icon: "clock" as const,
  },
  exercise: {
    color: Colors.phaseExercise,
    label: "Exercicio",
    icon: "zap" as const,
  },
  rest: {
    color: Colors.phaseRest,
    label: "Descanso",
    icon: "wind" as const,
  },
  completed: {
    color: Colors.success,
    label: "Concluido!",
    icon: "check-circle" as const,
  },
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function ActiveTimerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<ActiveTimerRouteProp>();
  const { prepTime, exerciseTime, restTime, rounds } = route.params;

  const [phase, setPhase] = useState<Phase>("preparation");
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(prepTime);
  const [totalPhaseTime, setTotalPhaseTime] = useState(prepTime);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    soundEnabled: true,
    vibrationEnabled: true,
    language: "pt-BR",
    theme: "system",
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);
  
  const timerScale = useSharedValue(1);
  const backgroundColor = useSharedValue(phaseConfig.preparation.color);
  const progressWidth = useSharedValue(0);
  const shakeX = useSharedValue(0);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  const animatedTimerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: timerScale.value },
      { translateX: shakeX.value },
    ],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const triggerHaptic = useCallback((type: "light" | "medium" | "heavy" | "notification") => {
    if (Platform.OS !== "web" && settings.vibrationEnabled) {
      switch (type) {
        case "light":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "notification":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    }
  }, [settings.vibrationEnabled]);

  const pulseTimer = useCallback(() => {
    timerScale.value = withSequence(
      withTiming(1.05, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  }, [timerScale]);

  const shakeTimer = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [shakeX]);

  const transitionToPhase = useCallback((newPhase: Phase, time: number) => {
    setPhase(newPhase);
    setTimeRemaining(time);
    setTotalPhaseTime(time);
    
    backgroundColor.value = withTiming(phaseConfig[newPhase].color, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    
    progressWidth.value = 0;
    triggerHaptic("medium");
  }, [backgroundColor, progressWidth, triggerHaptic]);

  useEffect(() => {
    if (!isRunning || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        const progress = ((totalPhaseTime - newTime) / totalPhaseTime) * 100;
        progressWidth.value = withTiming(progress, { duration: 900 });

        if (newTime <= 3 && newTime > 0) {
          pulseTimer();
          triggerHaptic("light");
        }

        if (newTime <= 0) {
          if (phase === "preparation") {
            transitionToPhase("exercise", exerciseTime);
          } else if (phase === "exercise") {
            shakeTimer();
            if (currentRound < rounds) {
              transitionToPhase("rest", restTime);
            } else {
              transitionToPhase("completed", 0);
              setIsRunning(false);
              triggerHaptic("notification");
            }
          } else if (phase === "rest") {
            setCurrentRound((r) => r + 1);
            transitionToPhase("exercise", exerciseTime);
          }
          return prev;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, phase, currentRound, rounds, exerciseTime, restTime, totalPhaseTime, progressWidth, pulseTimer, shakeTimer, transitionToPhase, triggerHaptic]);

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    triggerHaptic("medium");
  };

  const handleStop = () => {
    setIsRunning(false);
    triggerHaptic("heavy");
    navigation.goBack();
  };

  const handleClose = () => {
    setIsRunning(false);
    navigation.goBack();
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

      <View style={styles.content}>
        <View style={styles.roundIndicator}>
          <ThemedText type="h2" style={styles.whiteText}>
            Round {currentRound}/{rounds}
          </ThemedText>
        </View>

        <View style={styles.phaseIndicator}>
          <Feather name={config.icon} size={32} color="#FFFFFF" />
          <ThemedText type="h3" style={styles.whiteText}>
            {config.label}
          </ThemedText>
        </View>

        <Animated.View style={animatedTimerStyle}>
          <ThemedText type="display" style={[styles.timerText, { fontFamily: Fonts?.mono }]}>
            {phase === "completed" ? "00:00" : formatTime(timeRemaining)}
          </ThemedText>
        </Animated.View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
          </View>
        </View>

        {phase !== "completed" ? (
          <View style={styles.controlsContainer}>
            <Button
              onPress={handlePauseResume}
              variant="warning"
              style={styles.controlButton}
            >
              <View style={styles.buttonContent}>
                <Feather
                  name={isPaused ? "play-circle" : "pause-circle"}
                  size={24}
                  color="#FFFFFF"
                />
                <ThemedText type="button" style={styles.whiteText}>
                  {isPaused ? "CONTINUAR" : "PAUSAR"}
                </ThemedText>
              </View>
            </Button>
            <Button
              onPress={handleStop}
              variant="danger"
              style={styles.controlButton}
            >
              <View style={styles.buttonContent}>
                <Feather name="square" size={24} color="#FFFFFF" />
                <ThemedText type="button" style={styles.whiteText}>
                  PARAR
                </ThemedText>
              </View>
            </Button>
          </View>
        ) : (
          <View style={styles.controlsContainer}>
            <Button
              onPress={handleClose}
              variant="primary"
              style={[styles.controlButton, { flex: 1 }]}
            >
              <View style={styles.buttonContent}>
                <Feather name="check" size={24} color="#FFFFFF" />
                <ThemedText type="button" style={styles.whiteText}>
                  FINALIZAR
                </ThemedText>
              </View>
            </Button>
          </View>
        )}
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
  },
  roundIndicator: {
    marginBottom: Spacing.m,
  },
  phaseIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    marginBottom: Spacing.l,
  },
  timerText: {
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  whiteText: {
    color: "#FFFFFF",
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
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
});
