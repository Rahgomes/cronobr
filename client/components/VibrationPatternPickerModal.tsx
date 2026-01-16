import React, { useState } from "react";
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
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { useSound } from "@/contexts/SoundContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { VibrationPattern } from "@/lib/storage";

interface VibrationPatternPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (pattern: VibrationPattern) => void;
  currentValue: VibrationPattern;
  title: string;
}

const PATTERN_OPTIONS: VibrationPattern[] = ["none", "short", "long", "pulsed"];

export function VibrationPatternPickerModal({
  visible,
  onClose,
  onConfirm,
  currentValue,
  title,
}: VibrationPatternPickerModalProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { triggerVibration } = useSound();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(20);

  const [selected, setSelected] = useState(currentValue);

  React.useEffect(() => {
    if (visible) {
      setSelected(currentValue);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
      translateY.value = withTiming(20, { duration: 150 });
    }
  }, [visible, currentValue]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handleConfirm = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onConfirm(selected);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleTest = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await triggerVibration(selected);
  };

  const getPatternLabel = (pattern: VibrationPattern): string => {
    switch (pattern) {
      case "none":
        return t("vibration.none");
      case "short":
        return t("vibration.short");
      case "long":
        return t("vibration.long");
      case "pulsed":
        return t("vibration.pulsed");
      default:
        return pattern;
    }
  };

  const getPatternDescription = (pattern: VibrationPattern): string => {
    switch (pattern) {
      case "none":
        return t("vibration.noneDescription");
      case "short":
        return t("vibration.shortDescription");
      case "long":
        return t("vibration.longDescription");
      case "pulsed":
        return t("vibration.pulsedDescription");
      default:
        return "";
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={styles.backdropPress} onPress={handleCancel} />
        <Animated.View
          style={[styles.modalContainer, { backgroundColor: theme.backgroundDefault }, modalStyle]}
        >
          <View style={styles.header}>
            <ThemedText type="h3">{title}</ThemedText>
          </View>

          <View style={styles.optionsContainer}>
            {PATTERN_OPTIONS.map((pattern) => (
              <Pressable
                key={pattern}
                onPress={() => {
                  setSelected(pattern);
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  { backgroundColor: theme.backgroundSecondary },
                  selected === pattern && { borderColor: Colors.primary, borderWidth: 2 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.optionTextContainer}>
                  <ThemedText type="body">{getPatternLabel(pattern)}</ThemedText>
                  <ThemedText type="caption" style={styles.optionDescription}>
                    {getPatternDescription(pattern)}
                  </ThemedText>
                </View>
                {selected === pattern ? (
                  <Feather name="check-circle" size={20} color={Colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleTest}
            style={({ pressed }) => [
              styles.testButton,
              { backgroundColor: theme.backgroundSecondary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Feather name="zap" size={18} color={Colors.primary} />
            <ThemedText type="button" style={{ color: Colors.primary }}>
              {t("vibration.test")}
            </ThemedText>
          </Pressable>

          <View style={styles.buttonsRow}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.backgroundSecondary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <ThemedText type="button">{t("common.cancel")}</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: Colors.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <ThemedText type="button" style={{ color: "#FFFFFF" }}>
                OK
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: "85%",
    maxWidth: 320,
    borderRadius: BorderRadius.l,
    padding: Spacing.l,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  optionsContainer: {
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionTextContainer: {
    flex: 1,
    marginRight: Spacing.s,
  },
  optionDescription: {
    marginTop: 4,
    opacity: 0.7,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.s,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.m,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  button: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.m,
    justifyContent: "center",
    alignItems: "center",
  },
});
