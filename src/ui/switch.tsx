import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { useBlockedPress } from './hint';
import type { Colors } from './theme';
import { useThemedStyles } from './theme-context';
import { radius, touch } from './tokens';

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

  useEffect(() => {
    Animated.timing(position, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [value, position]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      accessibilityHint={blocked.explains ? disabledHint : undefined}
      disabled={blocked.pressDisabled}
      hitSlop={(touch.minTarget - TRACK_H) / 2}
      onPress={() => {
        if (blocked.explains) blocked.explain();
        else onValueChange(!value);
      }}
      style={[styles.track, value ? styles.on : styles.off, disabled && styles.disabled]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [
              {
                translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] }),
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
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
