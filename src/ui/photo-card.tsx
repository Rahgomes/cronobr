import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import type { Colors } from './theme';
import { useThemedStyles } from './theme-context';
import { radius, space } from './tokens';

/**
 * Card com foto de fundo (C01b): título e uma linha embaixo, numa faixa escura que garante o
 * contraste em qualquer foto. Sem foto, vira um card escuro liso com o mesmo desenho.
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
  const content = (
    <View style={styles.fill}>
      <View style={styles.shade} />
      <View style={styles.band}>
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
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width, height }, pressed && styles.pressed]}
    >
      {photo === null ? null : <PhotoFill photo={photo} />}
      {content}
    </Pressable>
  );
}

/** Foto cobrindo o fundo, decorativa (o rótulo do card já diz o que é). */
export function PhotoFill({ photo }: { photo: number }) {
  return (
    <Image
      source={photo}
      resizeMode="cover"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
      // Largura e altura explícitas: no web o absoluteFill sozinho deixa a foto no tamanho
      // natural (ampliada, mostrando só o canto escuro).
      style={fillStyles.photo}
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
  photo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
});

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.hero,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.85 },
    fill: { flex: 1, justifyContent: 'flex-end' },
    shade: { ...StyleSheet.absoluteFill, backgroundColor: colors.photoShade },
    band: {
      backgroundColor: colors.photoScrim,
      paddingHorizontal: space.md,
      paddingTop: space.sm,
      paddingBottom: space.md,
      gap: space.xs,
    },
    title: { color: colors.onPhoto },
    subtitle: { color: colors.onPhotoMuted },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingHorizontal: space.sm,
      paddingVertical: 2,
      marginTop: space.xs,
    },
    badgeText: { color: colors.onPrimary, fontWeight: '700' },
  });
