// Metrônomo (E07 B), parte pura. As batidas são marcadas no relógio de áudio (segundos, como o
// `currentTime` da Web Audio); quem chama só reabastece a fila antes de ela acabar (D97). Nada
// aqui lê relógio: o "agora" chega de fora, então dá para provar a fila sem tocar som.

export const BPM_MIN = 30;
export const BPM_MAX = 240;
/** Atraso do fone (Bluetooth costuma ficar entre 150 e 300 ms): o pulso na tela espera isso. */
export const OFFSET_MAX_MS = 400;
export const OFFSET_STEP_MS = 20;
export const PREVIEW_BEATS = 4;
/** Primeira batida um pouco à frente: o áudio precisa de tempo para montar o som. */
export const LEAD_S = 0.06;

export interface MetronomePrefs {
  bpm: number;
  offsetMs: number;
}

export const METRONOME_START: MetronomePrefs = { bpm: 90, offsetMs: 0 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const clampBpm = (bpm: number) => clamp(Math.round(bpm), BPM_MIN, BPM_MAX);

export const beatSeconds = (bpm: number) => 60 / clampBpm(bpm);

/** Leitura tolerante do gravado: campo estranho volta ao padrão, número fora da faixa é preso. */
export function parseMetronome(raw: unknown): MetronomePrefs {
  const value = (raw ?? {}) as Partial<Record<keyof MetronomePrefs, unknown>>;
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
  const bpm = num(value.bpm);
  const offset = num(value.offsetMs);
  return {
    bpm: bpm === null ? METRONOME_START.bpm : clampBpm(bpm),
    offsetMs:
      offset === null
        ? METRONOME_START.offsetMs
        : clamp(Math.round(offset / OFFSET_STEP_MS) * OFFSET_STEP_MS, 0, OFFSET_MAX_MS),
  };
}

/** Próxima batida a marcar: quando (relógio de áudio) e qual (0, 1, 2...). */
export interface Cursor {
  at: number;
  index: number;
}

export interface Beat {
  at: number;
  index: number;
}

export const startCursor = (now: number): Cursor => ({ at: now + LEAD_S, index: 0 });

/**
 * Marca as batidas que caem antes de `now + horizon`. Se o laço voltou tarde e a próxima batida
 * já passou, ela não sai atrasada nem em rajada: o compasso pula para a primeira batida que
 * ainda dá tempo de marcar, no mesmo passo (`missed` conta as puladas, para a medição).
 * `limit` encerra a prévia depois de tantas batidas.
 */
export function fill(
  cursor: Cursor,
  now: number,
  horizon: number,
  bpm: number,
  limit = Infinity,
): { beats: Beat[]; cursor: Cursor; missed: number } {
  const step = beatSeconds(bpm);
  let { at, index } = cursor;
  let missed = 0;
  if (at < now) {
    missed = Math.ceil((now - at) / step);
    at += missed * step;
    index += missed;
  }
  const beats: Beat[] = [];
  while (at < now + horizon && index < limit) {
    beats.push({ at, index });
    at += step;
    index += 1;
  }
  return { beats, cursor: { at, index }, missed };
}

/**
 * Troca de BPM com o metrônomo andando: as batidas já marcadas e ainda não tocadas são
 * desmarcadas por quem chama; a próxima vem um passo novo depois da última que tocou (ou já, se
 * isso ficou para trás).
 */
export function retime(lastAt: number | null, nextIndex: number, now: number, bpm: number): Cursor {
  const soonest = now + LEAD_S;
  const at = lastAt === null ? soonest : Math.max(lastAt + beatSeconds(bpm), soonest);
  return { at, index: nextIndex };
}

/** Uma batida como ficou marcada: quando toca e qual era o relógio de áudio ao marcar. */
export interface Marked {
  at: number;
  markedAt: number;
}

export interface Jitter {
  beats: number;
  /** Maior distância entre um intervalo marcado e o intervalo do BPM, em ms. */
  maxDeviationMs: number;
  /** Menor folga entre marcar e tocar, em ms: negativo seria batida marcada atrasada. */
  minSlackMs: number;
  late: number;
}

/**
 * Variação entre batidas (o PRD pede medir): intervalos marcados contra o passo do BPM e a
 * folga com que cada batida foi marcada. Folga sempre positiva = a fila nunca secou.
 */
export function measureJitter(marked: readonly Marked[], bpm: number): Jitter {
  const step = beatSeconds(bpm);
  let maxDeviation = 0;
  let minSlack = Infinity;
  let late = 0;
  marked.forEach((beat, i) => {
    const slack = beat.at - beat.markedAt;
    minSlack = Math.min(minSlack, slack);
    if (slack < 0) late += 1;
    const previous = marked[i - 1];
    if (previous) maxDeviation = Math.max(maxDeviation, Math.abs(beat.at - previous.at - step));
  });
  const ms = (s: number) => Math.round(s * 1e6) / 1e3;
  return {
    beats: marked.length,
    maxDeviationMs: ms(maxDeviation),
    minSlackMs: marked.length === 0 ? 0 : ms(minSlack),
    late,
  };
}
