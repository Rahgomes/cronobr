import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { SpeechProvider } from "@/contexts/SpeechContext";
import { SilentModeProvider } from "@/contexts/SilentModeContext";
import { ScreenLockProvider } from "@/contexts/ScreenLockContext";
import { HistoryProvider } from "@/contexts/HistoryContext";
import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTheme } from "@/hooks/useTheme";

function AppContent() {
  const { isDark } = useTheme();
  
  return (
    <>
      <NavigationContainer>
        <RootStackNavigator />
      </NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <ThemeProvider>
                <I18nProvider>
                  <SoundProvider>
                    <SpeechProvider>
                      <SilentModeProvider>
                        <ScreenLockProvider>
                          <HistoryProvider>
                            <AppContent />
                          </HistoryProvider>
                        </ScreenLockProvider>
                      </SilentModeProvider>
                    </SpeechProvider>
                  </SoundProvider>
                </I18nProvider>
              </ThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
