import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, TextInput, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getProfile, saveProfile, Profile } from "@/lib/storage";
import { avatars, getAvatarLabel } from "@/constants/avatars";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AvatarOption({
  avatar,
  selected,
  onPress,
  language,
}: {
  avatar: typeof avatars[0];
  selected: boolean;
  onPress: () => void;
  language: string;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.avatarOption,
        {
          backgroundColor: selected ? Colors.primaryLight + "30" : theme.backgroundDefault,
          borderColor: selected ? Colors.primary : theme.border,
          borderWidth: selected ? 2 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.avatarIconContainer, { backgroundColor: Colors.primaryLight + "20" }]}>
        <Feather name={avatar.icon} size={28} color={Colors.primary} />
      </View>
      <ThemedText type="caption" numberOfLines={1}>
        {getAvatarLabel(avatar.labelKey, language)}
      </ThemedText>
    </AnimatedPressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t, language } = useI18n();

  const [profile, setProfile] = useState<Profile>({
    name: t("profile.athlete"),
    avatarIndex: 0,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [nameError, setNameError] = useState(false);

  const loadProfile = useCallback(async () => {
    const loadedProfile = await getProfile();
    setProfile(loadedProfile);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      setHasChanges(false);
      setNameError(false);
    }, [loadProfile])
  );

  const handleSave = useCallback(async () => {
    if (!profile.name.trim()) {
      setNameError(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    
    await saveProfile(profile);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    navigation.goBack();
  }, [profile, navigation]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("profile.title"),
      headerRight: () => (
        <HeaderButton
          onPress={handleSave}
          pressColor={Colors.primary + "20"}
        >
          <ThemedText type="button" style={{ color: Colors.primary }}>
            {t("common.save")}
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, handleSave, t]);

  const handleNameChange = (text: string) => {
    setProfile((prev) => ({ ...prev, name: text }));
    setHasChanges(true);
    if (text.trim()) {
      setNameError(false);
    }
  };

  const handleAvatarSelect = (index: number) => {
    setProfile((prev) => ({ ...prev, avatarIndex: index }));
    setHasChanges(true);
  };

  const maleAvatars = avatars.filter((a) => a.gender === "male");
  const femaleAvatars = avatars.filter((a) => a.gender === "female");

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.m,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {t("profile.avatar")}
      </ThemedText>

      <View style={styles.avatarGrid}>
        {maleAvatars.map((avatar) => (
          <AvatarOption
            key={avatar.id}
            avatar={avatar}
            selected={profile.avatarIndex === avatar.id}
            onPress={() => handleAvatarSelect(avatar.id)}
            language={language}
          />
        ))}
      </View>

      <View style={styles.avatarGrid}>
        {femaleAvatars.map((avatar) => (
          <AvatarOption
            key={avatar.id}
            avatar={avatar}
            selected={profile.avatarIndex === avatar.id}
            onPress={() => handleAvatarSelect(avatar.id)}
            language={language}
          />
        ))}
      </View>

      <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {t("profile.name")}
      </ThemedText>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: nameError ? Colors.error : inputFocused ? Colors.primary : theme.border,
            borderWidth: inputFocused || nameError ? 2 : 1,
          },
        ]}
      >
        <Feather 
          name="user" 
          size={20} 
          color={nameError ? Colors.error : inputFocused ? Colors.primary : theme.textSecondary} 
        />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={profile.name}
          onChangeText={handleNameChange}
          placeholder={t("profile.namePlaceholder")}
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="words"
          autoCorrect={false}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />
      </View>

      {nameError ? (
        <ThemedText type="caption" style={[styles.errorText, { color: Colors.error }]}>
          {t("profile.namePlaceholder")}
        </ThemedText>
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: Spacing.s,
    marginLeft: Spacing.s,
    letterSpacing: 1,
    marginTop: Spacing.m,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  avatarOption: {
    width: "30%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.s,
    borderRadius: BorderRadius.m,
    gap: Spacing.xs,
  },
  avatarIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    gap: Spacing.m,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  errorText: {
    marginTop: Spacing.s,
    marginLeft: Spacing.s,
  },
});
