// Aparência do app (E06): tema e idioma escolhidos pela pessoa, com "do aparelho" como padrão.

export const LANGUAGES = ['pt-BR', 'en', 'es', 'fr'] as const;
export type Language = (typeof LANGUAGES)[number];

export type ThemePref = 'auto' | 'light' | 'dark';
export type LanguagePref = 'auto' | Language;

export interface Appearance {
  theme: ThemePref;
  language: LanguagePref;
}

export const DEFAULT_APPEARANCE: Appearance = { theme: 'auto', language: 'auto' };

const THEMES: readonly string[] = ['auto', 'light', 'dark'];
const isLanguage = (v: unknown): v is Language =>
  typeof v === 'string' && (LANGUAGES as readonly string[]).includes(v);

/** Valor gravado (ou vindo de um backup) vira uma aparência válida; o estranho volta ao padrão. */
export function parseAppearance(raw: unknown): Appearance {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    theme:
      typeof o.theme === 'string' && THEMES.includes(o.theme)
        ? (o.theme as ThemePref)
        : DEFAULT_APPEARANCE.theme,
    language: o.language === 'auto' || isLanguage(o.language) ? o.language : 'auto',
  };
}

/**
 * Idioma em uso. "Do aparelho" segue a primeira língua do sistema que o app fala; se nenhuma
 * for, inglês (quem configurou o aparelho em alemão lê inglês melhor que português).
 */
export function resolveLanguage(pref: LanguagePref, deviceTags: readonly string[]): Language {
  if (pref !== 'auto') return pref;
  for (const tag of deviceTags) {
    const base = tag.toLowerCase().split(/[-_]/)[0];
    if (base === 'pt') return 'pt-BR';
    if (base === 'en' || base === 'es' || base === 'fr') return base;
  }
  return 'en';
}
