// O tema vigente para as telas. useColors() para cor solta no JSX; useThemedStyles(make)
// para o StyleSheet (uma folha por fábrica e por tema, compartilhada entre as telas).
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { resolveScheme, themeColors, type ColorScheme, type Colors, type ThemeMode } from './theme';

type Theme = { colors: Colors; scheme: ColorScheme };

const ThemeContext = createContext<Theme>({
  colors: themeColors('light'),
  scheme: 'light',
});

export function ThemeProvider({ mode, children }: { mode: ThemeMode; children: ReactNode }) {
  const scheme = resolveScheme(mode, useColorScheme());
  const value = useMemo(() => ({ colors: themeColors(scheme), scheme }), [scheme]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useColors(): Colors {
  return useContext(ThemeContext).colors;
}

export function useColorSchemeInUse(): ColorScheme {
  return useContext(ThemeContext).scheme;
}

const sheets = new WeakMap<(colors: Colors) => unknown, WeakMap<Colors, unknown>>();

/** `make` deve ficar fora do componente (constante do módulo) para o cache valer. */
export function useThemedStyles<T>(make: (colors: Colors) => T): T {
  const colors = useColors();
  let byTheme = sheets.get(make);
  if (!byTheme) {
    byTheme = new WeakMap();
    sheets.set(make, byTheme);
  }
  if (!byTheme.has(colors)) byTheme.set(colors, make(colors));
  return byTheme.get(colors) as T;
}
