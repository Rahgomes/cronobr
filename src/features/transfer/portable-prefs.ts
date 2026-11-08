// Preferências que viajam no backup (E05). Fica de fora o que é do aparelho ou do momento:
// cronômetro em andamento, rascunhos do editor, marca da importação do app antigo, permissões.
import { parseCuePrefs, SOUND_IDS } from '@/domain/cues';
import { parseSessionPrefs } from '@/domain/session-prefs';
import { CUE_PREFS_KEY } from '@/features/cues/cue-context';
import { INTERVAL_KEY } from '@/features/quick/interval-setup-screen';
import { parseInterval, parseTimer } from '@/features/quick/parse';
import { TIMER_KEY } from '@/features/quick/timer-setup-screen';
import { FAVORITES_KEY, parseFavorites } from '@/features/routines/favorites';
import { SESSION_PREFS_KEY } from '@/features/session/session-view';

const PARSERS: Record<string, (raw: unknown) => unknown> = {
  [CUE_PREFS_KEY]: parseCuePrefs,
  [SESSION_PREFS_KEY]: parseSessionPrefs,
  [FAVORITES_KEY]: parseFavorites,
  [INTERVAL_KEY]: parseInterval,
  [TIMER_KEY]: (raw) => {
    const timer = parseTimer(raw);
    return { ...timer, name: timer.name.slice(0, 60) };
  },
};

export const PORTABLE_PREF_KEYS = Object.keys(PARSERS);

const unknownSounds = (raw: unknown): number => {
  const sounds = (raw as { sounds?: unknown } | null)?.sounds;
  if (typeof sounds !== 'object' || sounds === null) return 0;
  return Object.values(sounds).filter((id) => !(SOUND_IDS as readonly unknown[]).includes(id))
    .length;
};

export interface PortablePrefs {
  prefs: Record<string, unknown>;
  /** Avisos de adaptação para a prévia ("som trocado pelo padrão", "voz deste aparelho"). */
  notes: string[];
}

/**
 * Preferências do arquivo, campo a campo: chave desconhecida some, valor estranho volta ao
 * padrão, favorita que aponta para rotina que não existe é tirada.
 */
export function portablePrefs(
  raw: Record<string, unknown>,
  knownIds: ReadonlySet<string>,
): PortablePrefs {
  const prefs: Record<string, unknown> = {};
  const notes: string[] = [];
  for (const [key, parse] of Object.entries(PARSERS)) {
    if (!(key in raw)) continue;
    prefs[key] = parse(raw[key]);
  }
  if (CUE_PREFS_KEY in raw) {
    const missing = unknownSounds(raw[CUE_PREFS_KEY]);
    if (missing > 0) notes.push('Som que não existe nesta versão: ficou o som padrão.');
    if (parseCuePrefs(raw[CUE_PREFS_KEY]).voice) {
      notes.push('Voz: usa a voz em português deste aparelho.');
    }
  }
  const favorites = prefs[FAVORITES_KEY];
  if (Array.isArray(favorites)) {
    const kept = favorites.filter((id): id is string => typeof id === 'string' && knownIds.has(id));
    if (kept.length < favorites.length) {
      notes.push('Favoritas de rotinas que não vieram no arquivo ficaram de fora.');
    }
    prefs[FAVORITES_KEY] = kept;
  }
  return { prefs, notes };
}
