import { useCallback, useEffect, useState } from 'react';

import { useRepos } from '@/data/data-context';

const FAVORITES_KEY = 'favoritos';

const parseFavorites = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];

/**
 * Favoritas: ids de modelos prontos ou rotinas próprias, na ordem em que foram marcados.
 * `version` sobe a cada mudança para quem precisa recarregar (a Início relê ao focar).
 */
export function useFavorites() {
  const repos = useRepos();
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    repos.prefs.get(FAVORITES_KEY).then(
      (raw) => {
        if (active) setIds(parseFavorites(raw));
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [repos]);
  const toggle = useCallback(
    (id: string) => {
      setIds((current) => {
        const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
        repos.prefs.set(FAVORITES_KEY, next).catch(() => undefined);
        return next;
      });
    },
    [repos],
  );
  return { ids, toggle };
}
