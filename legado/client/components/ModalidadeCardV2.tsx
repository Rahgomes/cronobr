import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../hooks/useTheme";
import { Modality } from "../types/modality";
import { WorkoutCategory } from "../lib/storage";
import { Spacing, BorderRadius } from "../constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ModalidadeCardV2Props {
  modality: Modality;
  onPress: (category: WorkoutCategory) => void;
  index: number;
}

export default function ModalidadeCardV2({
  modality,
  onPress,
  index,
}: ModalidadeCardV2Props) {
  const { theme } = useTheme();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress(modality.category);
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(index * 60).duration(300)}
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
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: modality.color + "20" }]}>
        <Ionicons name={modality.icon} size={32} color={modality.color} />
      </View>

      {/* Display Name */}
      <Text style={[styles.displayName, { color: theme.text }]} numberOfLines={1}>
        {modality.displayName}
      </Text>

      {/* Description */}
      <Text
        style={[styles.description, { color: theme.textSecondary }]}
        numberOfLines={2}
      >
        {modality.description}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "48%",
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    minHeight: 140,
    marginBottom: Spacing.m,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.s,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.s,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
});
