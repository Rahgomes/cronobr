import { must } from '@/test/domain';
import { LEGADO_V1 } from '@/test/fixtures/legado-v1';

import { convertLegacy, LEGACY_DEFAULT_CONFIG, legacyConfig } from './legacy';
import { checkRoutine } from './limits';
import { buildTimeline, summarize } from './timeline';

describe('migração dos dados antigos [PRD 9]', () => {
  const result = convertLegacy(LEGADO_V1);

  it('rotinas próprias viram rotinas válidas; o que não tem id fica guardado como problema', () => {
    expect(result.routines.map((r) => [r.id, r.name, r.modality, r.origin])).toEqual([
      ['legacy-p-1', 'Meu HIIT', 'hiit', 'legacy'],
      ['legacy-p-2', 'Alongar', 'personalizada', 'legacy'],
    ]);
    for (const routine of result.routines) expect(checkRoutine(routine).ok).toBe(true);
    // Valores absurdos foram trazidos para dentro dos limites, sem descanso de 0 s.
    expect(summarize(buildTimeline(must(result.routines[1])))).toMatchObject({
      knownMs: 1000,
      segments: 1,
    });
  });

  it('histórico: tudo entra, com a configuração executada e o status certo', () => {
    expect(result.history).toHaveLength(2);
    expect(result.history[0]).toMatchObject({
      id: 'legacy-h-1',
      status: 'completed',
      startedAt: 1_760_000_000_000 - 240_000,
      endedAt: 1_760_000_000_000,
      activeMs: 240_000,
      workDone: 8,
      workTotal: 8,
      source: 'legacy',
      routine: { name: 'Tabata Clássico', modality: 'tabata', prepSeconds: 10 },
    });
    expect(result.history[1]).toMatchObject({
      status: 'interrupted',
      workDone: 2,
      workTotal: 5,
      routine: { name: 'Treino rápido', modality: 'personalizada', prepSeconds: 0 },
    });
  });

  it('nada some: item quebrado e chave ilegível voltam com o texto original', () => {
    expect(result.problems.map((p) => [p.key, p.reason])).toEqual([
      ['appPreferences', 'JSON ilegível'],
      ['workoutProfiles', 'rotina sem id ou nome'],
      ['workoutHistory', 'treino sem id, data ou duração'],
    ]);
    expect(result.problems[0]?.raw).toBe(LEGADO_V1.appPreferences);
    expect(JSON.parse(result.problems[1]?.raw ?? '')).toEqual({ category: 'EMOM', name: 'sem id' });
  });

  it('configuração rápida e preferências chegam', () => {
    expect(result.quickConfig).toEqual({
      prepSeconds: 5,
      workSeconds: 30,
      restSeconds: 20,
      rounds: 99,
    });
    expect(result.prefs).toEqual({
      settings: { soundEnabled: true, vibrationEnabled: false, language: 'en', theme: 'dark' },
      profile: { name: 'Ramon', avatarIndex: 3 },
      soundSettings: { countdownSound: 'beep1', volume: 80 },
      activeProfileId: 'tabata-classic',
      speechSettings: { enabled: true, voiceLanguage: 'pt-BR' },
    });
  });

  it('aparelho sem nada gravado: importação vazia', () => {
    expect(convertLegacy({})).toEqual({
      routines: [],
      history: [],
      quickConfig: null,
      prefs: {},
      problems: [],
    });
  });

  it('formato inesperado: lista que não é lista e texto JSON em chave de texto', () => {
    const odd = convertLegacy({
      workoutProfiles: '{"a":1}',
      workoutHistory: '42',
      viewMode: '"grid"',
    });
    expect(odd.problems.map((p) => [p.key, p.reason, p.raw])).toEqual([
      ['workoutProfiles', 'não é uma lista', '{"a":1}'],
      ['workoutHistory', 'não é uma lista', '42'],
    ]);
    expect(odd.prefs).toEqual({ viewMode: 'grid' });
  });

  it('configuração: tipo errado vira o padrão antigo; fração arredonda', () => {
    expect(legacyConfig(null)).toEqual(LEGACY_DEFAULT_CONFIG);
    expect(
      legacyConfig({ prepTime: 4.6, exerciseTime: Infinity, restTime: 'x', rounds: 2 }),
    ).toEqual({
      prepSeconds: 5,
      workSeconds: 30,
      restSeconds: 15,
      rounds: 2,
    });
  });

  it('histórico interrompido sem rodadas registradas conta zero', () => {
    const one = convertLegacy({
      workoutHistory: JSON.stringify([
        { id: 'x', timestamp: 1000, duration: 5, wasInterrupted: true, presetCategory: 'NOVA' },
      ]),
    });
    expect(one.history[0]).toMatchObject({
      workDone: 0,
      startedAt: 0,
      routine: { modality: 'personalizada' },
    });
  });
});
