import { StyleSheet, View } from 'react-native';

import { SOUND_IDS, type CuePrefs, type SoundSlot } from '@/domain/cues';
import { useT } from '@/i18n/i18n-context';
import { Card } from '@/ui/card';
import { Chip } from '@/ui/chip';
import { Screen } from '@/ui/screen';
import { SectionTitle } from '@/ui/section-title';
import { Switch } from '@/ui/switch';
import { Text } from '@/ui/text';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { useCues } from './cue-context';
import { NotificationsBlocked } from './notifications-blocked';

type Toggle = 'sound' | 'voice' | 'vibration' | 'countdown' | 'pulse';

const SLOTS: SoundSlot[] = ['prep', 'work', 'rest', 'finish'];

/** Som, voz e vibração: canais independentes (P4), com prévia ao escolher o som. */
export function CueSettingsScreen() {
  const t = useT();
  const toggles: { key: Toggle; label: string; hint: string }[] = [
    { key: 'sound', label: t.cues.sound, hint: t.cues.soundHint },
    { key: 'countdown', label: t.cues.countdown, hint: t.cues.countdownHint },
    { key: 'voice', label: t.cues.voice, hint: t.cues.voiceHint },
    { key: 'vibration', label: t.cues.vibration, hint: t.cues.vibrationHint },
    { key: 'pulse', label: t.cues.pulse, hint: t.cues.pulseHint },
  ];

  const { prefs, setPrefs, port } = useCues();
  const update = (patch: Partial<CuePrefs>) => {
    setPrefs({ ...prefs, ...patch });
  };
  return (
    <Screen>
      <TopBar title={t.cues.title} />
      <NotificationsBlocked />
      <Card>
        {toggles.map(({ key, label, hint }) => (
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
              disabledHint={t.cues.enableSound}
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
              <SectionTitle>{t.cues.slots[slot]}</SectionTitle>
              <View style={styles.chips} accessibilityLabel={t.cues.slotSound(t.cues.slots[slot])}>
                {SOUND_IDS.map((sound) => (
                  <Chip
                    key={sound}
                    label={t.cues.sounds[sound]}
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
        {t.cues.lockedHint}
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
