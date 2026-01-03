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
import { SoundType } from "@/lib/storage";

interface SoundPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (sound: SoundType) => void;
  currentValue: SoundType;
  title: string;
}

const SOUND_OPTIONS: SoundType[] = ["none", "beep1", "beep2", "beep3"];

export function SoundPickerModal({
  visible,
  onClose,
  onConfirm,
  currentValue,
  title,
}: SoundPickerModalProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { playSound } = useSound();
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
    await playSound(selected);
  };

  const getSoundLabel = (sound: SoundType): string => {
    switch (sound) {
      case "none":
        return t("soundSettings.noSound");
      case "beep1":
        return t("soundSettings.sound1");
      case "beep2":
        return t("soundSettings.sound2");
      case "beep3":
        return t("soundSettings.sound3");
      default:
        return sound;
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
            {SOUND_OPTIONS.map((sound) => (
              <Pressable
                key={sound}
                onPress={() => {
                  setSelected(sound);
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  { backgroundColor: theme.backgroundSecondary },
                  selected === sound && { borderColor: Colors.primary, borderWidth: 2 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <ThemedText type="body">{getSoundLabel(sound)}</ThemedText>
                {selected === sound ? (
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
            <Feather name="play" size={18} color={Colors.primary} />
            <ThemedText type="button" style={{ color: Colors.primary }}>
              {t("soundSettings.testSound")}
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
