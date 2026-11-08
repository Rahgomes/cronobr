import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useDataRevision, useRepos } from '@/data/data-context';
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
  const revision = useDataRevision();
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
  }, [repos, revision]);
  const value = useMemo(
    () => ({
      port,
      prefs,
      // Grava e só então mostra: o que aparece escolhido já está no banco (fechar logo em
      // seguida não perde a escolha; o CI pegou isso recarregando a página).
      setPrefs: (next: CuePrefs) => {
        const show = () => {
          setState(next);
        };
        repos.prefs.set(CUE_PREFS_KEY, next).then(show, show);
      },
    }),
    [port, prefs, repos],
  );
  return <CueContext.Provider value={value}>{children}</CueContext.Provider>;
}

export function useCues(): CueState {
  return useContext(CueContext);
}
