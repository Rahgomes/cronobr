import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useRepos } from '@/data/data-context';
import { DEFAULT_CUE_PREFS, parseCuePrefs, type CuePrefs } from '@/domain/cues';

import { silentPort, type CuePort } from './port';

export const CUE_PREFS_KEY = 'avisos';

interface CueState {
  port: CuePort;
  prefs: CuePrefs;
  setPrefs: (next: CuePrefs) => void;
}

// Fora do provedor (testes de tela que não tratam de aviso): porta muda e o padrão.
const CueContext = createContext<CueState>({
  port: silentPort,
  prefs: DEFAULT_CUE_PREFS,
  setPrefs: () => undefined,
});

/** Avisos do app: a porta (real ou falsa) e as preferências gravadas no banco. */
export function CueProvider({ port, children }: { port: CuePort; children: ReactNode }) {
  const repos = useRepos();
  const [prefs, setState] = useState(DEFAULT_CUE_PREFS);
  useEffect(() => {
    let active = true;
    repos.prefs.get(CUE_PREFS_KEY).then(
      (raw) => {
        if (active) setState(parseCuePrefs(raw));
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [repos]);
  const value = useMemo(
    () => ({
      port,
      prefs,
      setPrefs: (next: CuePrefs) => {
        setState(next);
        repos.prefs.set(CUE_PREFS_KEY, next).catch(() => undefined);
      },
    }),
    [port, prefs, repos],
  );
  return <CueContext.Provider value={value}>{children}</CueContext.Provider>;
}

export function useCues(): CueState {
  return useContext(CueContext);
}
