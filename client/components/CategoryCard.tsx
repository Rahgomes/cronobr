import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutCategory } from '../lib/storage';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

interface CategoryCardProps {
  category: WorkoutCategory;
  profileCount: number;
  onPress: () => void;
}

// Icon mapping for each category
const categoryIcons: Record<WorkoutCategory, keyof typeof Ionicons.glyphMap> = {
  EMOM: 'time-outline',
  AMRAP: 'flash-outline',
  HIIT: 'flame-outline',
  TABATA: 'repeat-outline',
  BOXE: 'fitness-outline',
  CIRCUITO: 'grid-outline',
};

// Color mapping for each category
const categoryColors: Record<WorkoutCategory, string> = {
  EMOM: '#FFC107',
  AMRAP: '#FF6B35',
  HIIT: '#F44336',
  TABATA: '#2196F3',
  BOXE: '#9C27B0',
  CIRCUITO: '#4CAF50',
};

export default function CategoryCard({ category, profileCount, onPress }: CategoryCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const iconName = categoryIcons[category] || 'fitness-outline';
  const categoryColor = categoryColors[category] || Colors.primary;

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
      {/* Icon Container with Category Color */}
      <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
        <Ionicons name={iconName} size={40} color={categoryColor} />
      </View>

      {/* Category Name */}
      <Text style={[styles.categoryName, { color: theme.text }]} numberOfLines={1}>
        {category}
      </Text>

      {/* Profile Count */}
      <View style={[styles.countBadge, { backgroundColor: theme.backgroundSecondary }]}>
        <Text style={[styles.countText, { color: theme.textSecondary }]}>
          {profileCount} {profileCount === 1 ? 'perfil' : 'perfis'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: Spacing.xs,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.m,
  },
  categoryName: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.s,
  },
  countBadge: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.s,
  },
  countText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
