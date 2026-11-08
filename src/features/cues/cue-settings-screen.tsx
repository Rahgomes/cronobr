import { StyleSheet, View } from 'react-native';

import { SOUND_IDS, type CuePrefs, type SoundSlot } from '@/domain/cues';
import { Card } from '@/ui/card';
import { Chip } from '@/ui/chip';
import { Screen } from '@/ui/screen';
import { SectionTitle } from '@/ui/section-title';
import { Switch } from '@/ui/switch';
import { Text } from '@/ui/text';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { useCues } from './cue-context';
import { SLOT_LABEL, SOUND_LABEL } from './labels';

type Toggle = 'sound' | 'voice' | 'vibration' | 'countdown';

const TOGGLES: { key: Toggle; label: string; hint: string }[] = [
  { key: 'sound', label: 'Som', hint: 'Um som próprio em cada troca de fase.' },
  { key: 'countdown', label: 'Contagem 3, 2, 1', hint: 'Beep curto nos 3 últimos segundos.' },
  { key: 'voice', label: 'Voz', hint: 'Diz o exercício, o tempo e o próximo.' },
  { key: 'vibration', label: 'Vibração', hint: 'Para o celular no bolso, sem fone.' },
];

const SLOTS: SoundSlot[] = ['prep', 'work', 'rest', 'finish'];

/** Som, voz e vibração: canais independentes (P4), com prévia ao escolher o som. */
export function CueSettingsScreen() {
  const { prefs, setPrefs, port } = useCues();
  const update = (patch: Partial<CuePrefs>) => {
    setPrefs({ ...prefs, ...patch });
  };
  return (
    <Screen>
      <TopBar title="Som e avisos" />
      <Card>
        {TOGGLES.map(({ key, label, hint }) => (
          <View key={key} style={styles.row}>
            <View style={styles.rowText}>
              <Text variant="label">{label}</Text>
              <Text variant="caption" color="textMuted">
                {hint}
              </Text>
            </View>
            <Switch
              value={prefs[key]}
              accessibilityLabel={label}
              disabled={key === 'countdown' && !prefs.sound}
              disabledHint="Ligue o som para usar a contagem."
              onValueChange={(value) => {
                update({ [key]: value });
              }}
            />
          </View>
        ))}
      </Card>

      {prefs.sound
        ? SLOTS.map((slot) => (
            <View key={slot} style={styles.group}>
              <SectionTitle>{SLOT_LABEL[slot]}</SectionTitle>
              <View style={styles.chips} accessibilityLabel={`Som de ${SLOT_LABEL[slot]}`}>
                {SOUND_IDS.map((sound) => (
                  <Chip
                    key={sound}
                    label={SOUND_LABEL[sound]}
                    selected={prefs.sounds[slot] === sound}
                    onPress={() => {
                      port.preview(sound);
                      update({ sounds: { ...prefs.sounds, [slot]: sound } });
                    }}
                  />
                ))}
              </View>
            </View>
          ))
        : null}

      <Text variant="caption" color="textMuted">
        Com a tela bloqueada, as trocas de fase chegam como notificação com o mesmo som. O volume
        segue o do aparelho, e o modo silencioso é respeitado.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  rowText: { flex: 1, gap: 2 },
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
