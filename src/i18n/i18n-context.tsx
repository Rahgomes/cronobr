// Idioma em uso para as telas: useT() devolve os textos da língua escolhida.
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';

import type { Language } from '@/domain/appearance';
import type { Modality } from '@/domain/routine';

import { en } from './messages/en';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { pt, type Messages } from './messages/pt';

export const MESSAGES: Record<Language, Messages> = { 'pt-BR': pt, en, es, fr };

/** Nome de cada língua nela mesma: quem não lê a atual ainda acha a sua. */
export const LANGUAGE_NAME: Record<Language, string> = {
  'pt-BR': 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

type I18n = { language: Language; t: Messages };

// Fora do provedor (testes de componente): português.
const I18nContext = createContext<I18n>({ language: 'pt-BR', t: pt });

export function LocaleProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ language, t: MESSAGES[language] }), [language]);
  // Na web, o leitor de tela pronuncia pela língua da página.
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useT(): Messages {
  return useContext(I18nContext).t;
}

export function useLanguage(): Language {
  return useContext(I18nContext).language;
}

/**
 * Estudo e tarefas não são treino: a sessão fala "Foco", "Pausa" e "Sessão concluída".
 * Só troca as palavras da sessão; o resto da tela segue igual.
 */
export function withMode(t: Messages, modality: Modality): Messages {
  if (modality !== 'foco' && modality !== 'tarefas') return t;
  const mode = t.modes[modality];
  return {
    ...t,
    words: {
      ...t.words,
      phase: { ...t.words.phase, ...mode.phase },
      completed: mode.completed,
    },
    session: {
      ...t.session,
      completed: mode.completed,
      interrupted: mode.interrupted,
      stopTitle: mode.stopTitle,
      continueWorkout: mode.continueWorkout,
      stopWorkout: mode.stopWorkout,
    },
  };
}

/** Palavras da sessão conforme a modalidade da rotina (ver withMode). */
export function ModeProvider({ modality, children }: { modality: Modality; children: ReactNode }) {
  const parent = useContext(I18nContext);
  const value = useMemo(
    () => ({ language: parent.language, t: withMode(parent.t, modality) }),
    [parent, modality],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}
