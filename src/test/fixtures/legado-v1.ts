// Dump realista das chaves do app antigo (v1), como o AsyncStorage guardava: texto JSON.
// Inclui sujeira de verdade: item sem id, número como texto, JSON quebrado em outra chave.
import type { LegacyRaw } from '@/domain/legacy';

const LEGADO_V1_HISTORY = [
  {
    id: 'h-1',
    timestamp: 1_760_000_000_000,
    date: '2025-10-09T08:53:20.000Z',
    duration: 240,
    type: 'preset',
    presetName: 'Tabata Clássico',
    presetCategory: 'TABATA',
    config: { prepTime: 10, exerciseTime: 20, restTime: 10, rounds: 8 },
    completedRounds: 8,
    totalRounds: 8,
    wasInterrupted: false,
  },
  {
    id: 'h-2',
    timestamp: 1_760_100_000_000,
    date: '2025-10-10T12:40:00.000Z',
    duration: 95,
    type: 'manual',
    config: { prepTime: 0, exerciseTime: 45, restTime: 0, rounds: 5 },
    completedRounds: 2,
    totalRounds: 5,
    wasInterrupted: true,
  },
  { date: 'sem id', duration: 10 },
];

export const LEGADO_V1: LegacyRaw = {
  settings: JSON.stringify({
    soundEnabled: true,
    vibrationEnabled: false,
    language: 'en',
    theme: 'dark',
  }),
  profile: JSON.stringify({ name: 'Ramon', avatarIndex: 3 }),
  timerConfig: JSON.stringify({ prepTime: 5, exerciseTime: '40', restTime: 20, rounds: 150 }),
  soundSettings: JSON.stringify({ countdownSound: 'beep1', volume: 80 }),
  appPreferences: '{"silentModeEnabled": true, ',
  workoutProfiles: JSON.stringify([
    {
      id: 'p-1',
      category: 'HIIT',
      name: 'Meu HIIT',
      description: '',
      config: { prepTime: 10, exerciseTime: 30, restTime: 15, rounds: 6 },
      isBuiltIn: false,
    },
    {
      id: 'p-2',
      category: 'YOGA',
      name: '  Alongar  ',
      description: '',
      config: { prepTime: -3, exerciseTime: 0, restTime: 0, rounds: 0 },
      isBuiltIn: false,
    },
    { category: 'EMOM', name: 'sem id' },
  ]),
  activeProfileId: 'tabata-classic',
  workoutHistory: JSON.stringify(LEGADO_V1_HISTORY),
  viewMode: null,
  speechSettings: JSON.stringify({ enabled: true, voiceLanguage: 'pt-BR' }),
};
