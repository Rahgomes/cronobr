import { SplashScreen, Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DataProvider } from '@/data/data-context';
import { Button } from '@/ui/button';
import { DialogHost } from '@/ui/dialog';
import { HintProvider } from '@/ui/hint';
import { useStackOptions } from '@/ui/stack-options';
import { Text } from '@/ui/text';
import { ThemeProvider, useColors, useColorSchemeInUse } from '@/ui/theme-context';
import { space } from '@/ui/tokens';

void SplashScreen.preventAutoHideAsync();

/** Erro que derrubaria a tela vira uma saída digna, com os dados intactos. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <ThemeProvider mode="auto">
      <ErrorView retry={retry} />
    </ThemeProvider>
  );
}

function ErrorView({ retry }: { retry: () => Promise<void> }) {
  const colors = useColors();
  return (
    <View style={[styles.error, { backgroundColor: colors.background }]}>
      <Text variant="title" accessibilityRole="header">
        Algo deu errado
      </Text>
      <Text color="textMuted">Seus treinos estão guardados. Tente de novo.</Text>
      <Button
        label="Tentar de novo"
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
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* Preferência de tema entra com a tela de Ajustes (E04); até lá, segue o sistema. */}
        <ThemeProvider mode="auto">
          <HintProvider>
            <DataProvider>
              <AppStack />
            </DataProvider>
          </HintProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg },
});
