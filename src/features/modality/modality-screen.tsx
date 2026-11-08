import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import { MODALITIES, type Modality, type Routine } from '@/domain/routine';
import { RoutineRow } from '@/features/home/routine-row';
import { useFavorites } from '@/features/routines/favorites';
import { usePresets } from '@/features/routines/presets';
import { RoutineOptions } from '@/features/routines/routine-options';
import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { PhotoFade, PhotoFill } from '@/ui/photo-card';
import { Screen } from '@/ui/screen';
import { SectionTitle } from '@/ui/section-title';
import { Text } from '@/ui/text';
import type { Colors } from '@/ui/theme';
import { useThemedStyles } from '@/ui/theme-context';
import { radius, space } from '@/ui/tokens';
import { RoundAction } from '@/ui/top-bar';

import { MODALITY } from './catalog';

function isModality(value: string | undefined): value is Modality {
  return (MODALITIES as readonly string[]).includes(value ?? '');
}

/** Uma modalidade: foto no topo e os modelos prontos dela. Criar e editar modelos entra na E04. */
export function ModalityScreen({ id }: { id: string | undefined }) {
  const t = useT();
  const library = usePresets();
  const styles = useThemedStyles(makeStyles);
  const repos = useRepos();
  const favorites = useFavorites();
  const [mine, setMine] = useState<Routine[]>([]);
  const [options, setOptions] = useState<Routine | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      repos.routines.list().then(
        (all) => {
          if (active) setMine(all.filter((r) => r.modality === id));
        },
        () => undefined,
      );
      return () => {
        active = false;
      };
    }, [repos, id]),
  );
  if (!isModality(id) || library.of(id).length === 0) {
    return (
      <Screen
        footer={
          <Button
            label={t.modality.backHome}
            onPress={() => {
              router.replace('/');
            }}
          />
        }
      >
        <Text variant="title" accessibilityRole="header">
          {t.modality.missing}
        </Text>
      </Screen>
    );
  }
  const info = MODALITY[id];
  const text = t.modality[id];
  const presets = library.of(id);
  const row = (routine: Routine) => (
    <RoutineRow
      key={routine.id}
      routine={routine}
      favorite={favorites.ids.includes(routine.id)}
      onPress={() => {
        router.push({ pathname: '/sessao', params: { rotina: routine.id } });
      }}
      onMore={() => {
        setOptions(routine);
      }}
    />
  );
  return (
    <Screen>
      <View style={styles.hero}>
        {info.photo === null ? null : <PhotoFill photo={info.photo} align="top" />}
        <PhotoFade />
        <View style={styles.heroTop}>
          <RoundAction
            icon="arrow-left"
            label={t.modality.back}
            onPress={() => {
              router.back();
            }}
          />
        </View>
        <View style={styles.band}>
          <Text variant="display" style={styles.onPhoto} accessibilityRole="header">
            {text.label}
          </Text>
          <Text style={styles.onPhotoMuted}>{text.tagline}</Text>
        </View>
      </View>
      <View style={styles.list}>
        <SectionTitle>{t.modality.readyModels(presets.length)}</SectionTitle>
        {presets.map((routine) => row(routine))}
        <Text variant="caption" color="textMuted">
          {t.modality.editHint}
        </Text>
      </View>
      {mine.length > 0 ? (
        <View style={styles.list}>
          <SectionTitle>{t.modality.yourRoutines(text.label)}</SectionTitle>
          {mine.map((routine) => row(routine))}
        </View>
      ) : null}
      <Button
        label={t.modality.createRoutine(text.label)}
        kind="secondary"
        onPress={() => {
          router.push({ pathname: '/rotina/[id]', params: { id: 'nova', modalidade: id } });
        }}
      />
      <RoutineOptions
        routine={options}
        actions={
          options
            ? {
                favorite: favorites.ids.includes(options.id),
                toggleFavorite: () => {
                  favorites.toggle(options.id);
                },
                edit: () => {
                  router.push(
                    options.origin === 'preset'
                      ? { pathname: '/rotina/[id]', params: { id: 'nova', de: options.id } }
                      : { pathname: '/rotina/[id]', params: { id: options.id } },
                  );
                },
              }
            : null
        }
        onClose={() => {
          setOptions(null);
        }}
      />
    </Screen>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    hero: {
      height: 320,
      justifyContent: 'space-between',
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.hero,
    },
    heroTop: { padding: space.md, alignItems: 'flex-start' },
    band: { padding: space.lg, gap: space.xs },
    onPhoto: { color: colors.onPhoto },
    onPhotoMuted: { color: colors.onPhotoMuted },
    list: { gap: space.sm },
  });
