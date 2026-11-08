import { DEFAULT_APPEARANCE, parseAppearance, resolveLanguage } from './appearance';

describe('parseAppearance', () => {
  it('mantém o que é válido', () => {
    expect(parseAppearance({ theme: 'light', language: 'fr' })).toEqual({
      theme: 'light',
      language: 'fr',
    });
    expect(parseAppearance({ theme: 'dark', language: 'auto' })).toEqual({
      theme: 'dark',
      language: 'auto',
    });
  });

  it('valor estranho ou ausente volta ao padrão', () => {
    expect(parseAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearance('dark')).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearance({ theme: 'roxo', language: 'de' })).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearance({ theme: 1, language: 2 })).toEqual(DEFAULT_APPEARANCE);
  });
});

describe('resolveLanguage', () => {
  it('escolha da pessoa vence o aparelho', () => {
    expect(resolveLanguage('es', ['pt-BR'])).toBe('es');
  });

  it('do aparelho: a primeira língua que o app fala', () => {
    expect(resolveLanguage('auto', ['pt-PT'])).toBe('pt-BR');
    expect(resolveLanguage('auto', ['de-DE', 'fr-CA', 'en'])).toBe('fr');
    expect(resolveLanguage('auto', ['es_419'])).toBe('es');
    expect(resolveLanguage('auto', ['EN-gb'])).toBe('en');
  });

  it('nenhuma conhecida: inglês', () => {
    expect(resolveLanguage('auto', ['de-DE', 'ja'])).toBe('en');
    expect(resolveLanguage('auto', [])).toBe('en');
  });
});
