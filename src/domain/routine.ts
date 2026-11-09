// Modelo de rotina: o que o usuário monta e o que vai para o histórico como cópia.
// Tempo em segundos inteiros aqui (é o que a pessoa digita); a linha do tempo converte para ms.

export const MODALITIES = [
  'tabata',
  'hiit',
  'emom',
  'amrap',
  'boxe',
  'circuito',
  'corrida',
  'mobilidade',
  'personalizada',
  'temporizador',
  // E07 D: rotinas do dia a dia e a sequência recebida de um profissional.
  'foco',
  'tarefas',
  'profissional',
] as const;
export type Modality = (typeof MODALITIES)[number];

export type StepKind = 'work' | 'rest';

export interface Step {
  id: string;
  name: string;
  kind: StepKind;
  /** null = etapa por repetições: só avança quando a pessoa toca em "Concluí". */
  seconds: number | null;
  /** Meta de repetições, mostrada na tela. Obrigatória quando `seconds` é null. */
  reps: number | null;
  /** Desativada sem apagar (E04): fica no editor, fora da execução e da prévia. */
  disabled?: boolean | undefined;
  /** Mobilidade: roda duas vezes, lado esquerdo e lado direito. */
  sides?: boolean | undefined;
  /**
   * EMOM: dá para tocar em "Terminei" antes do fim; o resto do tempo vira descanso e a próxima
   * rodada começa na hora certa (o relógio não muda).
   */
  early?: boolean | undefined;
  /** Cadência (E07 C): pulso do metrônomo, em BPM, enquanto a etapa roda. Sem campo = sem pulso. */
  bpm?: number | undefined;
}

export interface Block {
  id: string;
  name: string;
  /** Quantas vezes as etapas do bloco se repetem (rodadas). */
  repeat: number;
  steps: Step[];
  /** Descanso depois do bloco, antes do próximo. Ignorado no último bloco. */
  restAfterSeconds: number;
}

export type RoutineOrigin = 'preset' | 'custom' | 'legacy';

export interface Routine {
  id: string;
  name: string;
  modality: Modality;
  /** Sobe a cada edição salva; o histórico guarda a versão que rodou. */
  version: number;
  origin: RoutineOrigin;
  prepSeconds: number;
  blocks: Block[];
  cooldownSeconds: number;
  createdAt: number;
  updatedAt: number;
}

export interface IntervalConfig {
  prepSeconds: number;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  /** Nomes próprios (corrida e caminhada); sem eles, "Exercício" e "Descanso". */
  workName?: string;
  restName?: string;
  /** EMOM: o exercício pode terminar antes e o resto vira descanso. */
  early?: boolean;
}

/**
 * Rotina de intervalo simples (o formato do app antigo): um bloco com trabalho e descanso.
 * Duração zero some: descanso 0 vira bloco só de trabalho; preparação 0 não entra.
 */
export function intervalRoutine(
  base: Pick<Routine, 'id' | 'name' | 'modality' | 'origin' | 'createdAt'>,
  config: IntervalConfig,
): Routine {
  const steps: Step[] = [
    {
      id: `${base.id}-work`,
      name: config.workName ?? 'Exercício',
      kind: 'work',
      seconds: config.workSeconds,
      reps: null,
      ...(config.early ? { early: true } : {}),
    },
  ];
  if (config.restSeconds > 0) {
    steps.push({
      id: `${base.id}-rest`,
      name: config.restName ?? 'Descanso',
      kind: 'rest',
      seconds: config.restSeconds,
      reps: null,
    });
  }
  return {
    ...base,
    version: 1,
    prepSeconds: config.prepSeconds,
    cooldownSeconds: 0,
    updatedAt: base.createdAt,
    blocks: [
      { id: `${base.id}-b1`, name: 'Rodadas', repeat: config.rounds, steps, restAfterSeconds: 0 },
    ],
  };
}
