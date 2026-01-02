import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "warning" | "danger";
  loading?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getBackgroundColor = (variant: ButtonProps["variant"]) => {
  switch (variant) {
    case "primary":
      return Colors.primary;
    case "secondary":
      return Colors.info;
    case "warning":
      return Colors.warning;
    case "danger":
      return Colors.error;
    default:
      return Colors.primary;
  }
};

const getPressedColor = (variant: ButtonProps["variant"]) => {
  switch (variant) {
    case "primary":
      return Colors.primaryDark;
    case "secondary":
      return "#1976D2";
    case "warning":
      return "#F57C00";
    case "danger":
      return "#D32F2F";
    default:
      return Colors.primaryDark;
  }
};

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
  loading = false,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(getBackgroundColor(variant));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: backgroundColor.value,
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.98, springConfig);
      backgroundColor.value = getPressedColor(variant);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfig);
      backgroundColor.value = getBackgroundColor(variant);
    }
  };

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          opacity: disabled ? 0.4 : 1,
        },
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <ThemedText type="button" style={styles.buttonText}>
          {children}
        </ThemedText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.m,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.l,
  },
  buttonText: {
    color: "#FFFFFF",
  },
});
