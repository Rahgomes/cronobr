import { useCallback, useEffect, useState } from 'react';

/** Destravada e parada de mexer por esse tempo, volta a travar (P2). */
export const RELOCK_MS = 5000;

type Mode = 'auto' | 'locked' | 'unlocked';

/**
 * Trava de toques da sessão (P2). Com a preferência ligada, a sessão em curso começa travada
 * e volta a travar sozinha depois de RELOCK_MS sem toque. Com ela desligada, só trava quem
 * tocar no cadeado. Travada, os botões só agem com toque longo (quem decide isso é a tela).
 */
export function useTouchLock({ auto, active }: { auto: boolean; active: boolean }) {
  const [mode, setMode] = useState<Mode>('auto');
  const [touches, setTouches] = useState(0);
  const locked = active && (mode === 'locked' || (mode === 'auto' && auto));

  useEffect(() => {
    if (mode !== 'unlocked' || !auto || !active) return;
    const id = setTimeout(() => {
      setMode('auto');
    }, RELOCK_MS);
    return () => {
      clearTimeout(id);
    };
  }, [mode, auto, active, touches]);

  const lock = useCallback(() => {
    setMode('locked');
  }, []);
  const unlock = useCallback(() => {
    setMode('unlocked');
  }, []);
  /** Toque em algum controle: adia a volta da trava. */
  const poke = useCallback(() => {
    setTouches((n) => n + 1);
  }, []);
  return { locked, lock, unlock, poke };
}
