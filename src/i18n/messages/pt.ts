// Fonte dos textos do app. Os outros idiomas têm o mesmo formato (o tipo cobra cada chave).
// Texto com número ou nome é função: cada idioma monta a frase do seu jeito.
import type { Words } from '@/domain/words';

export const pt = {
  words: {
    phase: {
      prep: 'Preparação',
      work: 'Exercício',
      rest: 'Descanso',
      blockRest: 'Descanso entre blocos',
      cooldown: 'Desaquecimento',
    },
    side: { left: 'lado esquerdo', right: 'lado direito' },
    withSide: (name: string, side: string) => `${name}, ${side}`,
    spokenMinutes: (n: number) => `${String(n)} ${n === 1 ? 'minuto' : 'minutos'}`,
    spokenSeconds: (n: number) => `${String(n)} ${n === 1 ? 'segundo' : 'segundos'}`,
    spokenAnd: ' e ',
    go: 'Vai',
    reps: (n: number) => `${String(n)} ${n === 1 ? 'repetição' : 'repetições'}`,
    lastRound: 'Última rodada. ',
    prepare: 'Preparar',
    next: (label: string, name: string) => `${label}. Próximo: ${name}`,
    completed: 'Treino concluído',
    halfway: 'Metade',
    round: (round: number, rounds: number) => `Rodada ${String(round)} de ${String(rounds)}`,
    today: 'hoje',
    yesterday: 'ontem',
    daysAgo: (n: number) => `há ${String(n)} dias`,
    weeksAgo: (n: number) => `há ${String(n)} ${n === 1 ? 'semana' : 'semanas'}`,
    monthsAgo: (n: number) => `há ${String(n)} ${n === 1 ? 'mês' : 'meses'}`,
    newWork: 'Exercício',
    newRest: 'Descanso',
    newBlock: (n: number) => `Bloco ${String(n)}`,
    copySuffix: ' (cópia)',
    interval: (work: string, rest: string, rounds: number) =>
      `Intervalado ${work}/${rest} × ${String(rounds)}`,
    timer: (time: string) => `Temporizador ${time}`,
    timerStep: 'Tempo',
    limits: {
      subject: {
        stepName: 'da etapa',
        blockName: 'do bloco',
        routineName: 'da rotina',
        stepTime: 'o tempo da etapa',
        blockRest: 'o descanso entre blocos',
        prep: 'a preparação',
        cooldown: 'o desaquecimento',
      },
      nameEmpty: (s: string) => `Dê um nome ${s}.`,
      nameLong: (s: string, max: number) => `O nome ${s} pode ter até ${String(max)} letras.`,
      required: (s: string) => `Informe ${s}.`,
      wholeSeconds: (s: string) => `${s} precisa ser em segundos inteiros.`,
      negative: (s: string) => `${s} não pode ser menor que zero.`,
      atLeast: (s: string, seconds: number) => `${s} precisa ter pelo menos ${String(seconds)} s.`,
      atMost: (s: string, limit: string) => `${s} pode ter até ${limit}.`,
      repsWhole: 'As repetições precisam ser um número inteiro.',
      repsMin: 'Informe pelo menos 1 repetição.',
      repsMax: (max: number) => `As repetições podem ir até ${String(max)}.`,
      repsNeeded: 'Etapa sem tempo precisa de repetições.',
      restNeedsTime: 'Descanso precisa de tempo.',
      roundsWhole: 'As rodadas precisam ser um número inteiro.',
      roundsMin: 'O bloco precisa de pelo menos 1 rodada.',
      roundsMax: (max: number) => `O bloco pode ter até ${String(max)} rodadas.`,
      stepsMin: 'O bloco precisa de pelo menos 1 etapa.',
      stepsMax: (max: number) => `O bloco pode ter até ${String(max)} etapas.`,
      activeWork: 'O bloco precisa de pelo menos 1 exercício ativo.',
      blocksMin: 'A rotina precisa de pelo menos 1 bloco.',
      blocksMax: (max: number) => `A rotina pode ter até ${String(max)} blocos.`,
      segments: (count: number, max: number) =>
        `A rotina ficou com ${String(count)} etapas no total; o máximo é ${String(max)}. Diminua as rodadas.`,
      total: (limit: string) => `A rotina passa de ${limit}. Divida em duas.`,
      hours: (n: number) => `${String(n)} h`,
      minutes: (n: number) => `${String(n)} min`,
    },
    file: {
      tooBig: (mb: number) =>
        `O arquivo passa de ${String(mb)} MB. Exporte de novo sem o histórico.`,
      notJson: 'O arquivo está incompleto ou não é do CronôBR.',
      headerBroken: 'O arquivo do CronôBR está com o cabeçalho estragado.',
      notCronobr: 'Este arquivo não é do CronôBR.',
      newer: (version: string) =>
        `Este arquivo foi feito por uma versão mais nova do CronôBR (${version}). Atualize o app para abrir.`,
      older: 'Versão do arquivo desconhecida.',
      routineInvalid: 'A rotina do arquivo está com dados errados.',
      routineLimits: 'A rotina do arquivo passa dos limites do app.',
      backupInvalid: 'O backup está com dados errados.',
      backupLimits: 'Há rotinas no backup que passam dos limites do app.',
      duplicates: 'O backup tem rotinas repetidas.',
      duplicate: (name: string) => `Rotina repetida no arquivo: "${name}"`,
    },
  },
  common: {
    back: 'Voltar',
    retry: 'Tentar de novo',
  },
  boot: {
    opening: 'Abrindo seus treinos',
    unavailable: 'Armazenamento indisponível',
    fallback: 'Não deu para abrir seus treinos neste aparelho.',
    notErased: 'Seus dados não foram apagados.',
  },
  crash: {
    title: 'Algo deu errado',
    body: 'Seus treinos estão guardados. Tente de novo.',
  },
  home: {
    history: 'Histórico',
    backup: 'Backup e transferência',
    settings: 'Ajustes',
  },
  settings: {
    title: 'Ajustes',
    theme: 'Tema',
    themeAuto: 'Do aparelho',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    language: 'Idioma',
    languageAuto: (name: string) => `Do aparelho (${name})`,
    languageHint: 'Nomes das suas rotinas ficam como você escreveu.',
    cues: 'Som e avisos',
    cuesHint: 'Sons de cada fase, voz, vibração e contagem 3, 2, 1.',
    saveFailed: 'Não deu para guardar a escolha. Tente de novo.',
  },
} satisfies Record<string, unknown> & { words: Words };

type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => string
    ? (...args: A) => string
    : { [K in keyof T]: Widen<T[K]> };

export type Messages = Widen<typeof pt>;
