import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Modal, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ConfigCard } from "@/components/ConfigCard";
import { TimePickerModal } from "@/components/TimePickerModal";
import { RoundsPickerModal } from "@/components/RoundsPickerModal";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getTimerConfig, saveTimerConfig, TimerConfig, getActiveProfileId, clearActiveProfile } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "TimerConfig">;

type ModalType = "prep" | "exercise" | "rest" | "rounds" | null;

function MenuDrawer({
  visible,
  onClose,
  onNavigate,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: "SoundSettings" | "AdvancedSettings" | "Preview" | "Profiles") => void;
}) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(-300);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateX.value = withTiming(0, { duration: 250 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateX.value = withTiming(-300, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const menuItems = [
    { key: "Profiles" as const, icon: "folder" as const, label: t("menu.profiles") },
    { key: "SoundSettings" as const, icon: "volume-2" as const, label: t("menu.soundSettings") },
    { key: "AdvancedSettings" as const, icon: "settings" as const, label: t("menu.advancedSettings") },
    { key: "Preview" as const, icon: "eye" as const, label: t("menu.preview") },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.menuBackdrop, backdropStyle]}>
        <Pressable style={styles.menuBackdropPress} onPress={onClose} />
        <Animated.View
          style={[styles.menuDrawer, { backgroundColor: theme.backgroundDefault, paddingTop: insets.top + Spacing.l }, drawerStyle]}
        >
          <ThemedText type="h2" style={styles.menuTitle}>Menu</ThemedText>
          <View style={styles.menuItems}>
            {menuItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  onNavigate(item.key);
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  { backgroundColor: pressed ? theme.backgroundSecondary : "transparent" },
                ]}
              >
                <Feather name={item.icon} size={22} color={Colors.primary} />
                <ThemedText type="body">{item.label}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

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

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    const loadedConfig = await getTimerConfig();
    setConfig(loadedConfig);

    const activeId = await getActiveProfileId();
    setActiveProfileId(activeId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConfig();
    }, [loadConfig])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton
          onPress={() => setMenuVisible(true)}
          pressColor={Colors.primary + "20"}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </HeaderButton>
      ),
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

  const handleMenuNavigate = (screen: "SoundSettings" | "AdvancedSettings" | "Preview" | "Profiles") => {
    setMenuVisible(false);
    if (screen === "Profiles") {
      navigation.navigate("Profiles");
    } else if (screen === "SoundSettings") {
      navigation.navigate("SoundSettings");
    } else if (screen === "AdvancedSettings") {
      navigation.navigate("AdvancedSettings");
    } else if (screen === "Preview") {
      navigation.navigate("WorkoutPreview", {
        prepTime: config.prepTime,
        exerciseTime: config.exerciseTime,
        restTime: config.restTime,
        rounds: config.rounds,
      });
    }
  };

  const handleConfigChange = async (key: keyof TimerConfig, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    await saveTimerConfig({ [key]: value });

    // Clear active profile when user manually edits configuration
    if (activeProfileId) {
      await clearActiveProfile();
      setActiveProfileId(null);
    }

    setHighlightedCard(key);
    setTimeout(() => setHighlightedCard(null), 300);
  };

  const handleStart = () => {
    navigation.navigate("ActiveTimer", {
      prepTime: config.prepTime,
      exerciseTime: config.exerciseTime,
      restTime: config.restTime,
      rounds: config.rounds,
    });
  };

  const totalTime = config.rounds > 0 
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
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={handleMenuNavigate}
      />
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
            {config.rounds === 0 ? formatDisplayTime(config.prepTime) : formatTime(totalTime)}
          </ThemedText>
        </View>

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

        <Pressable
          onPress={() => navigation.navigate("WorkoutPreview", {
            prepTime: config.prepTime,
            exerciseTime: config.exerciseTime,
            restTime: config.restTime,
            rounds: config.rounds,
          })}
          style={({ pressed }) => [
            styles.previewButton,
            { backgroundColor: theme.backgroundSecondary },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Feather name="eye" size={18} color={Colors.primary} />
          <ThemedText type="body" style={{ color: Colors.primary }}>
            {t("menu.preview")}
          </ThemedText>
        </Pressable>
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
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.s,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    marginTop: Spacing.l,
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
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuBackdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  menuDrawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    paddingHorizontal: Spacing.l,
  },
  menuTitle: {
    marginBottom: Spacing.xl,
  },
  menuItems: {
    gap: Spacing.s,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
  },
});
