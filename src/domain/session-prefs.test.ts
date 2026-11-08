import { DEFAULT_SESSION_PREFS, parseSessionPrefs } from './session-prefs';

describe('preferências da sessão', () => {
  it('padrão: Anel e trava ligada', () => {
    expect(parseSessionPrefs(undefined)).toEqual({ view: 'anel', lockOnStart: true });
    expect(parseSessionPrefs('lixo')).toBe(DEFAULT_SESSION_PREFS);
  });

  it('lê campo a campo: o válido fica, o estranho volta ao padrão', () => {
    expect(parseSessionPrefs({ view: 'lista', lockOnStart: false })).toEqual({
      view: 'lista',
      lockOnStart: false,
    });
    expect(parseSessionPrefs({ view: 'grade', lockOnStart: 'sim' })).toEqual(DEFAULT_SESSION_PREFS);
  });
});
