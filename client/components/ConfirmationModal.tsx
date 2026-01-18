import React from "react";
import { Modal, View, StyleSheet, Pressable, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant?: "danger" | "warning" | "info";
}

const VARIANT_CONFIG = {
  danger: {
    icon: "trash-2" as const,
    color: Colors.error,
  },
  warning: {
    icon: "alert-triangle" as const,
    color: Colors.warning,
  },
  info: {
    icon: "info" as const,
    color: Colors.info,
  },
};

export function ConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "danger",
}: ConfirmationModalProps) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(20);

  const variantConfig = VARIANT_CONFIG[variant];

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
      translateY.value = withTiming(20, { duration: 150 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handleConfirm = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onConfirm();
  };

  const handleCancel = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
        <Animated.View
          style={[
            styles.modal,
            { backgroundColor: theme.backgroundDefault },
            modalStyle,
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${variantConfig.color}20` }]}>
            <Feather name={variantConfig.icon} size={32} color={variantConfig.color} />
          </View>

          {/* Title */}
          <ThemedText type="h3" style={styles.title}>
            {title}
          </ThemedText>

          {/* Message */}
          <ThemedText type="body" style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </ThemedText>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              onPress={handleCancel}
              variant="secondary"
              style={styles.button}
            >
              {cancelText}
            </Button>
            <Button
              onPress={handleConfirm}
              variant={variant}
              style={styles.button}
            >
              {confirmText}
            </Button>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.m,
    padding: Spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.s,
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.m,
    width: "100%",
  },
  button: {
    flex: 1,
  },
});
