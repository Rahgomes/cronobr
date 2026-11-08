// Como cada modalidade aparece: nome, uma linha do que é e a foto do card. Fotos geradas para o
// app (docs/imagens/README.md), sem marca nem texto, escuras embaixo para o título ler bem.
import type { Modality } from '@/domain/routine';

export interface ModalityInfo {
  label: string;
  tagline: string;
  photo: number | null;
}

export const MODALITY: Record<Modality, ModalityInfo> = {
  tabata: {
    label: 'Tabata',
    tagline: '20 s forte, 10 s leve',
    photo: require('@assets/images/modalidades/tabata.jpg') as number,
  },
  hiit: {
    label: 'HIIT',
    tagline: 'Tiros fortes com recuperação',
    photo: require('@assets/images/modalidades/hiit.jpg') as number,
  },
  emom: {
    label: 'EMOM',
    tagline: 'Uma rodada por minuto; terminou antes, descansa',
    photo: require('@assets/images/modalidades/emom.jpg') as number,
  },
  amrap: {
    label: 'AMRAP',
    tagline: 'Máximo de rodadas no tempo; você marca cada uma',
    photo: require('@assets/images/modalidades/amrap.jpg') as number,
  },
  boxe: {
    label: 'Boxe',
    tagline: 'Rounds com descanso',
    photo: require('@assets/images/modalidades/boxe.jpg') as number,
  },
  circuito: {
    label: 'Circuito',
    tagline: 'Estações em sequência',
    photo: require('@assets/images/modalidades/circuito.jpg') as number,
  },
  corrida: {
    label: 'Corrida',
    tagline: 'Correr e caminhar alternado',
    photo: require('@assets/images/modalidades/corrida.jpg') as number,
  },
  mobilidade: {
    label: 'Mobilidade',
    tagline: 'Alongar e soltar, lado a lado',
    photo: require('@assets/images/modalidades/mobilidade.jpg') as number,
  },
  personalizada: { label: 'Personalizada', tagline: 'Do seu jeito', photo: null },
  temporizador: { label: 'Temporizador', tagline: 'Contagem regressiva', photo: null },
};
