import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { noAds, type AdsPort } from './port';

interface AdsState {
  port: AdsPort;
  /** O SDK começou e há consentimento para pedir anúncio. */
  ready: boolean;
  /** Começa (consentimento e SDK) na primeira vez que um espaço de anúncio aparece. */
  request: () => void;
}

const AdsContext = createContext<AdsState>({
  port: noAds,
  ready: false,
  request: () => undefined,
});

/**
 * O consentimento não abre ao ligar o app: só quando a primeira tela com anúncio fica à vista
 * (Início, Histórico). Assim o formulário nunca cobre um treino retomado (D131).
 */
export function AdsProvider({ port, children }: { port: AdsPort; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  // Estável: a tela pede de novo a cada foco, e o pedido não muda quando o SDK fica pronto.
  const state = useRef({ ready: false, busy: false });
  const request = useCallback(() => {
    if (state.current.ready || state.current.busy) return;
    state.current.busy = true;
    const done = (ok: boolean) => {
      state.current = { ready: ok, busy: false };
      setReady(ok);
    };
    port.start().then(done, () => {
      done(false);
    });
  }, [port]);
  const value = useMemo(() => ({ port, ready, request }), [port, ready, request]);
  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds(): AdsState {
  return useContext(AdsContext);
}
