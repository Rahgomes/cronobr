import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface NumericStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  formatValue?: (value: number) => string;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 200,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StepperButton({
  onPress,
  icon,
  disabled,
}: {
  onPress: () => void;
  icon: "plus" | "minus";
  disabled: boolean;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.9, springConfig);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.stepperButton,
        {
          backgroundColor: disabled
            ? theme.backgroundSecondary
            : Colors.primaryLight + "20",
          opacity: disabled ? 0.4 : 1,
        },
        animatedStyle,
      ]}
    >
      <Feather
        name={icon}
        size={24}
        color={disabled ? theme.textSecondary : Colors.primary}
      />
    </AnimatedPressable>
  );
}

export function NumericStepper({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  label,
  icon,
  formatValue,
}: NumericStepperProps) {
  const { theme } = useTheme();

  const handleIncrement = () => {
    if (value + step <= max) {
      onValueChange(value + step);
    }
  };

  const handleDecrement = () => {
    if (value - step >= min) {
      onValueChange(value - step);
    }
  };

  const displayValue = formatValue ? formatValue(value) : `${value}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight + "20" }]}>
          <Feather name={icon} size={24} color={Colors.primary} />
        </View>
        <View style={styles.labelContainer}>
          <ThemedText type="bodySmall" style={{ color: theme.textSecondary }}>
            {label}
          </ThemedText>
          <ThemedText type="h2">{displayValue}</ThemedText>
        </View>
      </View>
      <View style={styles.stepperContainer}>
        <StepperButton
          onPress={handleDecrement}
          icon="minus"
          disabled={value <= min}
        />
        <StepperButton
          onPress={handleIncrement}
          icon="plus"
          disabled={value >= max}
        />
      </View>
    </View>
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
    minHeight: 80,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
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
  },
  stepperContainer: {
    flexDirection: "row",
    gap: Spacing.s,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
});
