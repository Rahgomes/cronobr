// Sequência recebida do profissional (E07 D): a pessoa cola a lista como recebeu ("Ponte 30s",
// "Agachamento 3x12", "Descanso 20s") e o app monta a rotina. Puro e tolerante: aceita o jeito
// comum de escrever nas 4 línguas, e o que não entender volta com o número da linha.
import type { Block, Routine, Step } from './routine';

export const SEQUENCE_SETS_MAX = 20;
/** Linha maior que isto não é lida (e as regex nunca recebem texto longo). */
export const LINE_MAX = 200;

export interface SequenceItem {
  name: string;
  kind: 'work' | 'rest';
  seconds: number | null;
  reps: number | null;
  sides: boolean;
  /** Séries: "3x12" vira três etapas iguais. */
  sets: number;
}

export type SequenceIssueKind = 'noAmount' | 'restNeedsTime' | 'tooManySets' | 'tooLong';

export interface SequenceIssue {
  /** Linha como a pessoa vê (1, 2, 3...). */
  line: number;
  kind: SequenceIssueKind;
  text: string;
}

/** Sem acento e em minúsculas, só para reconhecer palavras ("repetições" = "repeticoes"). */
const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const n = (m: RegExpMatchArray, i: number) => Number(m[i] ?? 0);

// Quantidade no fim da linha (no texto sem acento). Unidades: segundos (s, seg, sec, seconde, "),
// minutos (m, min, minute, '), repetições (rep, repeticoes, repeticiones, repetitions, x).
// Ordem importa: o mais específico primeiro.
const PATTERNS: { re: RegExp; read: (m: RegExpMatchArray) => Amount }[] = [
  // 3x1min, 3 x 1min30s
  {
    // eslint-disable-next-line security/detect-unsafe-regex -- linha de até LINE_MAX caracteres
    re: /(\d+)\s*[x×]\s*(\d+)\s*(?:m|min|mins|minutos?|minutes?|')\s*(?:(\d+)\s*(?:s|seg|segs|segundos?|secs?|seconds?|secondes?|"))?$/,
    read: (m) => ({ sets: n(m, 1), seconds: n(m, 2) * 60 + n(m, 3), reps: null }),
  },
  // 3x30s
  {
    re: /(\d+)\s*[x×]\s*(\d+)\s*(?:s|seg|segs|segundos?|secs?|seconds?|secondes?|")$/,
    read: (m) => ({ sets: n(m, 1), seconds: n(m, 2), reps: null }),
  },
  // 3x12, 3 x 12 reps
  {
    // eslint-disable-next-line security/detect-unsafe-regex -- linha de até LINE_MAX caracteres
    re: /(\d+)\s*[x×]\s*(\d+)(?:\s*(?:reps?|repeticoes|repeticiones|repetitions?))?$/,
    read: (m) => ({ sets: n(m, 1), seconds: null, reps: n(m, 2) }),
  },
  // 1:30
  {
    re: /(\d+):([0-5]\d)$/,
    read: (m) => ({ sets: 1, seconds: n(m, 1) * 60 + n(m, 2), reps: null }),
  },
  // 1min30s, 2 min, 1m30
  {
    // eslint-disable-next-line security/detect-unsafe-regex -- linha de até LINE_MAX caracteres
    re: /(\d+)\s*(?:m|min|mins|minutos?|minutes?|')\s*(?:(\d+)\s*(?:s|seg|segs|segundos?|secs?|seconds?|secondes?|")?)?$/,
    read: (m) => ({ sets: 1, seconds: n(m, 1) * 60 + n(m, 2), reps: null }),
  },
  // 30s, 45 seg, 20"
  {
    re: /(\d+)\s*(?:s|seg|segs|segundos?|secs?|seconds?|secondes?|")$/,
    read: (m) => ({ sets: 1, seconds: n(m, 1), reps: null }),
  },
  // 12 reps, 12x, x12
  {
    re: /(?:(\d+)\s*(?:reps?|repeticoes|repeticiones|repetitions?|x|×)|[x×]\s*(\d+))$/,
    read: (m) => ({ sets: 1, seconds: null, reps: m[1] === undefined ? n(m, 2) : n(m, 1) }),
  },
];

interface Amount {
  sets: number;
  seconds: number | null;
  reps: number | null;
}

const SIDES =
  /\b(?:de cada lado|cada lado|por lado|each side|per side|chaque cote|de chaque cote)\b/;
const REST =
  /^(?:descanso|descansar|pausa|intervalo|recuperacao|recuperacion|rest|break|recovery|repos|pause|recuperation)\b/;
const BULLET = /^\s*(?:[-*•·]|\d+\s*[.)-])\s*/;
const TRAILING = /[\s\-–—:,;|(]+$/;

/** Lê a lista colada. Linhas vazias não contam; cada problema traz a linha original. */
export function parseSequence(text: string): { items: SequenceItem[]; issues: SequenceIssue[] } {
  const items: SequenceItem[] = [];
  const issues: SequenceIssue[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    // NFC e espaços juntados: a versão sem acento fica com o mesmo comprimento (um caractere
    // acentuado vira um sem acento), então a posição achada nela vale no original.
    let line = raw.replace(BULLET, '').normalize('NFC').replace(/\s+/g, ' ').trim();
    if (line === '') return;
    const original = line;
    if (line.length > LINE_MAX) {
      issues.push({ line: index + 1, kind: 'tooLong', text: `${line.slice(0, 40)}…` });
      return;
    }
    let sides = false;
    const side = plain(line).match(SIDES);
    if (side?.index !== undefined) {
      sides = true;
      // "(por lado)" deixa um "()" vazio para trás.
      line = `${line.slice(0, side.index)} ${line.slice(side.index + side[0].length)}`
        .replace(/\(\s*\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    line = line.replace(/[\s)]+$/, '');
    const flat = plain(line);
    let amount: Amount | null = null;
    let cut = line.length;
    for (const pattern of PATTERNS) {
      const m = flat.match(pattern.re);
      if (m?.index !== undefined) {
        amount = pattern.read(m);
        cut = m.index;
        break;
      }
    }
    const issue = (kind: SequenceIssueKind) => {
      issues.push({ line: index + 1, kind, text: original });
    };
    if (!amount) {
      issue('noAmount');
      return;
    }
    const kind = REST.test(flat) ? 'rest' : 'work';
    if (kind === 'rest' && amount.seconds === null) {
      issue('restNeedsTime');
      return;
    }
    if (amount.sets > SEQUENCE_SETS_MAX) {
      issue('tooManySets');
      return;
    }
    items.push({
      name: line.slice(0, cut).replace(TRAILING, '').trim(),
      kind,
      seconds: amount.seconds,
      reps: amount.reps,
      sides,
      sets: Math.max(1, amount.sets),
    });
  });
  return { items, issues };
}

export interface SequenceWords {
  workName: (n: number) => string;
  restName: string;
  setName: (name: string, set: number, sets: number) => string;
  blockName: string;
}

/** Cada linha com nome: o escrito, ou "Descanso" e "Exercício 1, 2..." para linha só com tempo. */
export function withNames(items: readonly SequenceItem[], w: SequenceWords): SequenceItem[] {
  let works = 0;
  return items.map((item) => {
    if (item.name) return item;
    if (item.kind === 'rest') return { ...item, name: w.restName };
    works += 1;
    return { ...item, name: w.workName(works) };
  });
}

/**
 * Monta a rotina: séries viram etapas seguidas, com o descanso entre exercícios depois de cada
 * uma (a não ser que a próxima linha já seja um descanso). A regra do descanso final (D11) tira
 * o que sobrar no fim da última volta.
 */
export function sequenceRoutine(
  base: { id: string; name: string; now: number },
  items: readonly SequenceItem[],
  options: { repeat: number; restBetweenSeconds: number },
  w: SequenceWords,
): Routine {
  const steps: Step[] = [];
  const named = withNames(items, w);
  named.forEach((item, i) => {
    const next = named[i + 1];
    const name = item.name;
    for (let set = 1; set <= item.sets; set += 1) {
      steps.push({
        id: `${base.id}-${String(i)}-${String(set)}`,
        name: item.sets > 1 ? w.setName(name, set, item.sets) : name,
        kind: item.kind,
        seconds: item.seconds,
        reps: item.reps,
        ...(item.sides ? { sides: true } : {}),
      });
      const lastOfItem = set === item.sets;
      const nextIsRest = lastOfItem && next?.kind === 'rest';
      if (item.kind === 'work' && options.restBetweenSeconds > 0 && !nextIsRest) {
        steps.push({
          id: `${base.id}-${String(i)}-${String(set)}-r`,
          name: w.restName,
          kind: 'rest',
          seconds: options.restBetweenSeconds,
          reps: null,
        });
      }
    }
  });
  const block: Block = {
    id: `${base.id}-b1`,
    name: w.blockName,
    repeat: options.repeat,
    steps,
    restAfterSeconds: 0,
  };
  return {
    id: base.id,
    name: base.name,
    modality: 'profissional',
    version: 1,
    origin: 'custom',
    prepSeconds: 10,
    blocks: [block],
    cooldownSeconds: 0,
    createdAt: base.now,
    updatedAt: base.now,
  };
}
