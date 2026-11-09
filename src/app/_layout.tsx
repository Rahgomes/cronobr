import { SplashScreen, Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DataProvider } from '@/data/data-context';
import { resolveLanguage } from '@/domain/appearance';
import { CueProvider } from '@/features/cues/cue-context';
import { createExpoPort } from '@/features/cues/expo-port';
import { AppearanceProvider } from '@/features/settings/appearance-context';
import { TimersProvider } from '@/features/timers/timers-context';
import { createFilePort } from '@/features/transfer/expo-file-port';
import { FilePortProvider } from '@/features/transfer/file-port';
import { deviceLanguageTags } from '@/i18n/device';
import { LocaleProvider, useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { DialogHost } from '@/ui/dialog';
import { HintProvider } from '@/ui/hint';
import { useStackOptions } from '@/ui/stack-options';
import { Text } from '@/ui/text';
import { ThemeProvider, useColors, useColorSchemeInUse } from '@/ui/theme-context';
import { space } from '@/ui/tokens';

void SplashScreen.preventAutoHideAsync();

/** Erro que derrubaria a tela vira uma saída digna, com os dados intactos. */
/** Antes do banco abrir, tema e língua seguem o aparelho; depois, a escolha gravada (Ajustes). */
function DeviceDefaults({ children }: { children: ReactNode }) {
  const [language] = useState(() => resolveLanguage('auto', deviceLanguageTags()));
  return (
    <ThemeProvider mode="auto">
      <LocaleProvider language={language}>{children}</LocaleProvider>
    </ThemeProvider>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <DeviceDefaults>
      <ErrorView retry={retry} />
    </DeviceDefaults>
  );
}

function ErrorView({ retry }: { retry: () => Promise<void> }) {
  const colors = useColors();
  const t = useT();
  return (
    <View style={[styles.error, { backgroundColor: colors.background }]}>
      <Text variant="title" accessibilityRole="header">
        {t.crash.title}
      </Text>
      <Text color="textMuted">{t.crash.body}</Text>
      <Button
        label={t.common.retry}
        onPress={() => {
          void retry();
        }}
      />
    </View>
  );
}

function AppStack() {
  const colors = useColors();
  const scheme = useColorSchemeInUse();
  const options = useStackOptions();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ ...options, contentStyle: { backgroundColor: colors.background } }} />
      <DialogHost />
    </>
  );
}

export default function RootLayout() {
  const [port] = useState(createExpoPort);
  const [files] = useState(createFilePort);
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <DeviceDefaults>
          <DataProvider>
            <AppearanceProvider>
              <HintProvider>
                <CueProvider port={port}>
                  <TimersProvider>
                    <FilePortProvider port={files}>
                      <AppStack />
                    </FilePortProvider>
                  </TimersProvider>
                </CueProvider>
              </HintProvider>
            </AppearanceProvider>
          </DataProvider>
        </DeviceDefaults>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg },
});
