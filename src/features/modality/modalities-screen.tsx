import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { usePresets } from '@/features/routines/presets';
import { useT } from '@/i18n/i18n-context';
import { PhotoBadge, PhotoCard } from '@/ui/photo-card';
import { Screen } from '@/ui/screen';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { MODALITY } from './catalog';

/** "Ver todas": as modalidades em grade, o mesmo card da Início. */
export function ModalitiesScreen() {
  const t = useT();
  const presets = usePresets();
  return (
    <Screen>
      <TopBar title={t.modality.title} />
      <View style={styles.grid}>
        {presets.modalities.map((modality) => {
          const info = MODALITY[modality];
          const text = t.modality[modality];
          const n = presets.of(modality).length;
          const count = t.modality.models(n);
          return (
            <PhotoCard
              key={modality}
              width="48%"
              height={240}
              photo={info.photo}
              title={text.label}
              subtitle={text.tagline}
              badge={<PhotoBadge label={count} />}
              accessibilityLabel={t.modality.cardLabel(text.label, text.tagline, count)}
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
