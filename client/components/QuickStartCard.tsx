import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/contexts/I18nContext';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

interface QuickStartCardProps {
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function QuickStartCard({ onPress }: QuickStartCardProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.duration(300)}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: Colors.primary,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="rocket-outline" size={32} color="#FFFFFF" />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('home.quickStart.title')}</Text>
        <Text style={styles.description}>{t('home.quickStart.description')}</Text>
      </View>

      <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.m,
    minHeight: 80,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.m,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.m,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
