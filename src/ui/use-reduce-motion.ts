import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * "Reduzir animações" do aparelho, acompanhando a troca. Começa em true (sem animação) até a
 * resposta chegar: na dúvida, não mexe a tela.
 */
export function useReduceMotion() {
  const [reduce, setReduce] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (active) setReduce(value);
      },
      () => undefined,
    );
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

let reduceCached = true;
let reduceWatching = false;
/**
 * Mesma leitura, sem hook: para quem decide na hora do toque (abrir um aviso) e aparece dezenas
 * de vezes na tela, como as perguntas frequentes. Uma escuta só para o app todo.
 */
export function reduceMotionNow(): boolean {
  if (!reduceWatching) {
    reduceWatching = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        reduceCached = value;
      },
      () => undefined,
    );
    AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      reduceCached = value;
    });
  }
  return reduceCached;
}
