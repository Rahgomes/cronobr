import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { usePresets } from '@/features/routines/presets';
import { PhotoBadge, PhotoCard } from '@/ui/photo-card';
import { Screen } from '@/ui/screen';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { MODALITY } from './catalog';

/** "Ver todas": as modalidades em grade, o mesmo card da Início. */
export function ModalitiesScreen() {
  const presets = usePresets();
  return (
    <Screen>
      <TopBar title="Modalidades" />
      <View style={styles.grid}>
        {presets.modalities.map((modality) => {
          const info = MODALITY[modality];
          const n = presets.of(modality).length;
          const count = n === 1 ? '1 modelo' : `${String(n)} modelos`;
          return (
            <PhotoCard
              key={modality}
              width="48%"
              height={240}
              photo={info.photo}
              title={info.label}
              subtitle={info.tagline}
              badge={<PhotoBadge label={count} />}
              accessibilityLabel={`${info.label}: ${info.tagline}, ${count}`}
              onPress={() => {
                router.push({ pathname: '/modalidade/[id]', params: { id: modality } });
              }}
            />
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.md,
  },
});
