import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WorkoutHistoryEntry } from '../lib/storage';
import { formatDate, formatDuration } from '../utils/dateUtils';
import { useI18n } from '../contexts/I18nContext';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

interface HistoryListItemProps {
  entry: WorkoutHistoryEntry;
  onPress: () => void;
  onDelete: () => void;
}

export default function HistoryListItem({ entry, onPress, onDelete }: HistoryListItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const { t, language } = useI18n();

  // Determine workout name
  const workoutName = entry.type === 'preset' && entry.presetName
    ? entry.presetName
    : t('history.workoutManual');

  // Status icon and color
  const statusIcon = entry.wasInterrupted ? 'close-circle' : 'checkmark-circle';
  const statusColor = entry.wasInterrupted ? Colors.error : Colors.success;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {/* Status Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name={statusIcon} size={32} color={statusColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Workout Name */}
        <Text
          style={[styles.workoutName, { color: theme.text }]}
          numberOfLines={1}
        >
          {workoutName}
        </Text>

        {/* Date and Time */}
        <Text style={[styles.dateTime, { color: theme.textSecondary }]}>
          {formatDate(entry.date, language)}
        </Text>

        {/* Rounds Info */}
        <Text style={[styles.rounds, { color: theme.textSecondary }]}>
          {entry.completedRounds}/{entry.config.rounds} {t('history.rounds').toLowerCase()}
        </Text>
      </View>

      {/* Duration */}
      <View style={styles.durationContainer}>
        <Text style={[styles.duration, { color: theme.text }]}>
          {formatDuration(entry.duration)}
        </Text>
        {entry.type === 'preset' && entry.presetCategory && (
          <Text style={[styles.category, { color: theme.textSecondary }]}>
            {entry.presetCategory}
          </Text>
        )}
      </View>

      {/* Delete Button */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          onDelete();
        }}
        style={({ pressed }) => [
          styles.deleteButton,
          { opacity: pressed ? 0.5 : 1 }
        ]}
      >
        <Ionicons name="trash-outline" size={20} color={Colors.error} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    marginHorizontal: Spacing.m,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
  },
  iconContainer: {
    marginRight: Spacing.m,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  workoutName: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  dateTime: {
    ...Typography.bodySmall,
    marginBottom: 2,
  },
  rounds: {
    ...Typography.caption,
  },
  durationContainer: {
    alignItems: 'flex-end',
  },
  duration: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  category: {
    ...Typography.caption,
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: Spacing.s,
    marginLeft: Spacing.s,
  },
});
