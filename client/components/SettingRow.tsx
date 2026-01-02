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
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  showChevron?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SettingRow({
  label,
  icon,
  value,
  onPress,
  toggle,
  toggleValue,
  onToggleChange,
  showChevron = true,
}: SettingRowProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }
  };

  const handlePress = () => {
    if (onPress) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  const handleToggle = (val: boolean) => {
    if (onToggleChange) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onToggleChange(val);
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
        <ThemedText type="body">{label}</ThemedText>
      </View>
      <View style={styles.rightSection}>
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={handleToggle}
            trackColor={{ false: theme.backgroundTertiary, true: Colors.primaryLight }}
            thumbColor={toggleValue ? Colors.primary : theme.textSecondary}
          />
        ) : (
          <>
            {value ? (
              <ThemedText type="bodySmall" style={{ color: theme.textSecondary }}>
                {value}
              </ThemedText>
            ) : null}
            {showChevron && onPress ? (
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            ) : null}
          </>
        )}
      </View>
    </>
  );

  if (toggle) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        {content}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    minHeight: 56,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
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
