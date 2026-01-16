import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useI18n } from "@/contexts/I18nContext";

import TimerConfigScreen from "@/screens/TimerConfigScreen";
import ActiveTimerScreen from "@/screens/ActiveTimerScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import SoundSettingsScreen from "@/screens/SoundSettingsScreen";
import AdvancedSettingsScreen from "@/screens/AdvancedSettingsScreen";
import WorkoutPreviewScreen from "@/screens/WorkoutPreviewScreen";
import DynamicPreviewScreen from "@/screens/DynamicPreviewScreen";
import ProfilesScreen from "@/screens/ProfilesScreen";
import HeaderTitle from "@/components/HeaderTitle";

export type RootStackParamList = {
  TimerConfig: undefined;
  ActiveTimer: {
    prepTime: number;
    exerciseTime: number;
    restTime: number;
    rounds: number;
  };
  WorkoutPreview: {
    prepTime: number;
    exerciseTime: number;
    restTime: number;
    rounds: number;
  };
  DynamicPreview: {
    prepTime: number;
    exerciseTime: number;
    restTime: number;
    rounds: number;
  };
  Settings: undefined;
  Profile: undefined;
  SoundSettings: undefined;
  AdvancedSettings: undefined;
  Profiles: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const opaqueScreenOptions = useScreenOptions({ transparent: false });
  const { t } = useI18n();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="TimerConfig"
        component={TimerConfigScreen}
        options={{
          headerTitle: () => <HeaderTitle />,
        }}
      />
      <Stack.Screen
        name="ActiveTimer"
        component={ActiveTimerScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          ...opaqueScreenOptions,
          headerTitle: t("settings.title"),
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          ...opaqueScreenOptions,
          headerTitle: t("profile.title"),
        }}
      />
      <Stack.Screen
        name="SoundSettings"
        component={SoundSettingsScreen}
        options={{
          ...opaqueScreenOptions,
          headerTitle: t("soundSettings.title"),
        }}
      />
      <Stack.Screen
        name="AdvancedSettings"
        component={AdvancedSettingsScreen}
        options={{
          ...opaqueScreenOptions,
          headerTitle: t("advancedSettings.title"),
        }}
      />
      <Stack.Screen
        name="WorkoutPreview"
        component={WorkoutPreviewScreen}
        options={{
          ...opaqueScreenOptions,
          headerTitle: t("preview.title"),
        }}
      />
      <Stack.Screen
        name="Profiles"
        component={ProfilesScreen}
        options={{
          ...opaqueScreenOptions,
          headerTitle: t("profiles.title"),
        }}
      />
      <Stack.Screen
        name="DynamicPreview"
        component={DynamicPreviewScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
          animation: "fade",
        }}
      />
    </Stack.Navigator>
  );
}
