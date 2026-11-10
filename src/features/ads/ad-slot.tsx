import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n/i18n-context';
import { Text } from '@/ui/text';
import { space } from '@/ui/tokens';

import { useAds } from './ads-context';

type SlotState = 'loading' | 'shown' | 'gone';

/**
 * Banner no fim da tela, longe de qualquer controle (D130). Enquanto carrega não ocupa espaço;
 * se falhar (sem preenchimento, offline, erro) some sem aviso, e tenta de novo quando a tela
 * volta a ficar à vista ou o app volta para a frente.
 */
export function AdSlot() {
  const t = useT();
  const { port, ready, request } = useAds();
  const [state, setState] = useState<SlotState>('loading');

  useFocusEffect(
    useCallback(() => {
      const retry = () => {
        request();
        setState((current) => (current === 'gone' ? 'loading' : current));
      };
      retry();
      // Só com a tela à vista: a Início fica montada embaixo do treino.
      const sub = AppState.addEventListener('change', (next) => {
        if (next === 'active') retry();
      });
      return () => {
        sub.remove();
      };
    }, [request]),
  );

  const Banner = port.Banner;
  if (!ready || !Banner || state === 'gone') return null;
  return (
    <View style={state === 'shown' ? styles.shown : undefined}>
      {state === 'shown' ? (
        <Text variant="caption" color="textMuted">
          {t.ads.label}
        </Text>
      ) : null}
      <Banner
        onLoaded={() => {
          setState('shown');
        }}
        onFailed={() => {
          setState('gone');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shown: { marginTop: space.xl, gap: space.xs, alignItems: 'center' },
});
