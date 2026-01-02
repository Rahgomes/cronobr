import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, TextInput, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { parseTimeInput } from "@/lib/i18n";

interface NumericStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  formatValue?: (value: number) => string;
  isTimeInput?: boolean;
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
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
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
  isTimeInput = true,
}: NumericStepperProps) {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [inputText, setInputText] = useState("");
  const [inputError, setInputError] = useState(false);
  const inputScale = useSharedValue(1);

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

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

  const handleValuePress = useCallback(() => {
    if (isTimeInput) {
      setIsEditing(true);
      setInputText("");
      setInputError(false);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [isTimeInput]);

  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    setInputError(false);
  }, []);

  const handleInputSubmit = useCallback(() => {
    if (!inputText.trim()) {
      setIsEditing(false);
      return;
    }

    const parsed = parseTimeInput(inputText);
    
    if (parsed !== null && parsed >= min && parsed <= max) {
      onValueChange(parsed);
      setIsEditing(false);
      setInputError(false);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      setInputError(true);
      inputScale.value = withSequence(
        withSpring(1.05, { damping: 10, stiffness: 400 }),
        withSpring(0.95, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 400 })
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [inputText, min, max, onValueChange, inputScale]);

  const handleInputBlur = useCallback(() => {
    if (inputText.trim()) {
      handleInputSubmit();
    } else {
      setIsEditing(false);
      setInputError(false);
    }
  }, [inputText, handleInputSubmit]);

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
          {isEditing ? (
            <Animated.View style={inputAnimatedStyle}>
              <TextInput
                style={[
                  styles.manualInput,
                  {
                    color: theme.text,
                    backgroundColor: inputError ? Colors.error + "20" : theme.backgroundSecondary,
                    borderColor: inputError ? Colors.error : Colors.primary,
                  },
                ]}
                value={inputText}
                onChangeText={handleInputChange}
                onSubmitEditing={handleInputSubmit}
                onBlur={handleInputBlur}
                placeholder="30 or 1:30"
                placeholderTextColor={theme.textSecondary}
                keyboardType="default"
                autoFocus
                returnKeyType="done"
              />
            </Animated.View>
          ) : (
            <Pressable onPress={handleValuePress}>
              <ThemedText 
                type="h2" 
                style={isTimeInput ? { textDecorationLine: "underline", textDecorationStyle: "dotted" } : undefined}
              >
                {displayValue}
              </ThemedText>
            </Pressable>
          )}
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
  manualInput: {
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.s,
    borderWidth: 2,
    minWidth: 80,
  },
});
