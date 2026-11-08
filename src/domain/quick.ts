// Início rápido (E04, C01b): temporizador e intervalado sem passar pelo editor. A rotina viaja
// pela rota (parâmetros curtos) e não suja "Suas rotinas"; o histórico guarda a rotina inteira,
// então "Repetir" funciona igual. Tudo passa pelos mesmos limites do editor.
import { clock } from './format';
import { checkRoutine } from './limits';
import { intervalRoutine, type IntervalConfig, type Routine } from './routine';

export type QuickSetup =
  | { kind: 'temporizador'; seconds: number; name: string }
  | ({ kind: 'intervalo' } & IntervalConfig);

export const DEFAULT_TIMER = { kind: 'temporizador', seconds: 5 * 60, name: '' } as const;
export const DEFAULT_INTERVAL = {
  kind: 'intervalo',
  prepSeconds: 10,
  workSeconds: 30,
  restSeconds: 15,
  rounds: 8,
} as const;

/** Rotina pronta para o motor, ou a primeira mensagem de limite em português. */
export function quickRoutine(
  setup: QuickSetup,
): { ok: true; routine: Routine } | { ok: false; message: string } {
  const routine =
    setup.kind === 'temporizador'
      ? timerRoutine(setup.seconds, setup.name.trim())
      : intervalRoutine(
          {
            // Id pela configuração: cada combinação vira um card próprio em Recentes.
            id: `rapido-i-${[setup.prepSeconds, setup.workSeconds, setup.restSeconds, setup.rounds].join('-')}`,
            name: `Intervalado ${clock(setup.workSeconds * 1000)}/${clock(setup.restSeconds * 1000)} × ${String(setup.rounds)}`,
            modality: 'personalizada',
            origin: 'custom',
            createdAt: 0,
          },
          setup,
        );
  const check = checkRoutine(routine);
  return check.ok
    ? { ok: true, routine: check.routine }
    : { ok: false, message: check.issues.map((issue) => issue.message).join(' ') };
}

function timerRoutine(seconds: number, name: string): Routine {
  const routine = intervalRoutine(
    {
      id: `rapido-t-${String(seconds)}`,
      name: name || `Temporizador ${clock(seconds * 1000)}`,
      modality: 'temporizador',
      origin: 'custom',
      createdAt: 0,
    },
    { prepSeconds: 0, workSeconds: seconds, restSeconds: 0, rounds: 1 },
  );
  return {
    ...routine,
    blocks: routine.blocks.map((b) => ({
      ...b,
      steps: b.steps.map((step) => ({ ...step, name: 'Tempo' })),
    })),
  };
}

/** Parâmetros da rota `/sessao` (só texto). */
export function quickParams(setup: QuickSetup): Record<string, string> {
  if (setup.kind === 'temporizador') {
    const params: Record<string, string> = { rapido: 't', s: String(setup.seconds) };
    if (setup.name.trim()) params.nome = setup.name.trim();
    return params;
  }
  return {
    rapido: 'i',
    p: String(setup.prepSeconds),
    t: String(setup.workSeconds),
    d: String(setup.restSeconds),
    r: String(setup.rounds),
  };
}

const int = (value: string | undefined) =>
  value !== undefined && /^\d{1,6}$/.test(value) ? Number(value) : null;

/** Lê os parâmetros de volta. Faltou ou não é número: não é rotina rápida. */
export function parseQuick(params: Record<string, string | undefined>): QuickSetup | null {
  if (params.rapido === 't') {
    const seconds = int(params.s);
    return seconds === null ? null : { kind: 'temporizador', seconds, name: params.nome ?? '' };
  }
  if (params.rapido === 'i') {
    const [prepSeconds, workSeconds, restSeconds, rounds] = [
      params.p,
      params.t,
      params.d,
      params.r,
    ].map(int);
    if (prepSeconds == null || workSeconds == null || restSeconds == null || rounds == null)
      return null;
    return { kind: 'intervalo', prepSeconds, workSeconds, restSeconds, rounds };
  }
  return null;
}
