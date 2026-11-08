import React from "react";
import { View, StyleSheet, Modal, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { NavigationProp } from "@react-navigation/native";

import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export type MenuScreen = "Profiles" | "History" | "SoundSettings" | "AdvancedSettings";

export interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  navigation: NavigationProp<RootStackParamList>;
}

export default function MenuDrawer({
  visible,
  onClose,
  navigation,
}: MenuDrawerProps) {
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

  const handleNavigate = (screen: MenuScreen) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
    navigation.navigate(screen);
  };

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.menuBackdrop, backdropStyle]}>
        <Pressable style={styles.menuBackdropPress} onPress={handleClose} />
        <Animated.View
          style={[
            styles.menuDrawer,
            { backgroundColor: theme.backgroundDefault, paddingTop: insets.top + Spacing.l },
            drawerStyle,
          ]}
        >
          <View style={styles.menuHeader}>
            <ThemedText type="h2" style={styles.menuTitle}>
              {t("menu.title")}
            </ThemedText>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.5 : 1 },
              ]}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.menuItems}>
            {menuItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => handleNavigate(item.key)}
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

const styles = StyleSheet.create({
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
