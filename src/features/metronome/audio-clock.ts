// Aparelho: relógio de áudio do `react-native-audio-api` (D97). A web usa audio-clock.web.ts.
import { clockFrom, type ClickContext } from './click';
import type { AudioClock } from './engine';

/**
 * Carga na hora de usar: num binário sem o módulo nativo, a importação no topo derrubaria o app
 * inteiro; assim só o metrônomo fica indisponível e a tela explica (devolve null).
 */
export function createAudioClock(): AudioClock | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga tardia de propósito
    const { AudioContext } = require('react-native-audio-api') as {
      AudioContext: new () => ClickContext;
    };
    return clockFrom(new AudioContext());
  } catch {
    return null;
  }
}
