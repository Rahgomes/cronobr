// Avisos (E03): o que cada evento do motor vira em som, fala e vibração. Puro: quem toca,
// fala e vibra são os adaptadores. Os três canais são independentes (P4) e cada leitura do
// motor gera no máximo UM som, UMA fala e UMA vibração, a do evento mais importante: duas
// coisas ao mesmo tempo no ouvido não se entendem.
import type { SessionEvent } from './events';
import type { Phase, Segment } from './timeline';

export const PHASE_LABEL: Record<Phase, string> = {
  prep: 'Preparação',
  work: 'Exercício',
  rest: 'Descanso',
  blockRest: 'Descanso entre blocos',
  cooldown: 'Desaquecimento',
};

/** Sons do pacote (originais, gerados para o app). */
export const SOUND_IDS = ['beepShort', 'beepLong', 'bell', 'gong', 'whistle', 'finish'] as const;
export type SoundId = (typeof SOUND_IDS)[number];

/** Grupos que o usuário configura: descanso entre blocos e desaquecimento soam como descanso. */
export type SoundSlot = 'prep' | 'work' | 'rest' | 'finish';

export type Haptic = 'tick' | 'phase' | 'finish';

export interface CuePrefs {
  sound: boolean;
  voice: boolean;
  vibration: boolean;
  /** Beep curto nos 3 últimos segundos de cada etapa com tempo. */
  countdown: boolean;
  sounds: Record<SoundSlot, SoundId>;
}

export const DEFAULT_CUE_PREFS: CuePrefs = {
  sound: true,
  voice: true,
  vibration: true,
  countdown: true,
  sounds: { prep: 'beepLong', work: 'bell', rest: 'whistle', finish: 'finish' },
};

export interface Cues {
  sound: SoundId | null;
  speech: string | null;
  haptic: Haptic | null;
}

const NONE: Cues = { sound: null, speech: null, haptic: null };

export function soundSlot(phase: Phase): SoundSlot {
  if (phase === 'prep' || phase === 'work') return phase;
  return 'rest';
}

/** "20 segundos", "1 minuto", "1 minuto e 30 segundos". */
export function spokenDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const unit = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;
  const parts: string[] = [];
  if (minutes > 0) parts.push(unit(minutes, 'minuto', 'minutos'));
  if (seconds > 0 || minutes === 0) parts.push(unit(seconds, 'segundo', 'segundos'));
  return parts.join(' e ');
}

/** Nome próprio da etapa, ou null quando é o rótulo genérico ("Exercício", "Descanso"). */
function ownName(segment: Segment): string | null {
  return segment.name === PHASE_LABEL[segment.phase] ? null : segment.name;
}

function nextWork(timeline: readonly Segment[], from: number): Segment | undefined {
  return timeline.slice(from + 1).find((s) => s.phase === 'work');
}

function isLastRoundStart(timeline: readonly Segment[], segment: Segment): boolean {
  if (segment.round === null || segment.rounds === null || segment.rounds < 2) return false;
  if (segment.round !== segment.rounds) return false;
  return !timeline
    .slice(0, segment.index)
    .some((s) => s.phase === 'work' && s.block === segment.block && s.round === segment.round);
}

/** A frase falada ao entrar na etapa. */
export function phasePhrase(timeline: readonly Segment[], segment: Segment): string {
  const name = ownName(segment);
  switch (segment.phase) {
    case 'work': {
      const what = name ?? 'Vai';
      const amount =
        segment.durationMs === null
          ? `${String(segment.reps ?? 0)} repetições`
          : spokenDuration(segment.durationMs);
      const lead = isLastRoundStart(timeline, segment) ? 'Última rodada. ' : '';
      return `${lead}${what}, ${amount}`;
    }
    case 'prep':
    case 'rest': {
      const upcoming = nextWork(timeline, segment.index);
      const upcomingName = upcoming ? ownName(upcoming) : null;
      const label = segment.phase === 'prep' ? 'Preparar' : PHASE_LABEL.rest;
      return upcomingName ? `${label}. Próximo: ${upcomingName}` : label;
    }
    default:
      return name ?? PHASE_LABEL[segment.phase];
  }
}

export const COMPLETED_PHRASE = 'Treino concluído';
const HALFWAY_PHRASE = 'Metade';

/** Ordem de importância dentro de uma mesma leitura. */
const RANK: Record<SessionEvent['type'], number> = {
  completed: 3,
  phase: 2,
  halfway: 1,
  countdown: 0,
};

export function cuesFor(
  events: readonly SessionEvent[],
  timeline: readonly Segment[],
  prefs: CuePrefs,
): Cues {
  const top = [...events].sort((a, b) => RANK[b.type] - RANK[a.type])[0];
  if (!top) return NONE;
  let cues: Cues;
  switch (top.type) {
    case 'completed':
      cues = { sound: prefs.sounds.finish, speech: COMPLETED_PHRASE, haptic: 'finish' };
      break;
    case 'phase': {
      const segment = timeline[top.segment];
      // Fase atrasada = o app voltou de suspensão: a notificação já avisou; a tela mostra.
      if (!segment || top.late) return NONE;
      cues = {
        sound: prefs.sounds[soundSlot(top.phase)],
        speech: phasePhrase(timeline, segment),
        haptic: 'phase',
      };
      break;
    }
    case 'halfway':
      cues = { sound: null, speech: HALFWAY_PHRASE, haptic: null };
      break;
    case 'countdown':
      cues = prefs.countdown ? { sound: 'beepShort', speech: null, haptic: 'tick' } : NONE;
      break;
  }
  return {
    sound: prefs.sound ? cues.sound : null,
    speech: prefs.voice ? cues.speech : null,
    haptic: prefs.vibration ? cues.haptic : null,
  };
}

const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isSound = (v: unknown): v is SoundId => (SOUND_IDS as readonly unknown[]).includes(v);

/** Lê as preferências gravadas campo a campo: o que estiver estragado volta ao padrão. */
export function parseCuePrefs(raw: unknown): CuePrefs {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const s = (typeof o.sounds === 'object' && o.sounds !== null ? o.sounds : {}) as Record<
    string,
    unknown
  >;
  const d = DEFAULT_CUE_PREFS;
  const slot = (k: SoundSlot) => (isSound(s[k]) ? s[k] : d.sounds[k]);
  return {
    sound: isBool(o.sound) ? o.sound : d.sound,
    voice: isBool(o.voice) ? o.voice : d.voice,
    vibration: isBool(o.vibration) ? o.vibration : d.vibration,
    countdown: isBool(o.countdown) ? o.countdown : d.countdown,
    sounds: { prep: slot('prep'), work: slot('work'), rest: slot('rest'), finish: slot('finish') },
  };
}
