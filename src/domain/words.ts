// Textos que o domínio monta (voz, notificação, limites, arquivo, nomes padrão). O domínio não
// escolhe língua: quem chama passa as palavras da língua em uso (src/i18n, seção `words`).
import type { Phase } from './timeline';

/** Assunto de uma mensagem de limite, já com o artigo certo da língua ("o tempo da etapa"). */
export interface LimitSubjects {
  stepName: string;
  blockName: string;
  routineName: string;
  stepTime: string;
  blockRest: string;
  prep: string;
  cooldown: string;
}

export interface LimitWords {
  subject: LimitSubjects;
  nameEmpty: (subject: string) => string;
  nameLong: (subject: string, max: number) => string;
  required: (subject: string) => string;
  wholeSeconds: (subject: string) => string;
  negative: (subject: string) => string;
  atLeast: (subject: string, seconds: number) => string;
  atMost: (subject: string, limit: string) => string;
  repsWhole: string;
  repsMin: string;
  repsMax: (max: number) => string;
  repsNeeded: string;
  restNeedsTime: string;
  roundsWhole: string;
  roundsMin: string;
  roundsMax: (max: number) => string;
  stepsMin: string;
  stepsMax: (max: number) => string;
  activeWork: string;
  blocksMin: string;
  blocksMax: (max: number) => string;
  segments: (count: number, max: number) => string;
  total: (limit: string) => string;
  hours: (n: number) => string;
  minutes: (n: number) => string;
}

export interface FileWords {
  tooBig: (megabytes: number) => string;
  notJson: string;
  headerBroken: string;
  notCronobr: string;
  newer: (appVersion: string) => string;
  older: string;
  routineInvalid: string;
  routineLimits: string;
  backupInvalid: string;
  backupLimits: string;
  duplicates: string;
  duplicate: (name: string) => string;
}

export interface Words {
  phase: Record<Phase, string>;
  side: { left: string; right: string };
  /** "Rotação de tronco, lado esquerdo". */
  withSide: (name: string, side: string) => string;
  /** Voz: "1 minuto e 30 segundos". */
  spokenMinutes: (n: number) => string;
  spokenSeconds: (n: number) => string;
  spokenAnd: string;
  go: string;
  reps: (n: number) => string;
  lastRound: string;
  prepare: string;
  next: (label: string, name: string) => string;
  completed: string;
  halfway: string;
  round: (round: number, rounds: number) => string;
  today: string;
  yesterday: string;
  daysAgo: (n: number) => string;
  weeksAgo: (n: number) => string;
  monthsAgo: (n: number) => string;
  /** Nomes que o app dá ao criar (depois são da pessoa e não mudam com a língua). */
  newWork: string;
  newRest: string;
  newBlock: (n: number) => string;
  copySuffix: string;
  interval: (work: string, rest: string, rounds: number) => string;
  timer: (time: string) => string;
  timerStep: string;
  limits: LimitWords;
  file: FileWords;
}
