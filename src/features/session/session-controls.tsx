import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { SESSION_VIEWS, type SessionViewMode } from '@/domain/session-prefs';
import { useT } from '@/i18n/i18n-context';
import { Chip } from '@/ui/chip';
import { Text } from '@/ui/text';
import type { Colors } from '@/ui/theme';
import { useColors, useThemedStyles } from '@/ui/theme-context';
import { radius, space, touch } from '@/ui/tokens';

/** Segurar o cadeado destrava (P2). */
const UNLOCK_HOLD_MS = 1000;
/** Travada, pausar e "Concluí" pedem toque longo: esbarrar não age, parar nunca fica difícil. */
const LOCKED_HOLD_MS = 600;

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
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const hold = locked && holdWhenLocked;
  const ink = onPhase ? colors.onPhase : big ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={
        hold ? t.session.holdHint : locked ? t.session.lockedControlHint : undefined
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
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={locked ? t.session.unlockScreen : t.session.lockScreen}
      accessibilityHint={locked ? t.session.unlockHoldHint(UNLOCK_HOLD_MS / 1000) : undefined}
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
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.hint} accessibilityLiveRegion="polite">
      <Text variant="caption" style={styles.hintText}>
        {t.session.lockedHint}
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
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      style={styles.switch}
      accessibilityLabel={t.session.visualization}
      accessibilityRole="toolbar"
    >
      {SESSION_VIEWS.map((view) => (
        <Chip
          key={view}
          label={t.session.viewLabels[view]}
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
  const t = useT();
  const styles = useThemedStyles(makeWideStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={locked ? t.session.holdHint : undefined}
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

/**
 * AMRAP: contador de rodadas. "+1" vale mesmo travado (é o toque do treino e se desfaz);
 * "-1" só destravado.
 */
export function RoundCounter({
  count,
  locked,
  onAdd,
  onUndo,
}: {
  count: number;
  locked: boolean;
  onAdd: () => void;
  onUndo: () => void;
}) {
  const colors = useColors();
  const t = useT();
  const styles = useThemedStyles(makeCounterStyles);
  return (
    <View style={styles.box}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.session.removeRound}
        disabled={locked || count === 0}
        // Escondido (travado ou zero): fora do leitor de tela também, mas guardando o lugar.
        accessibilityElementsHidden={locked || count === 0}
        importantForAccessibility={locked || count === 0 ? 'no-hide-descendants' : 'auto'}
        onPress={onUndo}
        style={[styles.minus, (locked || count === 0) && styles.hidden]}
      >
        <MaterialCommunityIcons name="minus" size={space.xl} color={colors.text} />
      </Pressable>
      <View style={styles.count} accessibilityLiveRegion="polite">
        <Text variant="display" tabular accessibilityLabel={t.session.roundCount(count)}>
          {String(count)}
        </Text>
        <Text variant="caption" color="textMuted">
          {t.session.rounds}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.session.addRound}
        onPress={onAdd}
        style={({ pressed }) => [styles.plus, pressed && styles.pressed]}
      >
        <Text variant="label" style={{ color: colors.onPrimary }}>
          {t.session.addRoundLabel(1)}
        </Text>
      </Pressable>
    </View>
  );
}

const makeCounterStyles = (colors: Colors) =>
  StyleSheet.create({
    box: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    minus: {
      width: touch.minTarget,
      height: touch.minTarget,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.iconButton,
    },
    hidden: { opacity: 0 },
    count: { alignItems: 'center', minWidth: 64 },
    plus: {
      flex: 1,
      minHeight: touch.button,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    pressed: { backgroundColor: colors.primaryPressed },
  });
