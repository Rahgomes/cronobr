import React from "react";
import { View, StyleSheet, Pressable, Switch, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface SettingRowProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  type?: "navigation" | "toggle" | "info";
  onToggle?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SettingRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  type = "navigation",
  onToggle,
}: SettingRowProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress || onToggle) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    if (onPress || onToggle) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onToggle) {
      onToggle();
    } else if (onPress) {
      onPress();
    }
  };

  const content = (
    <>
      <View style={styles.leftSection}>
        {icon ? (
          <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight + "20" }]}>
            <Feather name={icon} size={20} color={Colors.primary} />
          </View>
        ) : null}
        <View style={styles.textContainer}>
          <ThemedText type="body">{title}</ThemedText>
          {subtitle ? (
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>
      <View style={styles.rightSection}>
        {type === "toggle" ? (
          <Switch
            value={value === "true"}
            onValueChange={() => onToggle?.()}
            trackColor={{ false: theme.backgroundTertiary, true: Colors.primaryLight }}
            thumbColor={value === "true" ? Colors.primary : theme.textSecondary}
          />
        ) : (
          <>
            {value ? (
              <ThemedText type="bodySmall" style={{ color: theme.textSecondary }}>
                {value}
              </ThemedText>
            ) : null}
            {type === "navigation" ? (
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            ) : null}
          </>
        )}
      </View>
    </>
  );

  if (type === "toggle") {
    return (
      <Pressable
        onPress={handlePress}
        style={styles.rowContent}
      >
        {content}
      </Pressable>
    );
  }

  if (type === "info") {
    return (
      <View style={styles.rowContent}>
        {content}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.rowContent, animatedStyle]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.m,
    minHeight: 56,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    flex: 1,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.s,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
});
