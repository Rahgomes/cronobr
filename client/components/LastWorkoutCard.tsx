import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/contexts/I18nContext';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { WorkoutHistoryEntry } from '@/lib/storage';
import { formatDate, formatDuration } from '@/utils/dateUtils';

interface LastWorkoutCardProps {
  entry: WorkoutHistoryEntry | null;
  onRepeat: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function LastWorkoutCard({ entry, onRepeat }: LastWorkoutCardProps) {
  const { theme } = useTheme();
  const { t, language } = useI18n();

  if (!entry) return null;

  const handleRepeat = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onRepeat();
  };

  const workoutName = entry.presetName || t('home.lastWorkout.manual');
  const isCompleted = !entry.wasInterrupted;
  const statusColor = isCompleted ? Colors.success : Colors.warning;
  const statusText = isCompleted
    ? t('home.lastWorkout.completed')
    : t('home.lastWorkout.interrupted');

  return (
    <AnimatedView
      entering={FadeInDown.delay(100).duration(300)}
      style={[styles.container, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="time-outline" size={20} color={theme.text} />
          <Text style={[styles.title, { color: theme.text }]}>
            {t('home.lastWorkout.title')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      {/* Workout Info */}
      <Text style={[styles.workoutName, { color: theme.text }]} numberOfLines={1}>
        {workoutName}
      </Text>

      {/* Metadata Row */}
      <View style={styles.metadata}>
        <View style={styles.metaItem}>
          <Ionicons name="timer-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {formatDuration(entry.duration)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {formatDate(entry.date, language)}
          </Text>
        </View>
        {entry.presetCategory && (
          <View style={styles.metaItem}>
            <Ionicons name="fitness-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {entry.presetCategory}
            </Text>
          </View>
        )}
      </View>

      {/* Repeat Button */}
      <Pressable
        onPress={handleRepeat}
        style={({ pressed }) => [
          styles.repeatButton,
          {
            backgroundColor: Colors.primary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
        <Text style={styles.repeatButtonText}>{t('home.lastWorkout.repeat')}</Text>
      </Pressable>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    marginBottom: Spacing.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  title: {
    ...Typography.caption,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: BorderRadius.s,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  workoutName: {
    ...Typography.h3,
    fontWeight: '700',
    marginBottom: Spacing.s,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.m,
    marginBottom: Spacing.m,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.m,
  },
  repeatButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
