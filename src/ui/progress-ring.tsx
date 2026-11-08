import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/**
 * Anel de progresso (C03). Só desenho: o número e o texto ficam no meio, como filhos, e o
 * leitor de tela lê o filho (o anel em si não diz nada que o texto não diga).
 */
export function ProgressRing({
  size,
  stroke,
  progress,
  color,
  track,
  children,
}: {
  size: number;
  stroke: number;
  /** 0..1 */
  progress: number;
  color: string;
  track: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;
  const filled = Math.min(1, Math.max(0, progress));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} accessibilityElementsHidden importantForAccessibility="no">
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${String(length)} ${String(length)}`}
          strokeDashoffset={length * (1 - filled)}
          // Começa no topo e anda no sentido do relógio.
          transform={`rotate(-90 ${String(size / 2)} ${String(size / 2)})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
