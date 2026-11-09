// Web: a Web Audio do próprio navegador, sem a lib nativa no pacote.
import { clockFrom, type ClickContext } from './click';
import type { AudioClock } from './engine';

export function createAudioClock(): AudioClock | null {
  const Ctor = (globalThis as { AudioContext?: new () => ClickContext }).AudioContext;
  if (!Ctor) return null;
  try {
    return clockFrom(new Ctor());
  } catch {
    return null;
  }
}
