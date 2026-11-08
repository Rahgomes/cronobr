// Ajustes (E06): tema e idioma à vista; som e avisos um toque adiante (personalização progressiva).
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LANGUAGES, type Appearance, type LanguagePref, type ThemePref } from '@/domain/appearance';
import { LANGUAGE_NAME, useT } from '@/i18n/i18n-context';
import { Card } from '@/ui/card';
import { Chip } from '@/ui/chip';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { SectionTitle } from '@/ui/section-title';
import { Text } from '@/ui/text';
import { useColors } from '@/ui/theme-context';
import { space, touch } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { useAppearance } from './appearance-context';

export function SettingsScreen() {
  const t = useT();
  const colors = useColors();
  const { appearance, deviceLanguage, setAppearance } = useAppearance();
  const [failed, setFailed] = useState(false);

  const update = (patch: Partial<Appearance>) => {
    setFailed(false);
    setAppearance({ ...appearance, ...patch }).catch(() => {
      setFailed(true);
    });
  };

  const themes: { value: ThemePref; label: string }[] = [
    { value: 'auto', label: t.settings.themeAuto },
    { value: 'light', label: t.settings.themeLight },
    { value: 'dark', label: t.settings.themeDark },
  ];
  const languages: { value: LanguagePref; label: string }[] = [
    { value: 'auto', label: t.settings.languageAuto(LANGUAGE_NAME[deviceLanguage]) },
    ...LANGUAGES.map((value) => ({ value, label: LANGUAGE_NAME[value] })),
  ];

  return (
    <Screen>
      <TopBar title={t.settings.title} />
      <View style={styles.group}>
        <SectionTitle>{t.settings.theme}</SectionTitle>
        <View style={styles.chips} accessibilityLabel={t.settings.theme}>
          {themes.map(({ value, label }) => (
            <Chip
              key={value}
              label={label}
              selected={appearance.theme === value}
              onPress={() => {
                update({ theme: value });
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <SectionTitle>{t.settings.language}</SectionTitle>
        <View style={styles.chips} accessibilityLabel={t.settings.language}>
          {languages.map(({ value, label }) => (
            <Chip
              key={value}
              label={label}
              selected={appearance.language === value}
              onPress={() => {
                update({ language: value });
              }}
            />
          ))}
        </View>
        <Text variant="caption" color="textMuted">
          {t.settings.languageHint}
        </Text>
      </View>

      {failed ? <Notice tone="danger">{t.settings.saveFailed}</Notice> : null}

      <Card>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.settings.cues}
          accessibilityHint={t.settings.cuesHint}
          onPress={() => {
            router.push('/avisos');
          }}
          style={styles.link}
        >
          <MaterialCommunityIcons name="volume-high" size={24} color={colors.primary} />
          <View style={styles.grow}>
            <Text variant="label">{t.settings.cues}</Text>
            <Text variant="caption" color="textMuted">
              {t.settings.cuesHint}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  link: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: touch.minTarget },
  grow: { flex: 1 },
});
