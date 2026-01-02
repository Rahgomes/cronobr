import React, { useState, useEffect, useCallback } from "react";
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
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getProfile, saveProfile, Profile } from "@/lib/storage";

const avatarIcons: (keyof typeof Feather.glyphMap)[] = ["activity", "user", "clock"];
const avatarLabels = ["Halter", "Atleta", "Cronometro"];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AvatarOption({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
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
        <Feather name={icon} size={32} color={Colors.primary} />
      </View>
      <ThemedText type="bodySmall">{label}</ThemedText>
    </AnimatedPressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [profile, setProfile] = useState<Profile>({
    name: "Atleta",
    avatarIndex: 0,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const loadProfile = useCallback(async () => {
    const loadedProfile = await getProfile();
    setProfile(loadedProfile);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      setHasChanges(false);
    }, [loadProfile])
  );

  const handleSave = useCallback(async () => {
    await saveProfile(profile);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    navigation.goBack();
  }, [profile, navigation]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton
          onPress={handleSave}
          pressColor={Colors.primary + "20"}
        >
          <ThemedText type="button" style={{ color: Colors.primary }}>
            Salvar
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, handleSave]);

  const handleNameChange = (text: string) => {
    setProfile((prev) => ({ ...prev, name: text }));
    setHasChanges(true);
  };

  const handleAvatarSelect = (index: number) => {
    setProfile((prev) => ({ ...prev, avatarIndex: index }));
    setHasChanges(true);
  };

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
        AVATAR
      </ThemedText>

      <View style={styles.avatarGrid}>
        {avatarIcons.map((icon, index) => (
          <AvatarOption
            key={icon}
            icon={icon}
            label={avatarLabels[index]}
            selected={profile.avatarIndex === index}
            onPress={() => handleAvatarSelect(index)}
          />
        ))}
      </View>

      <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        NOME
      </ThemedText>

      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        ]}
      >
        <Feather name="user" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={profile.name}
          onChangeText={handleNameChange}
          placeholder="Digite seu nome"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: Spacing.s,
    marginLeft: Spacing.s,
    letterSpacing: 1,
  },
  avatarGrid: {
    flexDirection: "row",
    gap: Spacing.m,
    marginBottom: Spacing.l,
  },
  avatarOption: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    gap: Spacing.s,
  },
  avatarIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    gap: Spacing.m,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
});
