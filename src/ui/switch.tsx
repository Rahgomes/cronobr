import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useBlockedPress } from './hint';
import type { Colors } from './theme';
import { useThemedStyles } from './theme-context';
import { radius, touch } from './tokens';
import { useReduceMotion } from './use-reduce-motion';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Lido pelo TalkBack/VoiceOver: diga o que liga, não "interruptor". */
  accessibilityLabel: string;
  disabled?: boolean;
  /** Desligado com motivo: tocar mostra o porquê. */
  disabledHint?: string | undefined;
};

const TRACK_W = 52;
const TRACK_H = 32;
const THUMB = 24;
const TRAVEL = TRACK_W - THUMB - (TRACK_H - THUMB);

/**
 * Interruptor desenhado pelo kit: o Switch nativo muda de cara entre Android, iOS e web e não
 * aceita a borda que dá contraste ao estado desligado (3:1 contra o fundo).
 */
export function Switch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
  disabledHint,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const blocked = useBlockedPress(disabled, disabledHint);
  const [position] = useState(() => new Animated.Value(value ? 1 : 0));
  const reduce = useReduceMotion();

  useEffect(() => {
    Animated.timing(position, {
      toValue: value ? 1 : 0,
      duration: reduce ? 0 : 150,
      useNativeDriver: true,
    }).start();
  }, [value, position, reduce]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      // No web o accessibilityState não vira aria-checked, e role=switch sem ele é inválido.
      aria-checked={value}
      accessibilityHint={blocked.explains ? disabledHint : undefined}
      disabled={blocked.pressDisabled}
      onPress={() => {
        if (blocked.explains) blocked.explain();
        else onValueChange(!value);
      }}
      // A área de toque é a caixa de 48; o trilho é o desenho dentro dela (a web não tem hitSlop).
      style={styles.target}
    >
      <View style={[styles.track, value ? styles.on : styles.off, disabled && styles.disabled]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [
                {
                  translateX: position.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, TRAVEL],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    target: { minHeight: touch.minTarget, minWidth: TRACK_W, justifyContent: 'center' },
    track: {
      width: TRACK_W,
      height: TRACK_H,
      borderRadius: radius.pill,
      padding: (TRACK_H - THUMB) / 2,
      justifyContent: 'center',
    },
    on: { backgroundColor: colors.primary },
    off: { backgroundColor: colors.inputBorder },
    disabled: { opacity: 0.6 },
    thumb: {
      width: THUMB,
      height: THUMB,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
    },
  });
