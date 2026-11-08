import { useEffect, useState } from 'react';

import { useRepos } from '@/data/data-context';

/**
 * Estado lembrado em preferências (última configuração do início rápido, cronômetro).
 * Lê uma vez ao abrir; `ready` evita gravar o padrão por cima do que estava salvo.
 */
export function useStored<T>(key: string, parse: (raw: unknown) => T, initial: T) {
  const repos = useRepos();
  const [state, setState] = useState({ value: initial, ready: false });
  useEffect(() => {
    let active = true;
    repos.prefs.get(key).then(
      (raw) => {
        if (active) setState({ value: raw === undefined ? initial : parse(raw), ready: true });
      },
      () => {
        if (active) setState((s) => ({ ...s, ready: true }));
      },
    );
    return () => {
      active = false;
    };
    // Só na abertura: `parse` e `initial` são constantes de quem chama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos, key]);
  const set = (value: T) => {
    setState({ value, ready: true });
    repos.prefs.set(key, value).catch(() => undefined);
  };
  return [state.value, set, state.ready] as const;
}
