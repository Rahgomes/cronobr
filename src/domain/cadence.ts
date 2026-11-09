// Cadência na etapa do treino (E07 C). Prioridade no ouvido, da maior para a menor:
// conclusão > troca de etapa (som e frase) > contagem 3, 2, 1 > meio do tempo > pulso.
// O pulso não disputa: nas janelas dos outros avisos o som dele cala e a tela segue pulsando.
// Puro: recebe a etapa e as preferências, devolve as janelas de silêncio do pulso.
import type { CuePrefs } from './cues';
import { HALFWAY_MIN_MS } from './events';
import type { Segment } from './timeline';

/** Som da fase mais a frase ("Agachamento, 40 segundos"): cabe com folga em 2,5 s. */
export const PHASE_QUIET_MS = 2500;
/** "Metade do tempo". */
export const HALFWAY_QUIET_MS = 1500;
const COUNTDOWN_MS = 3000;

export interface QuietWindow {
  from: number;
  to: number;
}

/** BPM que toca nesta etapa, ou null (sem cadência, ou pulso desligado nos avisos). */
export function cadenceOf(segment: Segment | undefined, prefs: CuePrefs): number | null {
  return prefs.pulse && segment?.bpm !== undefined ? segment.bpm : null;
}

/** Trechos da etapa (ms desde o começo dela) em que o som do pulso cala. */
export function quietWindows(segment: Segment, prefs: CuePrefs): QuietWindow[] {
  const windows: QuietWindow[] = [];
  if (prefs.sound || prefs.voice) windows.push({ from: 0, to: PHASE_QUIET_MS });
  const duration = segment.durationMs;
  if (duration === null) return windows;
  if (prefs.voice && segment.phase === 'work' && duration >= HALFWAY_MIN_MS) {
    windows.push({ from: duration / 2, to: duration / 2 + HALFWAY_QUIET_MS });
  }
  if (prefs.sound && prefs.countdown) {
    windows.push({ from: Math.max(0, duration - COUNTDOWN_MS), to: duration });
  }
  // A fila marca até 1,5 s à frente: o que passar do fim é da próxima etapa (o aviso dela, ou o
  // pulso dela, que recomeça na troca). Sem isso uma batida podia cair em cima do apito.
  windows.push({ from: duration, to: Infinity });
  return windows;
}

export const isQuiet = (windows: readonly QuietWindow[], elapsedMs: number) =>
  windows.some((w) => elapsedMs >= w.from && elapsedMs < w.to);
