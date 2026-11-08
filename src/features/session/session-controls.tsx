import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { SESSION_VIEWS, VIEW_LABEL, type SessionViewMode } from '@/domain/session-prefs';
import { Chip } from '@/ui/chip';
import { Text } from '@/ui/text';
import type { Colors } from '@/ui/theme';
import { useColors, useThemedStyles } from '@/ui/theme-context';
import { radius, space, touch } from '@/ui/tokens';

/** Segurar o cadeado destrava (P2). */
const UNLOCK_HOLD_MS = 1000;
/** Travada, pausar e "Concluí" pedem toque longo: esbarrar não age, parar nunca fica difícil. */
const LOCKED_HOLD_MS = 600;

export const LOCKED_HINT = 'Tela travada · segure o cadeado para usar os botões';

type Icon = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Botão redondo da sessão. Travado, o toque simples só lembra como destravar; `holdWhenLocked`
 * deixa agir com toque longo (pausar, concluir).
 */
export function RoundControl({
  icon,
  label,
  onPress,
  locked,
  onBlocked,
  holdWhenLocked = false,
  big = false,
  onPhase = false,
}: {
  icon: Icon;
  label: string;
  onPress: () => void;
  locked: boolean;
  onBlocked: () => void;
  holdWhenLocked?: boolean;
  big?: boolean;
  /** Sobre a cor da fase (Foco): branco translúcido no lugar do cinza. */
  onPhase?: boolean;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const hold = locked && holdWhenLocked;
  const ink = onPhase ? colors.onPhase : big ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={
        hold
          ? 'Toque e segure'
          : locked
            ? 'Tela travada. Segure o cadeado para destravar'
            : undefined
      }
      onPress={locked ? onBlocked : onPress}
      {...(hold ? { onLongPress: onPress, delayLongPress: LOCKED_HOLD_MS } : {})}
      style={({ pressed }) => [
        styles.round,
        big && styles.big,
        big && !onPhase && { backgroundColor: colors.primary },
        onPhase && styles.onPhase,
        locked && !hold && styles.dim,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={big ? 40 : space.xl} color={ink} />
    </Pressable>
  );
}

/** Cadeado: travado, segurar 1 s destrava; destravado, um toque trava. */
export function LockButton({
  locked,
  lock,
  unlock,
  onBlocked,
  onPhase = false,
}: {
  locked: boolean;
  lock: () => void;
  unlock: () => void;
  onBlocked: () => void;
  onPhase?: boolean;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={locked ? 'Destravar a tela' : 'Travar a tela'}
      accessibilityHint={locked ? 'Toque e segure por 1 segundo' : undefined}
      onPress={locked ? onBlocked : lock}
      {...(locked ? { onLongPress: unlock, delayLongPress: UNLOCK_HOLD_MS } : {})}
      hitSlop={2}
      style={({ pressed }) => [styles.small, onPhase && styles.onPhase, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons
        name={locked ? 'lock' : 'lock-open-variant'}
        size={space.xl}
        color={onPhase ? colors.onPhase : colors.text}
      />
    </Pressable>
  );
}

/** Aviso fixo enquanto a tela está travada. */
export function LockedHint() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.hint} accessibilityLiveRegion="polite">
      <Text variant="caption" style={styles.hintText}>
        {LOCKED_HINT}
      </Text>
    </View>
  );
}

/** Seletor discreto de visualização (P1). */
export function ViewSwitch({
  value,
  onChange,
}: {
  value: SessionViewMode;
  onChange: (view: SessionViewMode) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.switch} accessibilityLabel="Visualização" accessibilityRole="toolbar">
      {SESSION_VIEWS.map((view) => (
        <Chip
          key={view}
          label={VIEW_LABEL[view]}
          selected={view === value}
          onPress={() => {
            onChange(view);
          }}
        />
      ))}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    round: {
      width: touch.button,
      height: touch.button,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.iconButton,
    },
    big: { width: 80, height: 80 },
    small: {
      width: touch.minTarget - 4,
      height: touch.minTarget - 4,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.iconButton,
    },
    onPhase: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
    dim: { opacity: 0.75 },
    pressed: { opacity: 0.6 },
    hint: {
      alignSelf: 'center',
      // Pílula escura fixa nos dois temas (e sobre a cor da fase): branco por cima passa 4,5:1.
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      borderRadius: radius.pill,
      paddingHorizontal: space.md,
      paddingVertical: space.xs,
    },
    hintText: { color: '#FFFFFF', textAlign: 'center' },
    switch: { flexDirection: 'row', gap: space.sm, justifyContent: 'center' },
  });

/** Botão largo da etapa manual ("Concluí"): travado, age só com toque longo. */
export function WideControl({
  label,
  onPress,
  locked,
  onBlocked,
}: {
  label: string;
  onPress: () => void;
  locked: boolean;
  onBlocked: () => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeWideStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={locked ? 'Toque e segure' : undefined}
      onPress={locked ? onBlocked : onPress}
      {...(locked ? { onLongPress: onPress, delayLongPress: LOCKED_HOLD_MS } : {})}
      style={({ pressed }) => [styles.wide, pressed && styles.pressed]}
    >
      <Text variant="label" style={{ color: colors.onPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeWideStyles = (colors: Colors) =>
  StyleSheet.create({
    wide: {
      minHeight: touch.button,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    pressed: { backgroundColor: colors.primaryPressed },
  });
