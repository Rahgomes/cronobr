import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from './text';
import { mix } from './theme';
import { useColors } from './theme-context';
import { radius, space, touch, type ColorRole } from './tokens';
import { reduceMotionNow } from './use-reduce-motion';

// Abrir e fechar desliza (Ramon, 02/11: as perguntas frequentes abriam de supetão); o que está
// abaixo acompanha. Com "reduzir animações" ligado, abre direto.
const SLIDE = LayoutAnimation.create(220, 'easeInEaseOut', 'opacity');

type Icon = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Tons fixos do PRD 23 (seção 3): alerta âmbar, suave cinza, positivo verde, erro vermelho e
 * dourado de conquista. Cor nunca vai sozinha: todo aviso tem ícone e texto.
 */
export type NoticeTone = 'alert' | 'soft' | 'positive' | 'danger' | 'gold';

const TONES: Record<NoticeTone, { ink: ColorRole; icon: ColorRole; bg: ColorRole; glyph: Icon }> = {
  alert: { ink: 'warning', icon: 'warning', bg: 'warningSoft', glyph: 'alert-circle-outline' },
  soft: { ink: 'textMuted', icon: 'textMuted', bg: 'iconButton', glyph: 'information-outline' },
  positive: { ink: 'success', icon: 'success', bg: 'successSoft', glyph: 'check-circle-outline' },
  danger: { ink: 'danger', icon: 'danger', bg: 'dangerSoft', glyph: 'alert-octagon-outline' },
  gold: { ink: 'goldInk', icon: 'gold', bg: 'goldSoft', glyph: 'star-four-points-outline' },
};

type Props = {
  tone: NoticeTone;
  children: ReactNode;
  title?: string;
  icon?: Icon;
  /** Aviso clicável com seta, como o "Estou atrasada" da Hoje. */
  action?: { onPress: () => void; label: string };
  /** Pílula de uma linha ("Pago", "Faltam R$ 30", "Livre"). */
  inline?: boolean;
  /** "Como funciona": só o título aparece até ela tocar. Exige `title`. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Avisos que aparecem depois de uma ação ("Página salva") são lidos pelo leitor de tela. */
  live?: boolean;
  /** Erro ou pendência que a impede de seguir: papel de alerta para o leitor de tela. */
  alert?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Notice({
  tone,
  children,
  title,
  icon,
  action,
  inline = false,
  collapsible = false,
  defaultOpen = false,
  live = false,
  alert = false,
  style,
}: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(defaultOpen);
  const t = TONES[tone];
  const role = alert ? ({ accessible: true, accessibilityRole: 'alert' } as const) : {};
  const border = tone === 'soft' ? colors.border : mix(colors[t.icon], colors.background, 0.6);
  const body = isTextual(children) ? (
    <Text
      variant={inline ? 'caption' : title ? 'caption' : 'body'}
      color={title && tone !== 'soft' ? 'text' : t.ink}
      style={inline ? styles.inlineText : null}
    >
      {children}
    </Text>
  ) : (
    children
  );

  if (inline)
    return (
      <View
        style={[styles.inline, { backgroundColor: colors[t.bg] }, style]}
        accessibilityLiveRegion={live ? 'polite' : 'none'}
        {...role}
        // Retorno de ação ("Link copiado") é lido como um item só pelo leitor de tela.
        {...(live && typeof children === 'string'
          ? { accessible: true, accessibilityLabel: children }
          : {})}
      >
        <MaterialCommunityIcons name={icon ?? t.glyph} size={space.lg} color={colors[t.icon]} />
        {body}
      </View>
    );

  const boxStyle = [styles.box, { backgroundColor: colors[t.bg], borderColor: border }, style];

  // Recolhível: só o cabeçalho é botão e o conteúdo aberto fica fora dele. Com tudo dentro do
  // Pressable, o leitor de tela lia só o título e a resposta nunca era lida; e um botão dentro do
  // conteúdo virava botão dentro de botão.
  if (collapsible && !action) {
    reduceMotionNow();
    return (
      <View style={[boxStyle, styles.column]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityState={{ expanded: open }}
          // A caixa tem 12 de respiro em volta: o toque vale nele também (48 no total).
          hitSlop={space.md}
          onPress={() => {
            if (!reduceMotionNow()) LayoutAnimation.configureNext(SLIDE);
            setOpen((was) => !was);
          }}
          style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name={icon ?? t.glyph} size={space.xl} color={colors[t.icon]} />
          <Text variant="label" color={t.ink} style={styles.body}>
            {title}
          </Text>
          <MaterialCommunityIcons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={space.xl}
            color={colors[t.icon]}
          />
        </Pressable>
        {open ? (
          <View style={styles.panel} accessibilityLiveRegion={live ? 'polite' : 'none'}>
            {body}
          </View>
        ) : null}
      </View>
    );
  }

  const shown = !collapsible || open;
  const content = (
    <>
      <MaterialCommunityIcons name={icon ?? t.glyph} size={space.xl} color={colors[t.icon]} />
      <View style={styles.body}>
        {title ? (
          <Text variant="label" color={t.ink}>
            {title}
          </Text>
        ) : null}
        {shown ? body : null}
      </View>
      {action ? (
        <MaterialCommunityIcons name="chevron-right" size={space.xl} color={colors[t.icon]} />
      ) : null}
      {collapsible ? (
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={space.xl}
          color={colors[t.icon]}
        />
      ) : null}
    </>
  );

  if (action || collapsible)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action?.label ?? title}
        // Com ação, o rótulo é o do botão; o título do aviso ("O cartão é do Essencial") vira dica.
        accessibilityHint={action && title && title !== action.label ? title : undefined}
        accessibilityState={collapsible ? { expanded: open } : undefined}
        accessibilityLiveRegion={live ? 'polite' : 'none'}
        onPress={() => {
          if (action) action.onPress();
          else setOpen((was) => !was);
        }}
        style={({ pressed }) => [boxStyle, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  return (
    <View style={boxStyle} accessibilityLiveRegion={live ? 'polite' : 'none'} {...role}>
      {content}
    </View>
  );
}

/** Texto puro, inclusive "O recebimento de {valor}" (vira lista de strings): vai dentro de um Text. */
function isTextual(node: ReactNode): boolean {
  const plain = (n: unknown) => typeof n === 'string' || typeof n === 'number';
  return plain(node) || (Array.isArray(node) && node.every(plain));
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touch.minTarget,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  body: { flex: 1, gap: space.xs },
  pressed: { opacity: 0.85 },
  column: { flexDirection: 'column', alignItems: 'stretch', gap: space.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touch.minTarget - space.md * 2,
  },
  // Conteúdo aberto alinhado com o título (ícone de 24 + gap).
  panel: { paddingLeft: space.xl + space.md, gap: space.sm },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    minHeight: 28,
    paddingVertical: space.xs,
    paddingHorizontal: space.md - 2,
    borderRadius: radius.pill,
  },
  inlineText: { flexShrink: 1 },
});
