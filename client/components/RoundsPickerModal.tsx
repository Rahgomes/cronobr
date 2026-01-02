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
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface RoundsPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (rounds: number) => void;
  initialValue: number;
  title: string;
  min?: number;
  max?: number;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

function WheelPicker({
  values,
  selectedValue,
  onValueChange,
}: {
  values: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
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
                {value}x
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function RoundsPickerModal({
  visible,
  onClose,
  onConfirm,
  initialValue,
  title,
  min = 0,
  max = 99,
}: RoundsPickerModalProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(20);

  const [rounds, setRounds] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setRounds(initialValue);
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
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onConfirm(rounds);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const roundValues = Array.from({ length: max - min + 1 }, (_, i) => min + i);

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

          <View style={styles.pickerCenter}>
            <WheelPicker
              values={roundValues}
              selectedValue={rounds}
              onValueChange={setRounds}
            />
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
    maxWidth: 280,
    borderRadius: BorderRadius.l,
    padding: Spacing.l,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  pickerCenter: {
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  wheelContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: 100,
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
