import { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/i18n/i18n-context';
import { pt } from '@/i18n/messages/pt';

import { Button } from './button';
import { Text } from './text';
import type { Colors } from './theme';
import { useThemedStyles } from './theme-context';
import { radius, space } from './tokens';

export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  // Como no Alert: ação síncrona ou assíncrona (a tela trata o próprio erro).
  onPress?: () => unknown;
};

type Request = { title: string; message?: string | undefined; buttons: DialogButton[] };
type Show = (request: Request) => void;

/**
 * Confirmações no visual do app (Ramon, 01/11): o mesmo sheet de baixo para cima no Android e no
 * iPhone, no lugar do pop-up cinza do sistema. A chamada é a do Alert.alert, então a troca é uma
 * linha. Quem mostra é o DialogHost montado por último: o da raiz, ou o de dentro de um Sheet
 * aberto (no iPhone um Modal irmão não aparece por cima de outro Modal).
 */
const hosts: Show[] = [];

export const dialog = {
  alert(title: string, message?: string, buttons?: DialogButton[]) {
    const list = buttons?.length ? buttons : [];
    const show = hosts.at(-1);
    // Sem host (antes da raiz montar): o do sistema ainda avisa.
    if (show) show({ title, message, buttons: list });
    else Alert.alert(title, message, list.length ? list : [{ text: pt.ui.understood }]);
  },
};

export function DialogHost() {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const [request, setRequest] = useState<Request | null>(null);
  useEffect(() => {
    hosts.push(setRequest);
    return () => {
      hosts.splice(hosts.indexOf(setRequest), 1);
    };
  }, []);
  if (!request) return null;
  const buttons = request.buttons.length ? request.buttons : [{ text: t.ui.understood }];
  const cancel = buttons.find((b) => b.style === 'cancel');
  const actions = buttons.filter((b) => b !== cancel);
  function press(button: DialogButton | undefined) {
    setRequest(null);
    void button?.onPress?.();
  }
  return (
    // Mesmo desenho do Sheet (pegador, título na serifada, botões no rodapé), com Modal próprio:
    // o Sheet monta um DialogHost dentro dele, e importar o Sheet aqui fecharia um ciclo.
    <Modal
      transparent
      visible
      animationType="slide"
      onRequestClose={() => {
        press(cancel);
      }}
    >
      <View style={styles.frame}>
        <View style={styles.scrim} />
        <SafeAreaView edges={['bottom']} style={styles.surface} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.body}>
            <Text variant="title" accessibilityRole="header">
              {request.title}
            </Text>
            {request.message ? <Text color="textMuted">{request.message}</Text> : null}
          </View>
          <View style={styles.buttons}>
            {actions.map((button, i) => (
              <Button
                key={button.text}
                label={button.text}
                kind={i === 0 ? 'primary' : 'secondary'}
                onPress={() => {
                  press(button);
                }}
              />
            ))}
            {cancel ? (
              <Button
                label={cancel.text}
                kind="secondary"
                onPress={() => {
                  press(cancel);
                }}
              />
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    frame: { flex: 1, justifyContent: 'flex-end' },
    scrim: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: colors.text,
      opacity: 0.4,
    },
    surface: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      marginTop: space.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
    },
    body: { paddingHorizontal: space.xl, paddingTop: space.lg, gap: space.sm },
    buttons: { padding: space.lg, gap: space.sm },
  });
