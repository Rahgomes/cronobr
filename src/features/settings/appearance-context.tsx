// Tema e idioma escolhidos (E06), gravados no banco. Envolve as telas com o tema e a língua em uso.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { useDataRevision, useRepos } from '@/data/data-context';
import {
  DEFAULT_APPEARANCE,
  parseAppearance,
  resolveLanguage,
  type Appearance,
  type Language,
} from '@/domain/appearance';
import { deviceLanguageTags } from '@/i18n/device';
import { LocaleProvider } from '@/i18n/i18n-context';
import { ThemeProvider, useColors } from '@/ui/theme-context';

export const APPEARANCE_KEY = 'aparencia';

interface AppearanceState {
  appearance: Appearance;
  /** A língua que "do aparelho" daria agora. */
  deviceLanguage: Language;
  /** Grava e só então aplica; rejeita se o banco falhar (a tela avisa). */
  setAppearance: (next: Appearance) => Promise<void>;
}

const AppearanceContext = createContext<AppearanceState>({
  appearance: DEFAULT_APPEARANCE,
  deviceLanguage: 'pt-BR',
  setAppearance: () => Promise.resolve(),
});

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const repos = useRepos();
  const revision = useDataRevision();
  const colors = useColors();
  const [tags] = useState(deviceLanguageTags);
  const [appearance, setState] = useState<Appearance | null>(null);
  useEffect(() => {
    let active = true;
    repos.prefs.get(APPEARANCE_KEY).then(
      (raw) => {
        if (active) setState(parseAppearance(raw));
      },
      () => {
        if (active) setState(DEFAULT_APPEARANCE);
      },
    );
    return () => {
      active = false;
    };
  }, [repos, revision]);

  const value = useMemo<AppearanceState>(
    () => ({
      appearance: appearance ?? DEFAULT_APPEARANCE,
      deviceLanguage: resolveLanguage('auto', tags),
      setAppearance: (next) =>
        repos.prefs.set(APPEARANCE_KEY, next).then(() => {
          setState(next);
        }),
    }),
    [appearance, repos, tags],
  );

  // Uma leitura curta: até ela chegar, só o fundo (sem piscar o tema ou a língua errados).
  if (!appearance) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return (
    <AppearanceContext value={value}>
      <ThemeProvider mode={appearance.theme}>
        <LocaleProvider language={resolveLanguage(appearance.language, tags)}>
          {children}
        </LocaleProvider>
      </ThemeProvider>
    </AppearanceContext>
  );
}

export function useAppearance(): AppearanceState {
  return useContext(AppearanceContext);
}
