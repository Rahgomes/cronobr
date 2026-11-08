// Rotinas prontas. Os ids são os mesmos do app antigo para o histórico migrado apontar certo.
import { intervalRoutine, type IntervalConfig, type Modality, type Routine } from './routine';

interface PresetDef {
  id: string;
  name: string;
  modality: Modality;
  config: IntervalConfig;
}

const DEFS: PresetDef[] = [
  {
    id: 'tabata-classic',
    name: 'Tabata clássico',
    modality: 'tabata',
    config: { prepSeconds: 10, workSeconds: 20, restSeconds: 10, rounds: 8 },
  },
  {
    id: 'tabata-extended',
    name: 'Tabata estendido',
    modality: 'tabata',
    config: { prepSeconds: 10, workSeconds: 20, restSeconds: 10, rounds: 12 },
  },
  {
    id: 'hiit-sprint',
    name: 'HIIT sprint',
    modality: 'hiit',
    config: { prepSeconds: 15, workSeconds: 30, restSeconds: 30, rounds: 10 },
  },
  {
    id: 'hiit-power',
    name: 'HIIT power',
    modality: 'hiit',
    config: { prepSeconds: 15, workSeconds: 20, restSeconds: 40, rounds: 8 },
  },
  {
    id: 'emom-15s',
    name: 'EMOM 15 s',
    modality: 'emom',
    config: { prepSeconds: 10, workSeconds: 15, restSeconds: 45, rounds: 10 },
  },
  {
    id: 'emom-30s',
    name: 'EMOM 30 s',
    modality: 'emom',
    config: { prepSeconds: 10, workSeconds: 30, restSeconds: 30, rounds: 8 },
  },
  {
    id: 'emom-45s',
    name: 'EMOM 45 s',
    modality: 'emom',
    config: { prepSeconds: 10, workSeconds: 45, restSeconds: 15, rounds: 6 },
  },
  {
    id: 'amrap-quick',
    name: 'AMRAP rápido',
    modality: 'amrap',
    config: { prepSeconds: 10, workSeconds: 20, restSeconds: 10, rounds: 12 },
  },
  {
    id: 'amrap-intense',
    name: 'AMRAP intenso',
    modality: 'amrap',
    config: { prepSeconds: 10, workSeconds: 40, restSeconds: 20, rounds: 8 },
  },
  {
    id: 'boxe-beginner',
    name: 'Boxe iniciante',
    modality: 'boxe',
    config: { prepSeconds: 30, workSeconds: 120, restSeconds: 60, rounds: 3 },
  },
  {
    id: 'boxe-pro',
    name: 'Boxe avançado',
    modality: 'boxe',
    config: { prepSeconds: 30, workSeconds: 180, restSeconds: 60, rounds: 5 },
  },
  {
    id: 'circuit-fast',
    name: 'Circuito rápido',
    modality: 'circuito',
    config: { prepSeconds: 10, workSeconds: 45, restSeconds: 15, rounds: 6 },
  },
  {
    id: 'circuit-endurance',
    name: 'Circuito resistência',
    modality: 'circuito',
    config: { prepSeconds: 10, workSeconds: 60, restSeconds: 30, rounds: 8 },
  },
];

export const PRESETS: readonly Routine[] = DEFS.map((def) =>
  intervalRoutine(
    { id: def.id, name: def.name, modality: def.modality, origin: 'preset', createdAt: 0 },
    def.config,
  ),
);

export function presetById(id: string): Routine | undefined {
  return PRESETS.find((preset) => preset.id === id);
}

/** Modalidades que têm modelos prontos, na ordem em que aparecem na Início. */
export const PRESET_MODALITIES: readonly Modality[] = [
  ...new Set(PRESETS.map((preset) => preset.modality)),
];

export function presetsOf(modality: Modality): Routine[] {
  return PRESETS.filter((preset) => preset.modality === modality);
}
