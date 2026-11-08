// Fonte dos textos do app. Os outros idiomas têm o mesmo formato (o tipo cobra cada chave).
// Texto com número ou nome é função: cada idioma monta a frase do seu jeito.
export const pt = {
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
};

type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => string
    ? (...args: A) => string
    : { [K in keyof T]: Widen<T[K]> };

export type Messages = Widen<typeof pt>;
