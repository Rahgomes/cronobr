// Avisos com o app fora da tela (E03): com a sessão rodando, cada troca de etapa futura vira
// uma notificação local agendada pelo relógio civil. O sistema toca o som na hora certa mesmo
// com o processo suspenso; nada de áudio silencioso para manter o app vivo. O plano é refeito
// a cada marco (começar, pausar, pular, voltar) e cancelado ao pausar ou encerrar.
import { phasePhrase, soundSlot, type CuePrefs } from './cues';
import { snapshot, type Instant, type Session } from './engine';
import type { Segment } from './timeline';
import type { Words } from './words';

/** O iOS guarda até 64 notificações pendentes por app; sobra folga para as de outros fluxos. */
export const MAX_ALERTS = 60;

export interface PlannedAlert {
  /** Relógio civil (Date.now) em que a etapa começa. */
  at: number;
  /** Etapa que começa; `null` = conclusão. */
  segment: number | null;
  title: string;
  body: string;
  sound: CuePrefs['sounds'][keyof CuePrefs['sounds']] | null;
}

function roundText(segment: Segment, w: Words): string | null {
  if (segment.round === null || segment.rounds === null || segment.rounds < 2) return null;
  return w.round(segment.round, segment.rounds);
}

/**
 * Trocas de etapa a partir de `now`, em ordem. Para numa etapa manual (o fim dela depende da
 * pessoa) e no limite do sistema. Fora de "rodando", não há o que agendar.
 */
export function planAlerts(
  session: Session,
  timeline: readonly Segment[],
  now: Instant,
  prefs: CuePrefs,
  w: Words,
  max = MAX_ALERTS,
): PlannedAlert[] {
  if (session.status !== 'running') return [];
  const snap = snapshot(session, timeline, now);
  if (snap.finished || snap.remainingMs === null) return [];
  const sound = (s: PlannedAlert['sound']) => (prefs.sound ? s : null);

  const alerts: PlannedAlert[] = [];
  let at = now.wall + snap.remainingMs;
  for (let index = snap.segment + 1; alerts.length < max; index += 1) {
    const segment = timeline[index];
    if (!segment) {
      alerts.push({
        at,
        segment: null,
        title: w.completed,
        body: session.routine.name,
        sound: sound(prefs.sounds.finish),
      });
      break;
    }
    const round = roundText(segment, w);
    alerts.push({
      at,
      segment: index,
      title: phasePhrase(timeline, segment, w),
      body: [round ?? w.phase[segment.phase], session.routine.name].join(' · '),
      sound: sound(prefs.sounds[soundSlot(segment.phase)]),
    });
    if (segment.durationMs === null) break;
    at += segment.durationMs;
  }
  return alerts;
}
