import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSilentMode } from "@/contexts/SilentModeContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export function SilentModeIndicator() {
  const { isSilentMode } = useSilentMode();
  const { theme } = useTheme();

  // Animação de fade suave
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1, // Repetir infinitamente
      true // Reverter (ping-pong effect)
    ),
  }));

  if (!isSilentMode) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.backgroundSecondary }, animatedStyle]}>
      <Ionicons name="volume-mute" size={20} color={theme.textSecondary} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Spacing.m,
    right: Spacing.m,
    borderRadius: 20,
    padding: Spacing.s,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
