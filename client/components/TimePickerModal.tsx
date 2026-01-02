import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (seconds: number) => void;
  initialValue: number;
  title: string;
  maxMinutes?: number;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

function WheelPicker({
  values,
  selectedValue,
  onValueChange,
  suffix,
}: {
  values: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  suffix?: string;
}) {
  const { theme } = useTheme();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (!isScrolling) {
      const index = values.indexOf(selectedValue);
      if (index !== -1 && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: false,
        });
      }
    }
  }, [selectedValue, values, isScrolling]);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, values.length - 1));
    if (values[clampedIndex] !== selectedValue) {
      onValueChange(values[clampedIndex]);
      if (Platform.OS !== "web") {
        Haptics.selectionAsync();
      }
    }
  };

  const handleScrollBegin = () => setIsScrolling(true);
  const handleScrollEnd = (event: any) => {
    setIsScrolling(false);
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, values.length - 1));
    scrollViewRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });
    onValueChange(values[clampedIndex]);
  };

  return (
    <View style={styles.wheelContainer}>
      <View
        style={[
          styles.selectionIndicator,
          { backgroundColor: Colors.primary + "20" },
        ]}
      />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * 2,
        }}
      >
        {values.map((value) => {
          const isSelected = value === selectedValue;
          return (
            <Pressable
              key={value}
              onPress={() => {
                const index = values.indexOf(value);
                scrollViewRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
                onValueChange(value);
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync();
                }
              }}
              style={styles.wheelItem}
            >
              <ThemedText
                type={isSelected ? "h2" : "body"}
                style={{
                  color: isSelected ? Colors.primary : theme.textSecondary,
                  opacity: isSelected ? 1 : 0.5,
                }}
              >
                {value.toString().padStart(2, "0")}
                {suffix ? suffix : ""}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TimePickerModal({
  visible,
  onClose,
  onConfirm,
  initialValue,
  title,
  maxMinutes = 99,
}: TimePickerModalProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(20);

  const [minutes, setMinutes] = useState(Math.floor(initialValue / 60));
  const [seconds, setSeconds] = useState(initialValue % 60);

  useEffect(() => {
    if (visible) {
      setMinutes(Math.floor(initialValue / 60));
      setSeconds(initialValue % 60);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
      translateY.value = withTiming(20, { duration: 150 });
    }
  }, [visible, initialValue]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handleConfirm = () => {
    const totalSeconds = minutes * 60 + seconds;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onConfirm(totalSeconds);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const minuteValues = Array.from({ length: maxMinutes + 1 }, (_, i) => i);
  const secondValues = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={styles.backdropPress} onPress={handleCancel} />
        <Animated.View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.backgroundDefault },
            modalStyle,
          ]}
        >
          <View style={styles.header}>
            <ThemedText type="h3">{title}</ThemedText>
          </View>

          <View style={styles.pickersRow}>
            <View style={styles.pickerColumn}>
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}
              >
                {t("time.minutes") || "min"}
              </ThemedText>
              <WheelPicker
                values={minuteValues}
                selectedValue={minutes}
                onValueChange={setMinutes}
              />
            </View>
            <ThemedText type="h2" style={{ marginTop: Spacing.l }}>
              :
            </ThemedText>
            <View style={styles.pickerColumn}>
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}
              >
                {t("time.seconds") || "sec"}
              </ThemedText>
              <WheelPicker
                values={secondValues}
                selectedValue={seconds}
                onValueChange={setSeconds}
              />
            </View>
          </View>

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
  pickersRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.m,
    marginBottom: Spacing.l,
  },
  pickerColumn: {
    alignItems: "center",
  },
  wheelContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: 80,
    overflow: "hidden",
  },
  selectionIndicator: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: BorderRadius.s,
    zIndex: -1,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
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
