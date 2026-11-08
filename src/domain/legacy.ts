// Conversão dos dados do app antigo (chaves `@cronobr/*` do AsyncStorage). Função pura:
// recebe o texto cru de cada chave e devolve o modelo novo + o que não deu para entender.
// Nada se perde: item ilegível volta em `problems` com o texto original para ficar guardado.
import { z } from 'zod';

import type { HistoryEntry } from './history';
import { LIMITS } from './limits';
import { intervalRoutine, type IntervalConfig, type Modality, type Routine } from './routine';
import { buildTimeline, summarize } from './timeline';

export const LEGACY_KEYS = {
  settings: '@cronobr/settings',
  profile: '@cronobr/profile',
  timerConfig: '@cronobr/timer_config',
  soundSettings: '@cronobr/sound_settings',
  appPreferences: '@cronobr/app_preferences',
  workoutProfiles: '@cronobr/workout_profiles',
  activeProfileId: '@cronobr/active_profile_id',
  workoutHistory: '@cronobr/workout_history',
  viewMode: '@cronobr/view_mode',
  speechSettings: '@cronobr/speech_settings',
} as const;
export type LegacyKey = keyof typeof LEGACY_KEYS;
export type LegacyRaw = Partial<Record<LegacyKey, string | null>>;

/** Padrão do app antigo quando não havia nada gravado. */
export const LEGACY_DEFAULT_CONFIG: IntervalConfig = {
  prepSeconds: 10,
  workSeconds: 30,
  restSeconds: 15,
  rounds: 5,
};

const CATEGORY: Record<string, Modality> = {
  EMOM: 'emom',
  AMRAP: 'amrap',
  HIIT: 'hiit',
  TABATA: 'tabata',
  BOXE: 'boxe',
  CIRCUITO: 'circuito',
};

export interface LegacyProblem {
  key: LegacyKey;
  reason: string;
  raw: string;
}

export interface LegacyImport {
  routines: Routine[];
  history: HistoryEntry[];
  quickConfig: IntervalConfig | null;
  /** Preferências antigas (som, voz, tema, idioma, perfil...) para as próximas etapas lerem. */
  prefs: Partial<Record<LegacyKey, unknown>>;
  problems: LegacyProblem[];
}

function whole(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Valores fora do limite são trazidos para dentro; tipo errado vira o padrão antigo. */
export function legacyConfig(input: unknown): IntervalConfig {
  const value = (typeof input === 'object' && input !== null ? input : {}) as Record<
    string,
    unknown
  >;
  const d = LEGACY_DEFAULT_CONFIG;
  return {
    prepSeconds: whole(value.prepTime, d.prepSeconds, 0, LIMITS.prepMaxSeconds),
    workSeconds: whole(
      value.exerciseTime,
      d.workSeconds,
      LIMITS.stepMinSeconds,
      LIMITS.stepMaxSeconds,
    ),
    restSeconds: whole(value.restTime, d.restSeconds, 0, LIMITS.stepMaxSeconds),
    rounds: whole(value.rounds, d.rounds, 1, LIMITS.repeatMax),
  };
}

const profileItem = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  category: z.string(),
  config: z.unknown().optional(),
});

const historyItem = z.object({
  id: z.string().min(1),
  timestamp: z.number().nonnegative(),
  duration: z.number().nonnegative(),
  type: z.string().optional(),
  presetName: z.string().optional(),
  presetCategory: z.string().optional(),
  config: z.unknown().optional(),
  completedRounds: z.number().optional(),
  wasInterrupted: z.boolean().optional(),
});

function parse(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false };
  }
}

function shortName(name: string): string {
  return name.trim().slice(0, LIMITS.nameMax);
}

export function convertLegacy(raw: LegacyRaw): LegacyImport {
  const result: LegacyImport = {
    routines: [],
    history: [],
    quickConfig: null,
    prefs: {},
    problems: [],
  };
  const problem = (key: LegacyKey, reason: string, value: unknown) => {
    result.problems.push({
      key,
      reason,
      raw: typeof value === 'string' ? value : JSON.stringify(value),
    });
  };

  for (const key of Object.keys(LEGACY_KEYS) as LegacyKey[]) {
    const text = raw[key];
    if (text == null) continue;
    const parsed = parse(text);
    if (key === 'activeProfileId' || key === 'viewMode') {
      // Gravados como texto puro no app antigo.
      result.prefs[key] = parsed.ok ? parsed.value : text;
      continue;
    }
    if (!parsed.ok) {
      problem(key, 'JSON ilegível', text);
      continue;
    }
    if (key === 'timerConfig') result.quickConfig = legacyConfig(parsed.value);
    else if (key === 'workoutProfiles') convertProfiles(parsed.value, result, problem);
    else if (key === 'workoutHistory') convertHistory(parsed.value, result, problem);
    else result.prefs[key] = parsed.value;
  }
  return result;
}

type Report = (key: LegacyKey, reason: string, value: unknown) => void;

function convertProfiles(value: unknown, result: LegacyImport, problem: Report) {
  if (!Array.isArray(value)) {
    problem('workoutProfiles', 'não é uma lista', value);
    return;
  }
  for (const item of value) {
    const profile = profileItem.safeParse(item);
    if (!profile.success) {
      problem('workoutProfiles', 'rotina sem id ou nome', item);
      continue;
    }
    const routine = intervalRoutine(
      {
        id: `legacy-${profile.data.id}`,
        name: shortName(profile.data.name),
        modality: CATEGORY[profile.data.category] ?? 'personalizada',
        origin: 'legacy',
        createdAt: 0,
      },
      legacyConfig(profile.data.config),
    );
    // Válida por construção: legacyConfig já trouxe cada número para dentro dos limites.
    result.routines.push(routine);
  }
}

function convertHistory(value: unknown, result: LegacyImport, problem: Report) {
  if (!Array.isArray(value)) {
    problem('workoutHistory', 'não é uma lista', value);
    return;
  }
  for (const item of value) {
    const entry = historyItem.safeParse(item);
    if (!entry.success) {
      problem('workoutHistory', 'treino sem id, data ou duração', item);
      continue;
    }
    const {
      id,
      timestamp,
      duration,
      presetName,
      presetCategory,
      config,
      completedRounds,
      wasInterrupted,
    } = entry.data;
    const routine = intervalRoutine(
      {
        id: `legacy-h-${id}`,
        name: shortName(presetName ?? '') || 'Treino rápido',
        modality: (presetCategory && CATEGORY[presetCategory]) || 'personalizada',
        origin: 'legacy',
        createdAt: timestamp,
      },
      legacyConfig(config),
    );
    const workTotal = summarize(buildTimeline(routine)).workCount;
    const activeMs = Math.round(duration * 1000);
    result.history.push({
      id: `legacy-${id}`,
      routine,
      status: wasInterrupted === true ? 'interrupted' : 'completed',
      startedAt: Math.max(0, timestamp - activeMs),
      endedAt: timestamp,
      activeMs,
      workDone: whole(completedRounds, wasInterrupted === true ? 0 : workTotal, 0, workTotal),
      workTotal,
      source: 'legacy',
    });
  }
}
