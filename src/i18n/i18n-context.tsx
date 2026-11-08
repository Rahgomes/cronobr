// Idioma em uso para as telas: useT() devolve os textos da língua escolhida.
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';

import type { Language } from '@/domain/appearance';

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
