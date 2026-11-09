import { useEffect, useRef, useState } from 'react';

import { createAudioClock } from './audio-clock';
import { Metronome, type AudioClock } from './engine';

/** Prévia de 4 batidas fora da tela do metrônomo (folha da etapa no editor, E07 C). */
export function useBeatPreview(createClock: () => AudioClock | null = createAudioClock) {
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const engine = useRef<{ clock: AudioClock; metronome: Metronome } | null>(null);
  useEffect(
    () => () => {
      engine.current?.metronome.stop();
      engine.current?.clock.close();
      engine.current = null;
    },
    [],
  );
  const play = (bpm: number) => {
    if (!engine.current) {
      const clock = createClock();
      if (!clock) {
        setUnavailable(true);
        return;
      }
      engine.current = {
        clock,
        metronome: new Metronome(
          clock,
          () => undefined,
          () => {
            setPlaying(false);
          },
        ),
      };
    }
    engine.current.clock.resume().catch(() => undefined);
    engine.current.metronome.start(bpm, 0, { preview: true });
    setPlaying(true);
  };
  return { playing, unavailable, play };
}
