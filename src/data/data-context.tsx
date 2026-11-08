import { SplashScreen } from 'expo-router';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import { useColors } from '@/ui/theme-context';
import { space } from '@/ui/tokens';

import { openData } from './open-data';
import type { Repos } from './repos';
import { StorageError } from './sql';

const ReposContext = createContext<Repos | null>(null);

type State =
  { status: 'loading' } | { status: 'ready'; repos: Repos } | { status: 'error'; message: string };

const FALLBACK = 'Não deu para abrir seus treinos neste aparelho.';

/**
 * Abre o banco antes de qualquer tela. Armazenamento indisponível não vira tela branca:
 * mostra o motivo e deixa tentar de novo (nada é apagado).
 */
export function DataProvider({
  open = openData,
  children,
}: {
  open?: () => Promise<Repos>;
  children: ReactNode;
}) {
  const colors = useColors();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    open().then(
      (repos) => {
        if (active) setState({ status: 'ready', repos });
      },
      (error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof StorageError ? error.message : FALLBACK,
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [open, attempt]);

  // A abertura esconde a splash quando há algo para mostrar: a Início ou o erro com o motivo.
  useEffect(() => {
    if (state.status !== 'loading') void SplashScreen.hideAsync();
  }, [state.status]);

  if (state.status === 'ready') {
    return <ReposContext.Provider value={state.repos}>{children}</ReposContext.Provider>;
  }
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      {state.status === 'loading' ? (
        <ActivityIndicator color={colors.primary} accessibilityLabel="Abrindo seus treinos" />
      ) : (
        <>
          <Text variant="title" accessibilityRole="header">
            Armazenamento indisponível
          </Text>
          <Text color="textMuted">{state.message}</Text>
          <Text color="textMuted">Seus dados não foram apagados.</Text>
          <Button
            label="Tentar de novo"
            onPress={() => {
              setState({ status: 'loading' });
              setAttempt((value) => value + 1);
            }}
          />
        </>
      )}
    </View>
  );
}

export function useRepos(): Repos {
  const repos = useContext(ReposContext);
  if (!repos) throw new Error('useRepos fora do DataProvider');
  return repos;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg },
});
