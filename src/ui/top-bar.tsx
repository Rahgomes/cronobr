import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n/i18n-context';

import { Text } from './text';
import type { Colors } from './theme';
import { useColors, useThemedStyles } from './theme-context';
import { radius, space, touch } from './tokens';

/**
 * Topo das telas internas no visual v2 (PRD 23 F0.6): voltar num botão redondo suave, título na
 * serifada e, à direita, até duas ações (RoundAction).
 */
export function TopBar({ title, right }: { title: string; right?: ReactNode }) {
  const colors = useColors();
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.back}
        hitSlop={2}
        onPress={() => {
          // Aberta direto (link, recarregar a página): sem tela anterior, volta para a Início.
          if (router.canGoBack()) router.back();
          else router.replace('/');
        }}
        style={({ pressed }) => [styles.round, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="arrow-left" size={space.xl} color={colors.text} />
      </Pressable>
      <Text
        variant="title"
        style={styles.title}
        accessibilityRole="header"
        // Duas linhas com letra ampliada, sem cortar a palavra (E06 C).
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}

/** Ação redonda do topo (olho, exportar, mais opções), no mesmo desenho do voltar. */
export function RoundAction({
  icon,
  label,
  onPress,
  tone = 'text',
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  /** `onPhase`: sobre a cor da fase (sessão em Foco), igual ao cadeado. */
  tone?: 'text' | 'primary' | 'gold' | 'onPhase';
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={2}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        tone === 'gold' && { backgroundColor: colors.goldSoft },
        tone === 'onPhase' && styles.onPhase,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={space.xl} color={colors[tone]} />
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    // 44 de círculo + 2 de hitSlop em volta = os 48 de toque.
    round: {
      width: touch.minTarget - 4,
      height: touch.minTarget - 4,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.iconButton,
    },
    pressed: { backgroundColor: colors.accentSoft },
    onPhase: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
    title: { flex: 1, minWidth: 0 },
  });
