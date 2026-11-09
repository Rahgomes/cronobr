import { useState } from 'react';

import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';

/** Rotinas à vista antes do "Mostrar mais": a lista não é virtual e cada linha calcula a duração. */
export const SHOW_FIRST = 20;
export const SHOW_STEP = 50;

/**
 * Lista longa em partes (E08 B): com 1.000 rotinas a Início levava 4,4 s e 34 MB para desenhar
 * todas. Mostra as primeiras e um botão que traz mais um tanto, dizendo quantas faltam.
 */
export function useShowMore<T>(items: readonly T[]) {
  const t = useT();
  const [shown, setShown] = useState(SHOW_FIRST);
  const rest = items.length - shown;
  return {
    visible: items.slice(0, shown),
    more:
      rest > 0 ? (
        <Button
          label={t.home.showMore(Math.min(rest, SHOW_STEP), rest)}
          kind="secondary"
          onPress={() => {
            setShown((n) => n + SHOW_STEP);
          }}
        />
      ) : null,
  };
}
