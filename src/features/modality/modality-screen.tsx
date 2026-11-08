import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { presetsOf } from '@/domain/presets';
import { MODALITIES, type Modality } from '@/domain/routine';
import { RoutineRow } from '@/features/home/routine-row';
import { Button } from '@/ui/button';
import { PhotoFill } from '@/ui/photo-card';
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
  const styles = useThemedStyles(makeStyles);
  if (!isModality(id) || presetsOf(id).length === 0) {
    return (
      <Screen
        footer={
          <Button
            label="Voltar ao início"
            onPress={() => {
              router.replace('/');
            }}
          />
        }
      >
        <Text variant="title" accessibilityRole="header">
          Modalidade não encontrada
        </Text>
      </Screen>
    );
  }
  const info = MODALITY[id];
  const presets = presetsOf(id);
  return (
    <Screen>
      <View style={styles.hero}>
        {info.photo === null ? null : <PhotoFill photo={info.photo} />}
        <View style={styles.heroTop}>
          <RoundAction
            icon="arrow-left"
            label="Voltar"
            onPress={() => {
              router.back();
            }}
          />
        </View>
        <View style={styles.band}>
          <Text variant="display" style={styles.onPhoto} accessibilityRole="header">
            {info.label}
          </Text>
          <Text style={styles.onPhotoMuted}>{info.tagline}</Text>
        </View>
      </View>
      <View style={styles.list}>
        <SectionTitle>{presets.length === 1 ? 'Modelo pronto' : 'Modelos prontos'}</SectionTitle>
        {presets.map((routine) => (
          <RoutineRow
            key={routine.id}
            routine={routine}
            onPress={() => {
              router.push({ pathname: '/sessao', params: { rotina: routine.id } });
            }}
          />
        ))}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    hero: {
      height: 240,
      justifyContent: 'space-between',
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.hero,
    },
    heroTop: { padding: space.md, alignItems: 'flex-start' },
    band: { backgroundColor: colors.photoScrim, padding: space.lg, gap: space.xs },
    onPhoto: { color: colors.onPhoto },
    onPhotoMuted: { color: colors.onPhotoMuted },
    list: { gap: space.sm },
  });
