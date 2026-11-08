import React from "react";
import { View, Image, Pressable, StyleSheet, Platform, ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HeroCardProps {
  onPress?: () => void;
  style?: ViewStyle;
}

export default function HeroCard({ onPress, style }: HeroCardProps) {
  const { theme } = useTheme();

  return (
    <AnimatedPressable
      entering={FadeInDown.duration(400)}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.container, style]}
    >
      <Image
        source={require("../../assets/images/hero-home.png")}
        style={styles.image}
        resizeMode="cover"
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.m,
    overflow: "hidden",
    marginBottom: Spacing.l,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
