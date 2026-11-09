import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/i18n/i18n-context';

import { DialogHost } from './dialog';
import { HintProvider } from './hint';
import { Text } from './text';
import type { Colors } from './theme';
import { useColors, useThemedStyles } from './theme-context';
import { layout, radius, space, touch } from './tokens';

export function Sheet({
  title,
  visible,
  onClose,
  children,
  footer,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useT();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="slide">
      {/* O Modal fica acima de tudo: o aviso rápido de dentro do sheet precisa morar aqui dentro. */}
      <HintProvider>
        <KeyboardAvoidingView behavior="padding" style={styles.frame}>
          <View style={styles.scrim} />
          <SafeAreaView edges={['top', 'bottom']} style={styles.surface} accessibilityViewIsModal>
            {/* Visual v2: pegador no topo, título na serifada e o X num botão redondo suave. */}
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text variant="title" accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.ui.close}
                onPress={onClose}
                hitSlop={2}
                style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
              >
                <MaterialCommunityIcons name="close" size={space.xl} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
            {/* Confirmação pedida de dentro do sheet aparece por cima dele (iPhone incluso). */}
            {visible ? <DialogHost /> : null}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </HintProvider>
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
      width: '100%',
      maxWidth: layout.contentMax,
      alignSelf: 'center',
      maxHeight: '95%',
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      paddingHorizontal: space.xl,
      paddingTop: space.sm,
    },
    title: { flex: 1 },
    // 44 de círculo + 2 de hitSlop = os 48 de toque.
    close: {
      width: touch.minTarget - 4,
      height: touch.minTarget - 4,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.iconButton,
    },
    closePressed: { backgroundColor: colors.accentSoft },
    footer: {
      padding: space.lg,
      gap: space.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    content: { padding: space.xl, gap: space.lg },
  });
