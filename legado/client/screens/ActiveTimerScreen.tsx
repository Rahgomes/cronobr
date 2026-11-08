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
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { SilentModeIndicator } from "@/components/SilentModeIndicator";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useI18n } from "@/contexts/I18nContext";
import { useScreenLock } from "@/contexts/ScreenLockContext";
import { useSilentMode } from "@/contexts/SilentModeContext";
import { useHistory } from "@/contexts/HistoryContext";
import { useSpeech } from "@/contexts/SpeechContext";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getSettings, Settings, getSoundSettings, SoundSettings, SoundType, getActiveProfileId, getProfileById, WorkoutCategory } from "@/lib/storage";

type ActiveTimerRouteProp = RouteProp<RootStackParamList, "ActiveTimer">;

type Phase = "preparation" | "exercise" | "rest" | "completed";

const formatTimerDisplay = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function ActiveTimerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<ActiveTimerRouteProp>();
  const { t } = useI18n();
  const { prepTime, exerciseTime, restTime, rounds, workoutType, presetName, presetCategory } = route.params;
  const { enableScreenLock, disableScreenLock, preventAccidentalTouch } = useScreenLock();
  const { isSilentMode } = useSilentMode();
  const { addEntry } = useHistory();
  const { speak, stopSpeaking } = useSpeech();

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

  const [phase, setPhase] = useState<Phase>("preparation");
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(prepTime);
  const [totalPhaseTime, setTotalPhaseTime] = useState(prepTime);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showDoubleTapHint, setShowDoubleTapHint] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    soundEnabled: true,
    vibrationEnabled: true,
    language: "pt-BR",
    theme: "system",
  });
  const [soundSettings, setSoundSettings] = useState<SoundSettings>({
    countdownSound: "beep1",
    roundStartSound: "beep2",
    roundEndSound: "beep3",
    halfwaySound: "none",
    beforeEndSound: "none",
    beforeEndSeconds: 10,
    volume: 80,
    countdownVibration: "short",
    roundStartVibration: "long",
    roundEndVibration: "long",
    halfwayVibration: "short",
    beforeEndVibration: "pulsed",
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const triggeredEventsRef = useRef<Set<string>>(new Set());
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [profileMetadata, setProfileMetadata] = useState<{
    type: "preset" | "manual";
    presetName?: string;
    presetCategory?: WorkoutCategory;
  } | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
    getSoundSettings().then(setSoundSettings);
  }, []);

  useEffect(() => {
    if (workoutType) {
      setProfileMetadata({
        type: workoutType,
        presetName,
        presetCategory,
      });
    } else {
      const loadProfileMetadata = async () => {
        const activeId = await getActiveProfileId();
        if (activeId) {
          const profile = await getProfileById(activeId);
          if (profile) {
            setProfileMetadata({
              type: "preset",
              presetName: profile.name,
              presetCategory: profile.category,
            });
            return;
          }
        }
        setProfileMetadata({ type: "manual" });
      };
      loadProfileMetadata();
    }
    startTimeRef.current = Date.now();
  }, [workoutType, presetName, presetCategory]);

  // TTS preparation start narration on mount
  useEffect(() => {
    if (phase === "preparation" && isRunning) {
      speak("preparationStart");
    }
  }, []); // Only run on mount

  // Gerenciar screen lock quando timer está rodando
  useEffect(() => {
    if (isRunning && !isPaused && phase !== "completed") {
      enableScreenLock();
    } else {
      disableScreenLock();
    }

    // Cleanup ao desmontar componente
    return () => {
      disableScreenLock();
      stopSpeaking(); // Stop any ongoing speech
    };
  }, [isRunning, isPaused, phase, enableScreenLock, disableScreenLock, stopSpeaking]);

  const timerScale = useSharedValue(1);
  const backgroundColor = useSharedValue(phaseConfig.preparation.color);
  const progressWidth = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const phaseIconScale = useSharedValue(1);

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

  const animatedPhaseIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: phaseIconScale.value }],
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

  const playSoundEffect = useCallback((soundType: SoundType) => {
    if (soundType === "none" || !settings.soundEnabled) return;
    if (Platform.OS !== "web") {
      switch (soundType) {
        case "beep1":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case "beep2":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "beep3":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    }
  }, [settings.soundEnabled]);

  const checkAndTriggerSoundEvents = useCallback((
    currentPhase: Phase,
    time: number,
    phaseTotal: number,
    round: number
  ) => {
    const eventKey = `${currentPhase}-${round}-${time}`;
    if (triggeredEventsRef.current.has(eventKey)) return;

    // Countdown narration (5-1)
    if (time <= 5 && time > 0 && currentPhase !== "completed") {
      if (soundSettings.countdownSound !== "none") {
        playSoundEffect(soundSettings.countdownSound);
      }
      // TTS countdown narration
      speak("countdown", { countdown: time });
      triggeredEventsRef.current.add(eventKey);
    }

    if (soundSettings.beforeEndSound !== "none" && currentPhase !== "completed") {
      if (time === soundSettings.beforeEndSeconds) {
        playSoundEffect(soundSettings.beforeEndSound);
        triggeredEventsRef.current.add(eventKey);
      }
    }

    // Halfway narration (only for rounds ≥30s per user preference)
    if (currentPhase === "exercise") {
      const halfway = Math.floor(phaseTotal / 2);
      if (time === halfway && halfway > 0 && phaseTotal >= 30) {
        if (soundSettings.halfwaySound !== "none") {
          playSoundEffect(soundSettings.halfwaySound);
        }
        // TTS halfway narration
        speak("exerciseHalfway");
        triggeredEventsRef.current.add(eventKey);
      }
    }
  }, [soundSettings, playSoundEffect, speak]);

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

  const animatePhaseTransition = useCallback(() => {
    phaseIconScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  }, [phaseIconScale]);

  const transitionToPhase = useCallback((newPhase: Phase, time: number, fromPhase?: Phase, roundNum?: number) => {
    setPhase(newPhase);
    setTimeRemaining(time);
    setTotalPhaseTime(time);

    triggeredEventsRef.current.clear();

    backgroundColor.value = withTiming(phaseConfig[newPhase].color, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });

    progressWidth.value = 0;
    animatePhaseTransition();
    triggerHaptic("medium");

    // Sound effects and TTS narration
    if (newPhase === "exercise" && fromPhase !== undefined) {
      playSoundEffect(soundSettings.roundStartSound);
      // TTS round start narration
      speak("roundStart", { roundNumber: roundNum || currentRound });
    }
    if (fromPhase === "exercise" && newPhase === "rest") {
      playSoundEffect(soundSettings.roundEndSound);
      // TTS round end + rest start narration
      speak("roundEnd");
      speak("restStart");
    }
    if (fromPhase === "exercise" && newPhase === "completed") {
      playSoundEffect(soundSettings.roundEndSound);
      // TTS workout completed narration
      speak("workoutCompleted");
    }
  }, [backgroundColor, progressWidth, triggerHaptic, animatePhaseTransition, phaseConfig, playSoundEffect, soundSettings, speak, currentRound]);

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

        checkAndTriggerSoundEvents(phase, newTime, totalPhaseTime, currentRound);

        if (newTime <= 0) {
          if (phase === "preparation") {
            if (rounds === 0) {
              transitionToPhase("completed", 0, "preparation");
              setIsRunning(false);
              triggerHaptic("notification");
              saveToHistory(false);
            } else {
              transitionToPhase("exercise", exerciseTime, "preparation", 1);
            }
          } else if (phase === "exercise") {
            shakeTimer();
            if (currentRound < rounds) {
              transitionToPhase("rest", restTime, "exercise");
            } else {
              transitionToPhase("completed", 0, "exercise");
              setIsRunning(false);
              triggerHaptic("notification");
              saveToHistory(false);
            }
          } else if (phase === "rest") {
            setCurrentRound((r) => {
              const nextRound = r + 1;
              transitionToPhase("exercise", exerciseTime, "rest", nextRound);
              return nextRound;
            });
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
  }, [isRunning, isPaused, phase, currentRound, rounds, exerciseTime, restTime, totalPhaseTime, progressWidth, pulseTimer, shakeTimer, transitionToPhase, triggerHaptic, checkAndTriggerSoundEvents]);

  const handlePauseResume = () => {
    // Se proteção contra toques acidentais não está ativa, comportamento normal
    if (!preventAccidentalTouch) {
      setIsPaused(!isPaused);
      triggerHaptic("medium");
      return;
    }

    // Proteção ativa: requer duplo toque rápido (300ms)
    if (doubleTapTimeoutRef.current) {
      // Segundo toque detectado - confirmar pausa/retomada
      clearTimeout(doubleTapTimeoutRef.current);
      doubleTapTimeoutRef.current = null;
      setShowDoubleTapHint(false);
      setIsPaused(!isPaused);
      triggerHaptic("medium");
    } else {
      // Primeiro toque - aguardar segundo toque
      setShowDoubleTapHint(true);
      triggerHaptic("light");
      doubleTapTimeoutRef.current = setTimeout(() => {
        doubleTapTimeoutRef.current = null;
        setShowDoubleTapHint(false);
      }, 300);
    }
  };

  const saveToHistory = useCallback(async (wasInterrupted: boolean) => {
    const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

    await addEntry({
      duration: elapsedSeconds,
      type: profileMetadata?.type || "manual",
      presetName: profileMetadata?.presetName,
      presetCategory: profileMetadata?.presetCategory,
      config: {
        prepTime,
        exerciseTime,
        restTime,
        rounds,
      },
      completedRounds: currentRound,
      totalRounds: rounds,
      wasInterrupted,
    });

    // Show toast confirmation
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 3000);
  }, [addEntry, prepTime, exerciseTime, restTime, rounds, currentRound, profileMetadata]);

  const handleStop = () => {
    setShowStopModal(true); // Show modal instead of immediate stop
  };

  const handleConfirmStop = async () => {
    setShowStopModal(false);
    setIsRunning(false);
    triggerHaptic("heavy");

    // TTS workout interrupted narration
    if (phase !== "completed") {
      await speak("workoutInterrupted");
    }

    // Stop any ongoing speech
    stopSpeaking();

    await saveToHistory(true);

    navigation.goBack();
  };

  const handleContinue = () => {
    setShowStopModal(false);
    triggerHaptic("light");
  };

  const handleClose = () => {
    setIsRunning(false);
    navigation.goBack();
  };

  const config = phaseConfig[phase];

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <SilentModeIndicator />

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
            {rounds > 0 ? `${t("activeTimer.round")} ${currentRound}/${rounds}` : t("activeTimer.preparation")}
          </ThemedText>
        </View>

        <Animated.View style={[styles.phaseIndicator, animatedPhaseIconStyle]}>
          <Feather name={config.icon} size={32} color="#FFFFFF" />
          <ThemedText type="h3" style={styles.whiteText}>
            {config.label}
          </ThemedText>
        </Animated.View>

        <Animated.View style={animatedTimerStyle}>
          <ThemedText type="display" style={[styles.timerText, { fontFamily: Fonts?.mono }]}>
            {phase === "completed" ? "00:00" : formatTimerDisplay(timeRemaining)}
          </ThemedText>
        </Animated.View>

        {phase === "completed" ? (
          <View style={styles.congratsContainer}>
            <ThemedText type="body" style={[styles.whiteText, styles.congratsText]}>
              {t("activeTimer.congratulations")}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
          </View>
        </View>

        {showDoubleTapHint && (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            style={styles.doubleTapHint}
          >
            <ThemedText type="bodySmall" style={[styles.whiteText, styles.hintText]}>
              {t("screenLock.doubleTapHint")}
            </ThemedText>
          </Animated.View>
        )}

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
                  {isPaused ? t("common.resume") : t("common.pause")}
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
                  {t("common.stop")}
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
                  {t("activeTimer.close")}
                </ThemedText>
              </View>
            </Button>
          </View>
        )}
      </View>

      {/* Toast notification when workout is saved */}
      {showSavedToast && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={styles.toastContainer}
        >
          <View style={styles.toast}>
            <Feather name="check-circle" size={20} color={Colors.success} />
            <ThemedText type="bodySmall" style={styles.toastText}>
              Treino salvo no histórico!
            </ThemedText>
          </View>
        </Animated.View>
      )}

      {/* Stop Confirmation Modal */}
      <ConfirmationModal
        visible={showStopModal}
        onClose={handleContinue}
        onConfirm={handleConfirmStop}
        title={t("activeTimer.stopModalTitle")}
        message={t("activeTimer.stopModalMessage")}
        confirmText={t("activeTimer.stopModalFinish")}
        cancelText={t("activeTimer.stopModalContinue")}
        variant="warning"
      />
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
  doubleTapHint: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.m,
  },
  hintText: {
    textAlign: "center",
    fontSize: 14,
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
  toastContainer: {
    position: "absolute",
    bottom: Spacing.xxl,
    left: Spacing.m,
    right: Spacing.m,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.m,
    gap: Spacing.s,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
