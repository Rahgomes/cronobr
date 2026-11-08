import type { SoundId, SoundSlot } from '@/domain/cues';

export const SOUND_LABEL: Record<SoundId, string> = {
  beepShort: 'Beep curto',
  beepLong: 'Beep longo',
  bell: 'Sino de ringue',
  gong: 'Gongo',
  whistle: 'Apito',
  finish: 'Conclusão',
};

export const SLOT_LABEL: Record<SoundSlot, string> = {
  prep: 'Preparação',
  work: 'Exercício',
  rest: 'Descanso',
  finish: 'Fim do treino',
};
