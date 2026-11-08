// Modelos prontos na língua em uso. A cópia de um modelo leva os nomes da língua de quando foi
// copiada: dali em diante é da pessoa e não muda mais.
import { useMemo } from 'react';

import type { Language } from '@/domain/appearance';
import { PRESET_MODALITIES, PRESETS } from '@/domain/presets';
import type { Modality, Routine } from '@/domain/routine';
import { useLanguage } from '@/i18n/i18n-context';
import { PRESET_TEXT } from '@/i18n/presets';

export function localizePreset(routine: Routine, language: Language): Routine {
  if (language === 'pt-BR') return routine;
  const table = PRESET_TEXT[language];
  const tr = (text: string) => table[text] ?? text;
  return {
    ...routine,
    name: tr(routine.name),
    blocks: routine.blocks.map((block) => ({
      ...block,
      name: tr(block.name),
      steps: block.steps.map((step) => ({ ...step, name: tr(step.name) })),
    })),
  };
}

export interface PresetLibrary {
  all: readonly Routine[];
  byId: (id: string) => Routine | undefined;
  of: (modality: Modality) => Routine[];
  modalities: readonly Modality[];
}

export function presetLibrary(language: Language): PresetLibrary {
  const all = PRESETS.map((preset) => localizePreset(preset, language));
  return {
    all,
    byId: (id) => all.find((preset) => preset.id === id),
    of: (modality) => all.filter((preset) => preset.modality === modality),
    modalities: PRESET_MODALITIES,
  };
}

export function usePresets(): PresetLibrary {
  const language = useLanguage();
  return useMemo(() => presetLibrary(language), [language]);
}
