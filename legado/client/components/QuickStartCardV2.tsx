import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../hooks/useTheme";
import { useI18n } from "../contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "../constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface QuickStartCardV2Props {
  onPress: () => void;
}

export default function QuickStartCardV2({ onPress }: QuickStartCardV2Props) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(100).duration(300)}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Icon Container */}
      <View style={[styles.iconContainer, { backgroundColor: theme.backgroundRoot }]}>
        <Ionicons name="rocket" size={32} color={Colors.primary} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("home.quickStart.title")}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("home.quickStart.subtitle")}
        </Text>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    marginBottom: Spacing.l,
    minHeight: 80,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.s,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.m,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400",
  },
});
