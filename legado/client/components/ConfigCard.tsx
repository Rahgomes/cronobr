import React from "react";
import { StyleSheet, Platform, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface ConfigCardProps {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  highlightBorder?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ConfigCard({
  label,
  value,
  icon,
  onPress,
  highlightBorder = false,
}: ConfigCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (highlightBorder) {
      borderOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 150 })
      );
    }
  }, [highlightBorder]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor:
      borderOpacity.value > 0
        ? `rgba(255, 107, 53, ${borderOpacity.value})`
        : theme.border,
    borderWidth: borderOpacity.value > 0 ? 2 : 1,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
        borderStyle,
      ]}
    >
      <Animated.View style={styles.leftSection}>
        <Animated.View
          style={[
            styles.iconContainer,
            { backgroundColor: Colors.primaryLight + "20" },
          ]}
        >
          <Feather name={icon} size={24} color={Colors.primary} />
        </Animated.View>
        <Animated.View style={styles.labelContainer}>
          <ThemedText type="bodySmall" style={{ color: theme.textSecondary }}>
            {label}
          </ThemedText>
          <ThemedText type="h2">{value}</ThemedText>
        </Animated.View>
      </Animated.View>
      <Feather name="chevron-right" size={24} color={theme.textSecondary} />
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
    minHeight: 80,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.s,
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    gap: 2,
    flex: 1,
  },
});
