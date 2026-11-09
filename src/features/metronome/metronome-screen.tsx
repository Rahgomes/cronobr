import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, StyleSheet, View } from 'react-native';

import { useStored } from '@/data/use-stored';
import {
  BPM_MAX,
  BPM_MIN,
  clampBpm,
  METRONOME_START,
  OFFSET_MAX_MS,
  OFFSET_STEP_MS,
  parseMetronome,
} from '@/domain/metronome';
import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Chip } from '@/ui/chip';
import { Screen } from '@/ui/screen';
import { Stepper } from '@/ui/stepper';
import { Text } from '@/ui/text';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { createAudioClock } from './audio-clock';
import { Metronome, type AudioClock } from './engine';
import { Pulse } from './pulse';

export const METRONOME_KEY = 'metronomo';
const TEMPOS = [60, 90, 120, 150, 180] as const;

type Mode = 'idle' | 'preview' | 'running';

/**
 * Metrônomo (E07 B): BPM de 30 a 240, prévia de 4 batidas, pulso na tela e atraso do fone.
 * Toca só com a tela aberta (D104); a precisão é do relógio de áudio (D97).
 */
export function MetronomeScreen({
  createClock = createAudioClock,
}: {
  createClock?: () => AudioClock | null;
}) {
  const t = useT();
  const [prefs, setPrefs, ready] = useStored(METRONOME_KEY, parseMetronome, METRONOME_START);
  const [mode, setMode] = useState<Mode>('idle');
  const [beat, setBeat] = useState(-1);
  const [unavailable, setUnavailable] = useState(false);
  const engine = useRef<{ clock: AudioClock; metronome: Metronome } | null>(null);

  const stop = () => {
    engine.current?.metronome.stop();
    setMode('idle');
    setBeat(-1);
  };

  // Sair da tela ou mandar o app para o fundo para o metrônomo; sair também fecha o áudio.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        engine.current?.metronome.stop();
        setMode('idle');
        setBeat(-1);
      }
    });
    return () => {
      sub.remove();
      engine.current?.metronome.stop();
      engine.current?.clock.close();
      engine.current = null;
    };
  }, []);

  const play = (preview: boolean) => {
    if (!engine.current) {
      const clock = createClock();
      if (!clock) {
        setUnavailable(true);
        return;
      }
      const metronome = new Metronome(
        clock,
        (event) => {
          setBeat(event.index);
        },
        () => {
          setMode('idle');
          setBeat(-1);
        },
      );
      engine.current = { clock, metronome };
    }
    const { clock, metronome } = engine.current;
    // O navegador só libera o áudio a partir de um toque: este é o toque.
    clock.resume().catch(() => undefined);
    metronome.start(prefs.bpm, prefs.offsetMs, { preview });
    setMode(preview ? 'preview' : 'running');
    if (!preview) AccessibilityInfo.announceForAccessibility(t.metronome.playing(prefs.bpm));
  };

  const changeBpm = (bpm: number) => {
    const next = clampBpm(bpm);
    setPrefs({ ...prefs, bpm: next });
    engine.current?.metronome.setBpm(next);
  };

  const running = mode === 'running';
  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            label={t.metronome.preview}
            kind="secondary"
            disabled={!ready || unavailable || mode !== 'idle'}
            onPress={() => {
              play(true);
            }}
          />
          <Button
            label={running ? t.metronome.stop : t.metronome.start}
            disabled={!ready || unavailable}
            onPress={() => {
              if (running) {
                stop();
                AccessibilityInfo.announceForAccessibility(t.metronome.stopped);
              } else play(false);
            }}
          />
        </View>
      }
    >
      {running ? <StayAwake /> : null}
      <TopBar title={t.metronome.title} />
      <View style={styles.dial}>
        <Text
          variant="display"
          tabular
          style={styles.bpm}
          accessibilityLabel={t.metronome.bpmLabel(prefs.bpm)}
        >
          {String(prefs.bpm)}
        </Text>
        <Text variant="label" color="textMuted" importantForAccessibility="no">
          {t.metronome.bpm}
        </Text>
        <View style={styles.pulse}>
          <Pulse beat={beat} />
        </View>
      </View>
      {unavailable ? (
        <Text color="danger" accessibilityRole="alert">
          {t.metronome.unavailable}
        </Text>
      ) : null}
      <Card style={styles.card}>
        <Stepper
          label={t.metronome.bpm}
          value={prefs.bpm}
          min={BPM_MIN}
          max={BPM_MAX}
          onChange={changeBpm}
        />
        <Text variant="caption" color="textMuted">
          {t.metronome.tempos}
        </Text>
        <View style={styles.tempos}>
          {TEMPOS.map((bpm) => (
            <Chip
              key={bpm}
              label={t.metronome.tempoLabel(bpm)}
              selected={prefs.bpm === bpm}
              onPress={() => {
                changeBpm(bpm);
              }}
            />
          ))}
        </View>
      </Card>
      <Card style={styles.card}>
        <Stepper
          label={t.metronome.offset}
          value={prefs.offsetMs}
          min={0}
          max={OFFSET_MAX_MS}
          step={OFFSET_STEP_MS}
          format={t.metronome.ms}
          onChange={(offsetMs) => {
            setPrefs({ ...prefs, offsetMs });
            engine.current?.metronome.setOffset(offsetMs);
          }}
        />
        <Text variant="caption" color="textMuted">
          {t.metronome.offsetHint}
        </Text>
      </Card>
      <Text variant="caption" color="textMuted">
        {t.metronome.screenOnly}
      </Text>
    </Screen>
  );
}

/** Tela acesa só enquanto toca: apagar a tela pararia o laço e o metrônomo junto. */
function StayAwake() {
  useKeepAwake('metronomo');
  return null;
}

const styles = StyleSheet.create({
  footer: { gap: space.sm },
  dial: { alignItems: 'center', gap: space.xs, paddingVertical: space.lg },
  bpm: { fontSize: 72, lineHeight: 80 },
  pulse: { marginTop: space.md },
  card: { gap: space.sm },
  tempos: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
