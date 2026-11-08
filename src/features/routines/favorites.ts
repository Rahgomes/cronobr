import { useCallback, useEffect, useState } from 'react';

import { useRepos } from '@/data/data-context';

const FAVORITES_KEY = 'favoritos';

const parseFavorites = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];

/**
 * Favoritas: ids de modelos prontos ou rotinas próprias, na ordem em que foram marcados.
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
  // Grava primeiro e só então mostra: o que aparece marcado já está no banco.
  const toggle = useCallback(
    (id: string) => {
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      const show = () => {
        setIds(next);
      };
      repos.prefs.set(FAVORITES_KEY, next).then(show, show);
    },
    [repos, ids],
  );
  return { ids, toggle };
}
