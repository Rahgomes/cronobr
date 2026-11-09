import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { useBlockedPress } from './hint';
import { Text } from './text';
import type { Colors } from './theme';
import { useColors, useThemedStyles } from './theme-context';
import { radius, space, touch } from './tokens';

/**
 * `inverse` e `inverseOutline` são para fundo de marca (cartão em degradê): claro com texto da
 * marca, e contorno claro com texto claro. Valem nos dois temas porque o degradê é sempre escuro.
 */
type Kind = 'primary' | 'secondary' | 'text' | 'inverse' | 'inverseOutline';

const LABEL_COLOR = {
  primary: 'onPrimary',
  secondary: 'primary',
  text: 'primary',
  inverse: 'hero',
  inverseOutline: 'onHero',
} as const;

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  kind?: Kind;
  loading?: boolean;
  /**
   * Ramon, 02/11: depois de gravar, o próprio botão confirma ("Salvo com sucesso") com um check,
   * por uns segundos (ver useSaveFeedback). O leitor de tela ouve o aviso à parte e o rótulo
   * continua o mesmo, então outro toque grava de novo normalmente.
   */
  done?: string | undefined;
  /** Desligado com motivo: tocar mostra o porquê num aviso rápido em vez de não fazer nada. */
  disabledHint?: string | undefined;
};

export function Button({
  label,
  kind = 'primary',
  loading = false,
  done,
  disabled,
  disabledHint,
  ...rest
}: Props) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const settled = !!done && !loading;
  const inactive = disabled === true || loading;
  const blocked = useBlockedPress(disabled === true && !loading, disabledHint);
  // Indisponível: cinza neutro com rótulo legível (opacidade derrubava o contraste do laranja).
  const unavailable = disabled === true && !loading;
  const ink = unavailable ? 'textMuted' : LABEL_COLOR[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityHint={blocked.explains ? disabledHint : rest.accessibilityHint}
      disabled={loading || blocked.pressDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[kind],
        pressed && kind === 'primary' && styles.primaryPressed,
        unavailable && kind !== 'text' && styles.inactive,
      ]}
      {...rest}
      onPress={blocked.explains ? blocked.explain : rest.onPress}
    >
      {() => (
        <>
          {loading ? (
            <ActivityIndicator color={colors[ink]} />
          ) : settled ? (
            <View style={styles.done}>
              <MaterialCommunityIcons name="check-circle" size={space.xl} color={colors[ink]} />
              <Text variant="label" color={ink}>
                {done}
              </Text>
            </View>
          ) : (
            <Text variant="label" color={ink} style={styles.label}>
              {label}
            </Text>
          )}
        </>
      )}
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    // Rótulo que quebra em duas linhas ("Salvar e começar" em tela estreita) fica centrado.
    label: { textAlign: 'center' },
    base: {
      minHeight: touch.button,
      borderRadius: radius.pill,
      paddingHorizontal: space.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: { backgroundColor: colors.primary, overflow: 'hidden' },
    primaryPressed: { backgroundColor: colors.primaryPressed },
    secondary: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
    text: { minHeight: touch.minTarget },
    inverse: { backgroundColor: colors.onHero },
    inverseOutline: { borderWidth: 1.5, borderColor: colors.onHero },
    inactive: { backgroundColor: colors.iconButton, borderColor: colors.iconButton },
    done: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  });
