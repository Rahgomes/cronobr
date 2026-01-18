import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Modality } from '@/types/modality';
import { WorkoutCategory } from '@/lib/storage';

interface ModalityCardProps {
  modality: Modality;
  onPress: (category: WorkoutCategory) => void;
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ModalityCard({ modality, onPress, index }: ModalityCardProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress(modality.category);
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(index * 100).duration(300)}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {/* Icon Container with Colored Background */}
      <View style={[styles.iconContainer, { backgroundColor: modality.color + '20' }]}>
        <Ionicons name={modality.icon} size={48} color={modality.color} />
      </View>

      {/* Technical Name (Small, Caps) */}
      <Text style={[styles.technicalName, { color: theme.textSecondary }]} numberOfLines={1}>
        {modality.technicalName}
      </Text>

      {/* Display Name (Large, Bold) */}
      <Text style={[styles.displayName, { color: theme.text }]} numberOfLines={1}>
        {modality.displayName}
      </Text>

      {/* Description (Small, 2 Lines) */}
      <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
        {modality.description}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.m,
  },
  technicalName: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  displayName: {
    ...Typography.h3,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.s,
  },
  description: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 18,
  },
});
