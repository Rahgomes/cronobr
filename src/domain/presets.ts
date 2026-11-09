// Rotinas prontas. Os ids são os mesmos do app antigo para o histórico migrado apontar certo.
import {
  intervalRoutine,
  type IntervalConfig,
  type Modality,
  type Routine,
  type Step,
} from './routine';

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
  // EMOM de verdade (E04): uma rodada por minuto; terminou antes, o resto é descanso. Os ids
  // vêm do app antigo (histórico migrado), os nomes dizem o que o treino é agora.
  {
    id: 'emom-15s',
    name: 'EMOM 10 minutos',
    modality: 'emom',
    config: { prepSeconds: 10, workSeconds: 60, restSeconds: 0, rounds: 10, early: true },
  },
  {
    id: 'emom-30s',
    name: 'EMOM 20 minutos',
    modality: 'emom',
    config: { prepSeconds: 10, workSeconds: 60, restSeconds: 0, rounds: 20, early: true },
  },
  {
    id: 'emom-45s',
    name: 'A cada 2 minutos, 16 minutos',
    modality: 'emom',
    config: { prepSeconds: 10, workSeconds: 120, restSeconds: 0, rounds: 8, early: true },
  },
  // AMRAP: um tempo só, e a pessoa marca as rodadas que fez.
  {
    id: 'amrap-quick',
    name: 'AMRAP 10 minutos',
    modality: 'amrap',
    config: { prepSeconds: 10, workSeconds: 600, restSeconds: 0, rounds: 1 },
  },
  {
    id: 'amrap-intense',
    name: 'AMRAP 20 minutos',
    modality: 'amrap',
    config: { prepSeconds: 10, workSeconds: 1200, restSeconds: 0, rounds: 1 },
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
  {
    id: 'corrida-1-1',
    name: 'Corre 1, caminha 1',
    modality: 'corrida',
    config: {
      prepSeconds: 10,
      workSeconds: 60,
      restSeconds: 60,
      rounds: 10,
      workName: 'Corrida',
      restName: 'Caminhada',
    },
  },
  {
    id: 'corrida-iniciante',
    name: 'Começando a correr',
    modality: 'corrida',
    config: {
      prepSeconds: 10,
      workSeconds: 60,
      restSeconds: 120,
      rounds: 8,
      workName: 'Corrida',
      restName: 'Caminhada',
    },
  },
];

/** Mobilidade: etapas nomeadas, algumas para cada lado. Troca curta entre uma e outra. */
function mobility(id: string, name: string, moves: [string, number, boolean][]): Routine {
  const steps: Step[] = moves.flatMap(([move, seconds, sides], i) => [
    {
      id: `${id}-${String(i)}`,
      name: move,
      kind: 'work' as const,
      seconds,
      reps: null,
      ...(sides ? { sides: true } : {}),
    },
    { id: `${id}-${String(i)}-t`, name: 'Troca', kind: 'rest' as const, seconds: 5, reps: null },
  ]);
  return {
    id,
    name,
    modality: 'mobilidade',
    version: 1,
    origin: 'preset',
    prepSeconds: 10,
    blocks: [{ id: `${id}-b1`, name: 'Sequência', repeat: 1, steps, restAfterSeconds: 0 }],
    cooldownSeconds: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}

const MOBILITY: Routine[] = [
  mobility('mobilidade-manha', 'Soltar o corpo', [
    ['Pescoço', 30, false],
    ['Ombros em círculo', 30, false],
    ['Rotação de tronco', 30, true],
    ['Quadril', 40, true],
    ['Posterior de coxa', 40, true],
  ]),
  mobility('mobilidade-pos-treino', 'Alongamento pós-treino', [
    ['Peitoral na parede', 30, true],
    ['Quadríceps em pé', 30, true],
    ['Posterior de coxa', 40, true],
    ['Panturrilha', 30, true],
    ['Lombar deitado', 45, false],
  ]),
];

/** Etapa de modelo: nome, tipo e tempo (ou repetições), opcionalmente dos dois lados. */
type Move = [
  name: string,
  kind: 'work' | 'rest',
  seconds: number | null,
  reps?: number,
  sides?: boolean,
];

/** Modelo com etapas nomeadas num bloco só (E07 D: estudo, tarefas, sequência do profissional). */
function named(
  id: string,
  name: string,
  modality: Modality,
  block: { name: string; repeat: number; moves: Move[] },
): Routine {
  const steps: Step[] = block.moves.map(([move, kind, seconds, reps, sides], i) => ({
    id: `${id}-${String(i)}`,
    name: move,
    kind,
    seconds,
    reps: reps ?? null,
    ...(sides ? { sides: true } : {}),
  }));
  return {
    id,
    name,
    modality,
    version: 1,
    origin: 'preset',
    prepSeconds: 10,
    blocks: [
      { id: `${id}-b1`, name: block.name, repeat: block.repeat, steps, restAfterSeconds: 0 },
    ],
    cooldownSeconds: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}

const MIN = 60;

const EVERYDAY: Routine[] = [
  named('foco-pomodoro', 'Pomodoro 25/5', 'foco', {
    name: 'Ciclos',
    repeat: 4,
    moves: [
      ['Foco', 'work', 25 * MIN],
      ['Pausa', 'rest', 5 * MIN],
    ],
  }),
  named('foco-50-10', 'Estudo 50/10', 'foco', {
    name: 'Ciclos',
    repeat: 3,
    moves: [
      ['Foco', 'work', 50 * MIN],
      ['Pausa', 'rest', 10 * MIN],
    ],
  }),
  named('foco-revisao', 'Revisão rápida', 'foco', {
    name: 'Ciclos',
    repeat: 3,
    moves: [
      ['Leitura', 'work', 10 * MIN],
      ['Resumo', 'work', 5 * MIN],
      ['Pausa', 'rest', 2 * MIN],
    ],
  }),
  named('tarefas-arrumacao', 'Arrumação em 15 minutos', 'tarefas', {
    name: 'Cômodos',
    repeat: 1,
    moves: [
      ['Cozinha', 'work', 5 * MIN],
      ['Sala', 'work', 5 * MIN],
      ['Quarto', 'work', 5 * MIN],
    ],
  }),
  named('tarefas-blocos', 'Tarefas em blocos de 10', 'tarefas', {
    name: 'Blocos',
    repeat: 3,
    moves: [
      ['Tarefa', 'work', 10 * MIN],
      ['Pausa', 'rest', 2 * MIN],
    ],
  }),
  named('tarefas-manha', 'Rotina da manhã', 'tarefas', {
    name: 'Manhã',
    repeat: 1,
    moves: [
      ['Arrumar a cama', 'work', 2 * MIN],
      ['Alongar', 'work', 3 * MIN],
      ['Café da manhã', 'work', 10 * MIN],
      ['Planejar o dia', 'work', 5 * MIN],
    ],
  }),
  // Exemplo do formato que um profissional costuma passar; o principal é cadastrar a própria.
  named('profissional-exemplo', 'Exemplo: fortalecimento', 'profissional', {
    name: 'Sequência',
    repeat: 2,
    moves: [
      ['Ponte de glúteo', 'work', 30],
      ['Descanso', 'rest', 15],
      ['Prancha', 'work', 20],
      ['Descanso', 'rest', 15],
      ['Agachamento na parede', 'work', 30],
      ['Descanso', 'rest', 15],
      ['Elevação de panturrilha', 'work', null, 15],
      ['Descanso', 'rest', 15],
      ['Concha deitado', 'work', null, 12, true],
    ],
  }),
];

export const PRESETS: readonly Routine[] = [
  ...DEFS.map((def) =>
    intervalRoutine(
      { id: def.id, name: def.name, modality: def.modality, origin: 'preset', createdAt: 0 },
      def.config,
    ),
  ),
  ...MOBILITY,
  ...EVERYDAY,
];

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
