// Fotos dos cards de modalidade. Textos ficam em i18n/messages. Fotos geradas para o
// app (docs/imagens/README.md), sem marca nem texto, escuras embaixo para o título ler bem.
import type { Modality } from '@/domain/routine';

export interface ModalityInfo {
  photo: number | null;
}

export const MODALITY: Record<Modality, ModalityInfo> = {
  tabata: {
    photo: require('@assets/images/modalidades/tabata.jpg') as number,
  },
  hiit: {
    photo: require('@assets/images/modalidades/hiit.jpg') as number,
  },
  emom: {
    photo: require('@assets/images/modalidades/emom.jpg') as number,
  },
  amrap: {
    photo: require('@assets/images/modalidades/amrap.jpg') as number,
  },
  boxe: {
    photo: require('@assets/images/modalidades/boxe.jpg') as number,
  },
  circuito: {
    photo: require('@assets/images/modalidades/circuito.jpg') as number,
  },
  corrida: {
    photo: require('@assets/images/modalidades/corrida.jpg') as number,
  },
  mobilidade: {
    photo: require('@assets/images/modalidades/mobilidade.jpg') as number,
  },
  foco: {
    photo: require('@assets/images/modalidades/foco.jpg') as number,
  },
  tarefas: {
    photo: require('@assets/images/modalidades/tarefas.jpg') as number,
  },
  profissional: {
    photo: require('@assets/images/modalidades/profissional.jpg') as number,
  },
  personalizada: { photo: null },
  temporizador: { photo: null },
};
