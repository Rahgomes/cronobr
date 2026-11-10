import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState, type ComponentRef, type RefObject } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { clock } from '@/domain/format';
import { digits, fit, readCount, readDuration, splitDuration } from '@/domain/number-input';
import { useT } from '@/i18n/i18n-context';

import { Text } from './text';
import type { Colors } from './theme';
import { useColors, useThemedStyles } from './theme-context';
import { radius, space, touch } from './tokens';

/** Depois de sair de um campo, espera o foco chegar no outro antes de dar a edição por feita. */
const BLUR_GRACE_MS = 150;

const seconds = (s: number) => clock(s * 1000);

interface Draft {
  a: string;
  b: string;
}

/**
 * Valor com − e + e, tocando no número, digitado à mão (D134). Cada botão tem nome próprio
 * ("Aumentar Exercício"), e o valor é anunciado quando muda. Segurar não repete: um toque,
 * um passo, previsível com luva e mão suada. `duration`: o valor é em segundos e a edição tem
 * minutos e segundos; o que passar do limite é ajustado e explicado.
 */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  kind = 'count',
  format = kind === 'duration' ? seconds : String,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  kind?: 'count' | 'duration';
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const [draft, setDraftState] = useState<Draft | null>(null);
  // O que está digitado agora: a confirmação pode vir de um blur atrasado, depois de outro render.
  const live = useRef<Draft | null>(null);
  const setDraft = (next: Draft | null) => {
    live.current = next;
    setDraftState(next);
  };
  const [notice, setNotice] = useState<string | null>(null);
  const focused = useRef(0);
  const second = useRef<ComponentRef<typeof TextInput>>(null);

  const begin = () => {
    setNotice(null);
    focused.current = 0;
    if (kind === 'duration') {
      const parts = splitDuration(value);
      setDraft({ a: parts.minutes, b: parts.seconds });
    } else setDraft({ a: String(value), b: '' });
  };

  const commit = () => {
    const current = live.current;
    if (!current) return;
    const raw = kind === 'duration' ? readDuration(current.a, current.b) : readCount(current.a);
    const result = fit(raw, min, max);
    setDraft(null);
    setNotice(result.clamped ? t.ui.limit(format(min), format(max)) : null);
    if (result.value !== value) onChange(result.value);
  };

  const onFocus = () => {
    focused.current += 1;
  };
  const onBlur = () => {
    focused.current -= 1;
    setTimeout(() => {
      if (focused.current <= 0) commit();
    }, BLUR_GRACE_MS);
  };

  const button = (dir: -1 | 1) => {
    const next = Math.min(max, Math.max(min, value + dir * step));
    const disabled = next === value;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dir < 0 ? t.ui.decrease(label) : t.ui.increase(label)}
        accessibilityState={{ disabled }}
        disabled={disabled}
        hitSlop={4}
        onPress={() => {
          setNotice(null);
          onChange(next);
        }}
        style={({ pressed }) => [styles.button, disabled && styles.off, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons
          name={dir < 0 ? 'minus' : 'plus'}
          size={22}
          color={disabled ? colors.textMuted : colors.primary}
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
        {draft ? (
          <>
            {kind === 'duration' ? (
              <>
                <NumberBox
                  label={t.ui.minutesOf(label)}
                  value={draft.a}
                  width={56}
                  maxLength={4}
                  autoFocus
                  last={false}
                  onChange={(a) => {
                    setDraft({ ...draft, a });
                  }}
                  onSubmit={() => {
                    second.current?.focus();
                  }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <Text variant="title">:</Text>
                <NumberBox
                  inputRef={second}
                  label={t.ui.secondsOf(label)}
                  value={draft.b}
                  width={52}
                  maxLength={2}
                  autoFocus={false}
                  last
                  onChange={(b) => {
                    setDraft({ ...draft, b });
                  }}
                  onSubmit={commit}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </>
            ) : (
              <NumberBox
                label={label}
                value={draft.a}
                width={76}
                maxLength={4}
                autoFocus
                last
                onChange={(a) => {
                  setDraft({ ...draft, a });
                }}
                onSubmit={commit}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.ui.confirm(label)}
              hitSlop={4}
              onPress={commit}
              style={({ pressed }) => [styles.button, styles.confirm, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="check" size={22} color={colors.onPrimary} />
            </Pressable>
          </>
        ) : (
          <>
            {button(-1)}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${format(value)}`}
              accessibilityHint={t.ui.typeHint}
              onPress={begin}
              style={({ pressed }) => [styles.valueBox, pressed && styles.pressed]}
            >
              <Text variant="title" tabular style={styles.value} accessibilityLiveRegion="polite">
                {format(value)}
              </Text>
            </Pressable>
            {button(1)}
          </>
        )}
      </View>
      {notice ? (
        <Text variant="caption" color="textMuted" accessibilityLiveRegion="polite">
          {notice}
        </Text>
      ) : null}
    </View>
  );
}

/** Campo só de dígitos, teclado numérico; o texto já entra limpo (colar "1:30" não quebra). */
function NumberBox({
  inputRef,
  label,
  value,
  width,
  maxLength,
  autoFocus,
  last,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
}: {
  inputRef?: RefObject<ComponentRef<typeof TextInput> | null>;
  label: string;
  value: string;
  width: number;
  maxLength: number;
  autoFocus: boolean;
  last: boolean;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TextInput
      ref={inputRef}
      accessibilityLabel={label}
      value={value}
      onChangeText={(next) => {
        onChange(digits(next));
      }}
      keyboardType="number-pad"
      inputMode="numeric"
      returnKeyType={last ? 'done' : 'next'}
      selectTextOnFocus
      autoFocus={autoFocus}
      submitBehavior={last ? 'blurAndSubmit' : 'submit'}
      onSubmitEditing={onSubmit}
      onFocus={onFocus}
      onBlur={onBlur}
      maxLength={maxLength}
      style={[styles.input, { width }]}
    />
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    wrap: { gap: space.xs },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: touch.minTarget },
    label: { flex: 1 },
    // Número com cara de campo: a linha embaixo diz que dá para tocar e digitar.
    valueBox: {
      minWidth: 76,
      minHeight: touch.minTarget,
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.inputBorder,
    },
    value: { textAlign: 'center' },
    input: {
      minHeight: touch.minTarget,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: space.xs,
      color: colors.text,
      backgroundColor: colors.surface,
      fontSize: 20,
      textAlign: 'center',
    },
    button: {
      width: touch.minTarget,
      height: touch.minTarget,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirm: { backgroundColor: colors.primary, borderColor: colors.primary },
    off: { borderColor: colors.border },
    pressed: { opacity: 0.7 },
  });
