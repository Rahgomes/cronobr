import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import type { Colors } from './theme';
import { useColors, useThemedStyles } from './theme-context';
import { radius, space } from './tokens';

/**
 * Altura relativa (de cima para baixo) em que o degradê chega a `photoScrim` (78%). O texto do
 * card mora abaixo dela: o contraste do pior caso é medido em `theme.test.ts`.
 */
export const FADE_SOLID_AT = 0.45;

/**
 * Card com foto de fundo (C01b): a foto ocupa o card todo e um degradê do transparente ao quase
 * preto sobe por baixo do texto. Sem foto, vira um card escuro liso com o mesmo desenho.
 * O leitor de tela lê o card como um botão só, pelo `accessibilityLabel`.
 */
export function PhotoCard({
  photo,
  title,
  subtitle,
  badge,
  width,
  height,
  accessibilityLabel,
  onPress,
}: {
  photo: number | null;
  title: string;
  subtitle?: string | undefined;
  badge?: ReactNode;
  width: number | `${number}%`;
  height: number;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width, height }, pressed && styles.pressed]}
    >
      {photo === null ? null : <PhotoFill photo={photo} />}
      <PhotoFade />
      <View style={styles.text}>
        <Text variant="title" style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {badge}
      </View>
    </Pressable>
  );
}

/**
 * Foto cobrindo o fundo, decorativa (o rótulo do card já diz o que é). `align="top"` para caixa
 * larga: a foto (retrato 2:3) ocupa a largura e mostra o alto, onde está o atleta, em vez do meio.
 */
export function PhotoFill({
  photo,
  align = 'center',
}: {
  photo: number;
  align?: 'center' | 'top';
}) {
  return (
    <Image
      source={photo}
      resizeMode="cover"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
      // Largura e altura explícitas: no web o absoluteFill sozinho deixa a foto no tamanho
      // natural (ampliada, mostrando só o canto escuro).
      style={align === 'top' ? fillStyles.top : fillStyles.cover}
    />
  );
}

/** Degradê de leitura: transparente no alto, `photoScrim` em FADE_SOLID_AT, quase preto embaixo. */
export function PhotoFade() {
  const colors = useColors();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[colors.photoClear, colors.photoClear, colors.photoScrim, colors.photoDeep]}
      locations={[0, 0.12, FADE_SOLID_AT, 1]}
      style={fillStyles.cover}
    />
  );
}

/** Selo laranja pequeno do card (duração, quantidade de modelos). */
export function PhotoBadge({ label }: { label: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.badge}>
      <Text variant="caption" style={styles.badgeText}>
        {label}
      </Text>
    </View>
  );
}

const fillStyles = StyleSheet.create({
  cover: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  top: { position: 'absolute', top: 0, left: 0, width: '100%', aspectRatio: 2 / 3 },
});

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      justifyContent: 'flex-end',
      backgroundColor: colors.hero,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.85 },
    text: { padding: space.md, gap: space.xs },
    title: { color: colors.onPhoto, fontSize: 22, lineHeight: 26, fontWeight: '800' },
    subtitle: { color: colors.onPhotoMuted },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingHorizontal: space.sm + 2,
      paddingVertical: 3,
      marginTop: space.xs,
    },
    badgeText: { color: colors.onPrimary, fontWeight: '700' },
  });
