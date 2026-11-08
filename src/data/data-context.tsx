import { SplashScreen } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import { useColors } from '@/ui/theme-context';
import { space } from '@/ui/tokens';

import { openData } from './open-data';
import type { Repos } from './repos';
import { StorageError } from './sql';

const ReposContext = createContext<Repos | null>(null);

/**
 * Muda quando um backup troca preferências por baixo das telas abertas (restaurar, desfazer):
 * quem guarda preferência em memória (avisos, aparência, favoritas) relê.
 */
const RevisionContext = createContext<{ revision: number; bump: () => void }>({
  revision: 0,
  bump: () => undefined,
});

type State =
  | { status: 'loading' }
  | { status: 'ready'; repos: Repos }
  | { status: 'error'; message: string | null };

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
  const t = useT();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'loading' });
  const [revision, setRevision] = useState(0);
  const changes = useMemo(
    () => ({
      revision,
      bump: () => {
        setRevision((value) => value + 1);
      },
    }),
    [revision],
  );
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
            message: error instanceof StorageError ? error.message : null,
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
    return (
      <ReposContext.Provider value={state.repos}>
        <RevisionContext value={changes}>{children}</RevisionContext>
      </ReposContext.Provider>
    );
  }
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      {state.status === 'loading' ? (
        <ActivityIndicator color={colors.primary} accessibilityLabel={t.boot.opening} />
      ) : (
        <>
          <Text variant="title" accessibilityRole="header">
            {t.boot.unavailable}
          </Text>
          <Text color="textMuted">{state.message ?? t.boot.fallback}</Text>
          <Text color="textMuted">{t.boot.notErased}</Text>
          <Button
            label={t.common.retry}
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

/** Número que muda quando os dados foram trocados por inteiro (ver RevisionContext). */
export function useDataRevision(): number {
  return useContext(RevisionContext).revision;
}

/** Avisa as telas abertas de que os dados foram trocados (depois de restaurar ou desfazer). */
export function useDataChanged(): () => void {
  return useContext(RevisionContext).bump;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg },
});
