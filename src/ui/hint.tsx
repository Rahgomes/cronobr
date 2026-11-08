import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { Text } from './text';
import type { Colors } from './theme';
import { useColors, useThemedStyles } from './theme-context';
import { elevation, radius, space, touch } from './tokens';

export type Hint = {
  message: string;
  icon?: 'lock-outline' | 'information-outline';
  action?: { label: string; onPress: () => void };
};

/** Tempo na tela: o bastante para ler duas linhas; tocar fecha antes. */
export const HINT_MS = 5000;
/** Acima da barra de abas, que tem ~72 dp mais a área segura. */
const ABOVE_TABS = 88;
/** Distância do deslize que fecha o aviso. */
const SWIPE_CLOSE = 60;

const HintContext = createContext<(hint: Hint) => void>(() => undefined);

/**
 * Aviso rápido (Ramon, 29/10): ao tocar em algo do Essencial ou desligado, diz o porquê e some
 * sozinho, como o "title" do navegador. Um por vez; o novo substitui o anterior.
 */
export function HintProvider({ children }: { children: ReactNode }) {
  const [hint, setHint] = useState<Hint | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((next: Hint) => {
    clearTimeout(timer.current);
    setHint(next);
    timer.current = setTimeout(() => {
      setHint(null);
    }, HINT_MS);
  }, []);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );
  const close = () => {
    clearTimeout(timer.current);
    setHint(null);
  };
  return (
    <HintContext value={show}>
      {children}
      {hint ? <HintToast hint={hint} onClose={close} /> : null}
    </HintContext>
  );
}

export function useHint(): (hint: Hint) => void {
  return use(HintContext);
}

function HintToast({ hint, onClose }: { hint: Hint; onClose: () => void }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  // Sem provider (testes, telas isoladas) cai no zero em vez de quebrar.
  const bottom = use(SafeAreaInsetsContext)?.bottom ?? 0;
  const [dx, setDx] = useState(0);
  // Deslizar para o lado fecha (Ramon, 01/11); um toque curto continua sendo o toque.
  const [swipe] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_e, g) => {
        setDx(g.dx);
      },
      onPanResponderRelease: (_e, g) => {
        if (Math.abs(g.dx) > SWIPE_CLOSE) onClose();
        else setDx(0);
      },
      onPanResponderTerminate: () => {
        setDx(0);
      },
    }),
  );
  return (
    <View pointerEvents="box-none" style={[styles.layer, { bottom: bottom + ABOVE_TABS }]}>
      <View
        {...swipe.panHandlers}
        style={[
          styles.toast,
          dx
            ? { transform: [{ translateX: dx }], opacity: Math.max(0.3, 1 - Math.abs(dx) / 200) }
            : null,
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hint.message}
          accessibilityHint="Toque para fechar"
          style={styles.body}
          onPress={onClose}
        >
          <MaterialCommunityIcons
            name={hint.icon ?? 'information-outline'}
            size={space.xl}
            color={colors.onHero}
          />
          <Text color="onHero" style={styles.grow}>
            {hint.message}
          </Text>
        </Pressable>
        {hint.action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hint.action.label}
            hitSlop={space.sm}
            style={styles.action}
            onPress={() => {
              onClose();
              hint.action?.onPress();
            }}
          >
            <Text variant="label" color="onHero" style={styles.underline}>
              {hint.action.label}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso"
          hitSlop={space.sm}
          style={styles.action}
          onPress={onClose}
        >
          <MaterialCommunityIcons name="close" size={space.lg} color={colors.onHero} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    layer: { position: 'absolute', left: space.lg, right: space.lg, alignItems: 'center' },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      maxWidth: 480,
      width: '100%',
      minHeight: touch.minTarget,
      paddingHorizontal: space.md,
      borderRadius: radius.md,
      backgroundColor: colors.hero,
      ...elevation.floating,
      shadowColor: '#000000',
    },
    body: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      paddingVertical: space.sm,
    },
    grow: { flex: 1 },
    action: { minHeight: touch.minTarget, justifyContent: 'center' },
    underline: { textDecorationLine: 'underline' },
  });

/**
 * Para campos e botões desligados com motivo: o toque não faz a ação, mas mostra o porquê. Sem
 * motivo, o controle fica desligado como sempre (ex.: enquanto salva).
 */
export function useBlockedPress(disabled: boolean, reason: string | undefined) {
  const hint = useHint();
  const explains = disabled && !!reason;
  return {
    /** Valor para o `disabled` do Pressable: com motivo ele continua tocável. */
    pressDisabled: disabled && !explains,
    explains,
    explain: () => {
      if (reason) hint({ message: reason, icon: 'information-outline' });
    },
  };
}
