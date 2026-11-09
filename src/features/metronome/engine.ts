import {
  fill,
  PREVIEW_BEATS,
  retime,
  startCursor,
  type Cursor,
  type Marked,
} from '@/domain/metronome';

/**
 * Relógio de áudio: a Web Audio do navegador ou o `react-native-audio-api` no aparelho (D97).
 * `click` marca um som para tocar em `at` (segundos do relógio de áudio) e devolve como
 * desmarcar, para parar ou trocar o BPM sem esperar a fila tocar.
 */
export interface AudioClock {
  readonly now: number;
  /** Atraso de saída que o próprio aparelho informa, em segundos (0 se não souber). */
  readonly outputLatency: number;
  click: (at: number) => () => void;
  resume: () => Promise<void>;
  close: () => void;
}

/**
 * Fila longa, laço lento: 1,5 s de batidas marcadas e o laço acorda a cada 250 ms. O navegador
 * em segundo plano segura o setTimeout em até 1 s e a fila ainda não seca; trocar o BPM ou parar
 * desmarca o que estava na fila, então a fila longa não atrasa a resposta (D102).
 */
export const HORIZON_S = 1.5;
export const REFILL_MS = 250;
/** Batidas guardadas para a medição de variação (as últimas). */
const MEASURE_MAX = 512;
/**
 * Áudio que ficou mais que isto para trás do relógio do aparelho num passo do laço está parado
 * (ligação no iPhone, saída trocada, fone desligado). Um passo normal difere em poucos ms.
 */
const LOST_MIN_S = 0.1;
/** Enquanto o áudio está parado, pede para retomar no máximo a cada tanto. */
const RESUME_EVERY_MS = 1000;

/** Relógio do aparelho que só anda para a frente (o civil pode pular). */
const wallNow = () => performance.now() / 1000;

export interface BeatEvent {
  index: number;
}

interface Pending {
  at: number;
  cancel: () => void;
  visual: ReturnType<typeof setTimeout>;
}

/**
 * Metrônomo andando: um laço curto só reabastece a fila (a precisão é do relógio de áudio, não do
 * setTimeout). O pulso visual sai por setTimeout na hora da batida mais o atraso do fone: errar
 * alguns ms ali não muda o som.
 */
export class Metronome {
  private cursor: Cursor | null = null;
  private pending: Pending[] = [];
  private loop: ReturnType<typeof setTimeout> | null = null;
  private lastAt: number | null = null;
  private limit = Infinity;
  private origin = 0;
  private muted: (sinceStartMs: number) => boolean = () => false;
  /** Segundos em que o áudio ficou parado desde o começo (somam no "desde o começo"). */
  private lostS = 0;
  private lastAudio = 0;
  private lastWall = 0;
  private lastResume = -Infinity;
  private bpm = 90;
  private offsetMs = 0;
  readonly marked: Marked[] = [];
  missed = 0;

  constructor(
    private readonly clock: AudioClock,
    private readonly onBeat: (beat: BeatEvent) => void,
    private readonly onEnd: () => void,
  ) {}

  get running() {
    return this.cursor !== null;
  }

  /**
   * `muted` cala o som de uma batida (a tela ainda pulsa), pelo tempo desde o começo: é como o
   * treino dá a vez para a voz e a contagem (E07 C).
   */
  start(
    bpm: number,
    offsetMs: number,
    options: { preview?: boolean; muted?: (sinceStartMs: number) => boolean } = {},
  ) {
    const preview = options.preview === true;
    this.muted = options.muted ?? (() => false);
    this.stop();
    this.bpm = bpm;
    this.offsetMs = offsetMs;
    this.limit = preview ? PREVIEW_BEATS : Infinity;
    this.lastAt = null;
    this.marked.length = 0;
    this.missed = 0;
    this.origin = this.clock.now;
    this.lostS = 0;
    this.lastAudio = this.origin;
    this.lastWall = wallNow();
    this.cursor = startCursor(this.origin);
    this.refill();
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
    const cursor = this.cursor;
    if (!cursor) return;
    const now = this.clock.now;
    // O que ainda não tocou sai da fila; a próxima vem no passo novo.
    const kept = this.pending.filter((p) => p.at <= now);
    const dropped = this.pending.filter((p) => p.at > now);
    dropped.forEach(unmark);
    this.pending = kept;
    this.lastAt = kept.at(-1)?.at ?? this.lastAt;
    this.cursor = retime(this.lastAt, cursor.index - dropped.length, now, bpm);
    this.refill();
  }

  setOffset(offsetMs: number) {
    this.offsetMs = offsetMs;
  }

  stop() {
    if (this.loop !== null) clearTimeout(this.loop);
    this.loop = null;
    this.pending.forEach(unmark);
    this.pending = [];
    this.cursor = null;
  }

  private refill() {
    const cursor = this.cursor;
    if (!cursor) return;
    const now = this.clock.now;
    this.pending = this.pending.filter((p) => {
      if (p.at > now) return true;
      this.lastAt = p.at;
      return false;
    });
    if (this.audioStopped(now)) {
      this.schedule();
      return;
    }
    const {
      beats,
      cursor: next,
      missed,
    } = fill(this.cursor ?? cursor, now, HORIZON_S, this.bpm, this.limit);
    this.missed += missed;
    this.cursor = next;
    const latency = this.clock.outputLatency * 1000 + this.offsetMs;
    for (const beat of beats) {
      const cancel = this.muted((beat.at - this.origin + this.lostS) * 1000)
        ? () => undefined
        : this.clock.click(beat.at);
      const visual = setTimeout(
        () => {
          this.onBeat({ index: beat.index });
        },
        Math.max(0, (beat.at - now) * 1000 + latency),
      );
      this.pending.push({ at: beat.at, cancel, visual });
      this.marked.push({ at: beat.at, markedAt: now });
    }
    if (this.marked.length > MEASURE_MAX) this.marked.splice(0, this.marked.length - MEASURE_MAX);
    if (this.loop !== null) clearTimeout(this.loop);
    if (next.index >= this.limit) {
      // Prévia: depois da última batida (e do pulso dela), acaba sozinha.
      const lastBeat = beats.at(-1)?.at ?? now;
      this.loop = setTimeout(
        () => {
          this.loop = null;
          this.pending = [];
          this.cursor = null;
          this.onEnd();
        },
        (lastBeat - now) * 1000 + latency + 200,
      );
      return;
    }
    this.schedule();
  }

  private schedule() {
    this.loop = setTimeout(() => {
      this.loop = null;
      this.refill();
    }, REFILL_MS);
  }

  /**
   * Áudio parado enquanto o aparelho seguiu: o que estava na fila tocaria atrasado (em cima da
   * contagem final, por exemplo), então sai; a conta "desde o começo" soma o tempo perdido; e
   * pede para retomar, porque no iPhone o áudio interrompido por ligação não volta sozinho.
   * Devolve true enquanto continua parado (nada novo entra na fila).
   */
  private audioStopped(now: number): boolean {
    const wall = wallNow();
    const behind = wall - this.lastWall - (now - this.lastAudio);
    const frozen = now === this.lastAudio;
    this.lastAudio = now;
    this.lastWall = wall;
    if (behind <= LOST_MIN_S) return false;
    this.lostS += behind;
    const dropped = this.pending.filter((p) => p.at > now);
    dropped.forEach(unmark);
    this.pending = this.pending.filter((p) => p.at <= now);
    const cursor = this.cursor;
    if (cursor) this.cursor = retime(this.lastAt, cursor.index - dropped.length, now, this.bpm);
    if (!frozen) return false;
    if (wall * 1000 - this.lastResume >= RESUME_EVERY_MS) {
      this.lastResume = wall * 1000;
      this.clock.resume().catch(() => undefined);
    }
    return true;
  }
}

function unmark(p: Pending) {
  p.cancel();
  clearTimeout(p.visual);
}
