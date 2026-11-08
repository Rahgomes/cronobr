import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  getWorkoutProfiles,
  applyProfile,
  getActiveProfileId,
  WorkoutProfile,
  WorkoutCategory,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Profiles">;

const CATEGORY_ICONS: Record<WorkoutCategory, keyof typeof Feather.glyphMap> = {
  EMOM: "clock",
  AMRAP: "zap",
  HIIT: "activity",
  TABATA: "repeat",
  BOXE: "shield",
  CIRCUITO: "grid",
};

export default function ProfilesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useI18n();

  const [profiles, setProfiles] = useState<WorkoutProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    const loadedProfiles = await getWorkoutProfiles();
    setProfiles(loadedProfiles);

    const activeId = await getActiveProfileId();
    setActiveProfileId(activeId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [loadProfiles])
  );

  const handleSelectProfile = async (profile: WorkoutProfile) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await applyProfile(profile.id);
    setActiveProfileId(profile.id);
    navigation.goBack();
  };

  const categories = Array.from(new Set(profiles.map(p => p.category)));
  const profilesByCategory = (category: WorkoutCategory) =>
    profiles.filter(p => p.category === category);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.m,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.m,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="caption" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("profiles.selectProfile")}
        </ThemedText>

        {categories.map((category, categoryIndex) => (
          <Animated.View
            key={category}
            entering={FadeInDown.delay(categoryIndex * 100).duration(300)}
            style={styles.categorySection}
          >
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIconContainer, { backgroundColor: Colors.primary + "20" }]}>
                <Feather name={CATEGORY_ICONS[category]} size={20} color={Colors.primary} />
              </View>
              <ThemedText type="h3">{t(`profiles.categories.${category.toLowerCase()}`)}</ThemedText>
            </View>

            <View style={styles.profilesGrid}>
              {profilesByCategory(category).map((profile) => (
                <Pressable
                  key={profile.id}
                  onPress={() => handleSelectProfile(profile)}
                  style={({ pressed }) => [
                    styles.profileCard,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: activeProfileId === profile.id ? Colors.primary : theme.border,
                      borderWidth: activeProfileId === profile.id ? 2 : 1,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  {activeProfileId === profile.id && (
                    <View style={[styles.activeBadge, { backgroundColor: Colors.primary }]}>
                      <Feather name="check" size={12} color="#FFFFFF" />
                    </View>
                  )}

                  <ThemedText type="body" style={styles.profileName}>
                    {profile.name}
                  </ThemedText>
                  <ThemedText type="caption" style={[styles.profileDescription, { color: theme.textSecondary }]}>
                    {profile.description}
                  </ThemedText>

                  <View style={styles.profileStats}>
                    <View style={styles.statItem}>
                      <Feather name="zap" size={12} color={theme.textSecondary} />
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        {profile.config.exerciseTime}s
                      </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <Feather name="repeat" size={12} color={theme.textSecondary} />
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        {profile.config.rounds}x
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ))}
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
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.l,
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    marginBottom: Spacing.m,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.s,
    alignItems: "center",
    justifyContent: "center",
  },
  profilesGrid: {
    gap: Spacing.m,
  },
  profileCard: {
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    position: "relative",
  },
  activeBadge: {
    position: "absolute",
    top: Spacing.s,
    right: Spacing.s,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  profileDescription: {
    marginBottom: Spacing.s,
  },
  profileStats: {
    flexDirection: "row",
    gap: Spacing.m,
    marginTop: Spacing.s,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
