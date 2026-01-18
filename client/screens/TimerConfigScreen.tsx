import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Modal, Pressable, Platform, Dimensions } from "react-native";
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
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getTimerConfig, TimerConfig } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "TimerConfig">;

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - Spacing.m * 3) / 2;

interface ModalityConfig {
  prepTime: number;
  exerciseTime: number;
  restTime: number;
  rounds: number;
}

const MODALITY_CONFIGS: Record<string, ModalityConfig> = {
  hiit: { prepTime: 10, exerciseTime: 40, restTime: 20, rounds: 8 },
  tabata: { prepTime: 10, exerciseTime: 20, restTime: 10, rounds: 8 },
  emom: { prepTime: 10, exerciseTime: 50, restTime: 10, rounds: 10 },
  amrap: { prepTime: 10, exerciseTime: 60, restTime: 0, rounds: 5 },
  boxe: { prepTime: 10, exerciseTime: 180, restTime: 60, rounds: 3 },
  mobilidade: { prepTime: 5, exerciseTime: 30, restTime: 10, rounds: 6 },
};

function MenuDrawer({
  visible,
  onClose,
  onNavigate,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: "SoundSettings" | "AdvancedSettings" | "Profiles" | "History") => void;
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
    { key: "History" as const, icon: "clock" as const, label: t("menu.history") },
    { key: "SoundSettings" as const, icon: "volume-2" as const, label: t("menu.soundSettings") },
    { key: "AdvancedSettings" as const, icon: "settings" as const, label: t("menu.advancedSettings") },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.menuBackdrop, backdropStyle]}>
        <Pressable style={styles.menuBackdropPress} onPress={onClose} />
        <Animated.View
          style={[styles.menuDrawer, { backgroundColor: theme.backgroundDefault, paddingTop: insets.top + Spacing.l }, drawerStyle]}
        >
          <View style={styles.menuHeader}>
            <ThemedText type="h2" style={styles.menuTitle}>Menu</ThemedText>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onClose();
              }}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.5 : 1 }
              ]}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

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

function ModalityCard({
  icon,
  iconColor,
  iconBgColor,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBgColor: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.modalityCard,
          { backgroundColor: theme.backgroundSecondary, width: cardWidth },
          animatedStyle,
        ]}
      >
        <View style={[styles.modalityIcon, { backgroundColor: iconBgColor }]}>
          <Feather name={icon} size={20} color={iconColor} />
        </View>
        <ThemedText type="body" style={styles.modalityTitle}>{title}</ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {description}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

function QuickStartCard({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.quickStartCard,
          { backgroundColor: theme.backgroundSecondary },
          animatedStyle,
        ]}
      >
        <View style={styles.quickStartLeft}>
          <View style={styles.quickStartIconContainer}>
            <Feather name="zap" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.quickStartText}>
            <ThemedText type="h3">{t("home.quickStart.title")}</ThemedText>
            <ThemedText type="bodySmall" style={{ color: theme.textSecondary }}>
              {t("home.quickStart.subtitle")}
            </ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={24} color={theme.textSecondary} />
      </Animated.View>
    </Pressable>
  );
}

function PreviewButton({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
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
  );
}

export default function TimerConfigScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useI18n();

  const [config, setConfig] = useState<TimerConfig>({
    prepTime: 10,
    exerciseTime: 30,
    restTime: 15,
    rounds: 5,
  });

  const [menuVisible, setMenuVisible] = useState(false);

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

  const handleMenuNavigate = (screen: "SoundSettings" | "AdvancedSettings" | "Profiles" | "History") => {
    setMenuVisible(false);
    if (screen === "SoundSettings") {
      navigation.navigate("SoundSettings");
    } else if (screen === "AdvancedSettings") {
      navigation.navigate("AdvancedSettings");
    } else if (screen === "Profiles") {
      navigation.navigate("Profiles");
    } else if (screen === "History") {
      navigation.navigate("History");
    }
  };

  const handleQuickStart = () => {
    navigation.navigate("ManualConfig");
  };

  const handleModalityPress = (modality: string) => {
    const modalityConfig = MODALITY_CONFIGS[modality];
    navigation.navigate("ActiveTimer", modalityConfig);
  };

  const handlePreview = () => {
    navigation.navigate("WorkoutPreview", {
      prepTime: config.prepTime,
      exerciseTime: config.exerciseTime,
      restTime: config.restTime,
      rounds: config.rounds,
    });
  };

  const modalities = [
    {
      key: "hiit",
      icon: "activity" as const,
      iconColor: "#FF4D4D",
      iconBgColor: "rgba(255, 77, 77, 0.2)",
      title: t("home.modalities.hiit.name"),
      description: t("home.modalities.hiit.description"),
    },
    {
      key: "tabata",
      icon: "refresh-cw" as const,
      iconColor: "#FF9500",
      iconBgColor: "rgba(255, 149, 0, 0.2)",
      title: t("home.modalities.tabata.name"),
      description: t("home.modalities.tabata.description"),
    },
    {
      key: "emom",
      icon: "clock" as const,
      iconColor: "#FFD60A",
      iconBgColor: "rgba(255, 214, 10, 0.2)",
      title: t("home.modalities.emom.name"),
      description: t("home.modalities.emom.description"),
    },
    {
      key: "amrap",
      icon: "zap" as const,
      iconColor: "#30D158",
      iconBgColor: "rgba(48, 209, 88, 0.2)",
      title: t("home.modalities.amrap.name"),
      description: t("home.modalities.amrap.description"),
    },
    {
      key: "boxe",
      icon: "target" as const,
      iconColor: "#BF5AF2",
      iconBgColor: "rgba(191, 90, 242, 0.2)",
      title: t("home.modalities.boxe.name"),
      description: t("home.modalities.boxe.description"),
    },
    {
      key: "mobilidade",
      icon: "wind" as const,
      iconColor: "#FF6B6B",
      iconBgColor: "rgba(255, 107, 107, 0.2)",
      title: t("home.modalities.mobilidade.name"),
      description: t("home.modalities.mobilidade.description"),
    },
  ];

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
          paddingTop: headerHeight + Spacing.l,
          paddingBottom: insets.bottom + Spacing.xxl,
          paddingHorizontal: Spacing.m,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("home.subtitle")}
        </ThemedText>

        <QuickStartCard onPress={handleQuickStart} />

        <ThemedText type="body" style={styles.sectionTitle}>
          {t("home.modalitiesTitle")}
        </ThemedText>

        <View style={styles.modalitiesGrid}>
          {modalities.map((modality, index) => (
            <ModalityCard
              key={modality.key}
              icon={modality.icon}
              iconColor={modality.iconColor}
              iconBgColor={modality.iconBgColor}
              title={modality.title}
              description={modality.description}
              onPress={() => handleModalityPress(modality.key)}
            />
          ))}
        </View>

        <PreviewButton onPress={handlePreview} />
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
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.l,
  },
  quickStartCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    marginBottom: Spacing.xl,
  },
  quickStartLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  quickStartIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.m,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quickStartText: {
    gap: 2,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
    fontWeight: "600" as const,
  },
  modalitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.m,
    marginBottom: Spacing.xl,
  },
  modalityCard: {
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    gap: Spacing.s,
  },
  modalityIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.m,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  modalityTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.s,
    padding: Spacing.m,
    borderRadius: BorderRadius.round,
    alignSelf: "center",
    paddingHorizontal: Spacing.l,
  },
  previewIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
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
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.l,
    paddingHorizontal: Spacing.m,
  },
  menuTitle: {
    flex: 1,
  },
  closeButton: {
    padding: Spacing.s,
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
