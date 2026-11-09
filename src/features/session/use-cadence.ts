import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { cadenceOf, isQuiet, quietWindows } from '@/domain/cadence';
import type { CuePrefs } from '@/domain/cues';
import type { Segment } from '@/domain/timeline';
import { Metronome, type AudioClock } from '@/features/metronome/engine';

/**
 * Pulso da etapa (E07 C): toca o BPM da etapa enquanto o treino roda e a tela está à vista.
 * Recomeça a cada troca de etapa (`phaseStamp`, o mesmo momento em que sai o aviso da fase), na
 * pausa para, e cala o som nas janelas dos outros avisos (prioridade em domain/cadence.ts).
 */
export function useCadence({
  segment,
  elapsedMs,
  running,
  phaseStamp,
  prefs,
  offsetMs,
  createClock,
}: {
  segment: Segment | undefined;
  elapsedMs: number;
  running: boolean;
  phaseStamp: number;
  prefs: CuePrefs;
  offsetMs: number;
  createClock: () => AudioClock | null;
}) {
  const bpm = cadenceOf(segment, prefs);
  const [beat, setBeat] = useState(-1);
  const [visible, setVisible] = useState(AppState.currentState !== 'background');
  const engine = useRef<{ clock: AudioClock; metronome: Metronome } | null>(null);
  const unavailable = useRef(false);
  // Lidos na hora de começar; mudar a cada leitura do relógio não deve recomeçar o pulso.
  const latest = useRef({ segment, elapsedMs, prefs, createClock });
  useEffect(() => {
    latest.current = { segment, elapsedMs, prefs, createClock };
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setVisible(state !== 'background');
    });
    return () => {
      sub.remove();
      engine.current?.metronome.stop();
      engine.current?.clock.close();
      engine.current = null;
    };
  }, []);

  const index = segment?.index ?? -1;
  const { sound, voice, countdown } = prefs;
  useEffect(() => {
    const now = latest.current;
    if (bpm === null || !running || !visible || !now.segment || unavailable.current) return;
    if (!engine.current) {
      const clock = now.createClock();
      if (!clock) {
        // Sem áudio no aparelho: o treino segue sem pulso; não insiste a cada etapa.
        unavailable.current = true;
        return;
      }
      engine.current = {
        clock,
        metronome: new Metronome(
          clock,
          (event) => {
            setBeat(event.index);
          },
          () => undefined,
        ),
      };
    }
    const { clock, metronome } = engine.current;
    const windows = quietWindows(now.segment, now.prefs);
    const startedAt = now.elapsedMs;
    clock.resume().catch(() => undefined);
    metronome.start(bpm, offsetMs, {
      muted: (since) => isQuiet(windows, startedAt + since),
    });
    return () => {
      metronome.stop();
      setBeat(-1);
    };
  }, [bpm, running, visible, index, phaseStamp, offsetMs, sound, voice, countdown]);

  return { bpm, beat: bpm === null || !running ? -1 : beat };
}
