import { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { Notice } from '@/ui/notice';
import { space } from '@/ui/tokens';

import { useCues } from './cue-context';
import type { NotifyState } from './port';

/**
 * Notificação recusada (E08, fluxo 8): o app funciona igual com a tela à vista, mas com a tela
 * bloqueada as trocas não avisam. Diz isso e leva às configurações. Confere de novo ao voltar
 * para o app (a pessoa pode ter liberado lá).
 */
export function NotificationsBlocked() {
  const t = useT();
  const { port } = useCues();
  const [state, setState] = useState<NotifyState>('none');
  useEffect(() => {
    let active = true;
    const check = () => {
      port.notifications().then(
        (next) => {
          if (active) setState(next);
        },
        () => undefined,
      );
    };
    check();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') check();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [port]);
  if (state !== 'off') return null;
  // Aviso e botão separados: num aviso clicável o leitor de tela só leria o rótulo do botão.
  return (
    <View style={styles.wrap}>
      <Notice tone="alert" title={t.cues.blockedTitle}>
        {t.cues.blocked}
      </Notice>
      <Button
        label={t.cues.openSettings}
        kind="secondary"
        onPress={() => {
          port.openSettings();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: space.sm } });
