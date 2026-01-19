import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  getWorkoutProfiles,
  applyProfile,
  getActiveProfileId,
  WorkoutProfile,
  WorkoutCategory,
} from '../lib/storage';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { RootStackParamList } from '../navigation/RootStackNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryPresets'>;

export default function CategoryPresetsScreen({ navigation, route }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const { category } = route.params;

  const [profiles, setProfiles] = useState<WorkoutProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    const allProfiles = await getWorkoutProfiles();
    const categoryProfiles = allProfiles.filter((p) => p.category === category);
    setProfiles(categoryProfiles);

    const activeId = await getActiveProfileId();
    setActiveProfileId(activeId);
  }, [category]);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [loadProfiles])
  );

  const handleSelectProfile = async (profile: WorkoutProfile) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Save profile as active
    await applyProfile(profile.id);
    setActiveProfileId(profile.id);

    // Navigate to ManualConfig with preset data (allow user to edit before starting)
    navigation.navigate('ManualConfig', {
      preset: {
        prepTime: profile.config.prepTime,
        exerciseTime: profile.config.exerciseTime,
        restTime: profile.config.restTime,
        rounds: profile.config.rounds,
        presetName: profile.name,
        category: profile.category,
      },
    });
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: `${category} - Perfis`,
    });
  }, [navigation, category]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: theme.textSecondary }]}>
            {profiles.length} {profiles.length === 1 ? 'perfil disponível' : 'perfis disponíveis'}
          </Text>
        </View>

        {/* Profile List */}
        {profiles.map((profile, index) => {
          const isActive = profile.id === activeProfileId;

          return (
            <Pressable
              key={profile.id}
              onPress={() => handleSelectProfile(profile)}
              style={({ pressed }) => [
                styles.profileCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: isActive ? Colors.primary : theme.border,
                  borderWidth: isActive ? 2 : 1,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              {/* Active Indicator */}
              {isActive && (
                <View style={styles.activeIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                </View>
              )}

              {/* Profile Name */}
              <Text style={[styles.profileName, { color: theme.text }]}>
                {profile.name}
              </Text>

              {/* Description */}
              {profile.description && (
                <Text style={[styles.profileDescription, { color: theme.textSecondary }]}>
                  {profile.description}
                </Text>
              )}

              {/* Config Details */}
              <View style={styles.configContainer}>
                <View style={styles.configItem}>
                  <Ionicons name="timer-outline" size={16} color={Colors.phasePreparation} />
                  <Text style={[styles.configText, { color: theme.textSecondary }]}>
                    Prep: {profile.config.prepTime}s
                  </Text>
                </View>

                <View style={styles.configItem}>
                  <Ionicons name="fitness-outline" size={16} color={Colors.phaseExercise} />
                  <Text style={[styles.configText, { color: theme.textSecondary }]}>
                    Exerc: {profile.config.exerciseTime}s
                  </Text>
                </View>

                <View style={styles.configItem}>
                  <Ionicons name="pause-outline" size={16} color={Colors.phaseRest} />
                  <Text style={[styles.configText, { color: theme.textSecondary }]}>
                    Desc: {profile.config.restTime}s
                  </Text>
                </View>

                <View style={styles.configItem}>
                  <Ionicons name="repeat-outline" size={16} color={Colors.primary} />
                  <Text style={[styles.configText, { color: theme.textSecondary }]}>
                    {profile.config.rounds} rounds
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.m,
    paddingBottom: Spacing.xxl,
  },
  headerContainer: {
    marginBottom: Spacing.m,
  },
  headerText: {
    ...Typography.bodySmall,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    padding: Spacing.l,
    marginBottom: Spacing.m,
    borderRadius: BorderRadius.m,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: Spacing.m,
    right: Spacing.m,
  },
  profileName: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  profileDescription: {
    ...Typography.body,
    marginBottom: Spacing.m,
  },
  configContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.m,
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  configText: {
    ...Typography.bodySmall,
  },
});
