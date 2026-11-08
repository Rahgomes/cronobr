import { DEFAULT_CUE_PREFS } from '@/domain/cues';

import { PORTABLE_PREF_KEYS, portablePrefs } from './portable-prefs';

describe('preferências portáveis', () => {
  it('só as chaves do app viajam; as do aparelho ou do momento ficam de fora', () => {
    expect(PORTABLE_PREF_KEYS.sort()).toEqual(
      ['avisos', 'favoritos', 'rapido.intervalo', 'rapido.temporizador', 'sessao'].sort(),
    );
    const { prefs } = portablePrefs(
      { cronometro: { laps: [] }, 'rascunho:x': {}, 'legacy.import': 1, sessao: { view: 'foco' } },
      new Set(),
    );
    expect(prefs).toEqual({ sessao: { view: 'foco', lockOnStart: true } });
  });

  it('som que não existe vira o padrão e avisa; voz ligada usa a do aparelho', () => {
    const { prefs, notes } = portablePrefs(
      { avisos: { voice: true, sounds: { work: 'trombeta', rest: 'gong' } } },
      new Set(),
    );
    expect(prefs.avisos).toMatchObject({
      sounds: { work: DEFAULT_CUE_PREFS.sounds.work, rest: 'gong' },
    });
    expect(notes).toEqual([
      'Som que não existe nesta versão: ficou o som padrão.',
      'Voz: usa a voz em português deste aparelho.',
    ]);
    expect(portablePrefs({ avisos: { voice: false, sounds: 'x' } }, new Set()).notes).toEqual([]);
  });

  it('favorita sem rotina correspondente sai, com aviso; nome do temporizador limitado', () => {
    const { prefs, notes } = portablePrefs(
      {
        favoritos: ['a', 'sumiu', 3],
        'rapido.temporizador': { seconds: 60, name: 'x'.repeat(99) },
      },
      new Set(['a']),
    );
    expect(prefs.favoritos).toEqual(['a']);
    expect(notes).toEqual(['Favoritas de rotinas que não vieram no arquivo ficaram de fora.']);
    expect((prefs['rapido.temporizador'] as { name: string }).name).toHaveLength(60);
    expect(portablePrefs({ favoritos: ['a'] }, new Set(['a'])).notes).toEqual([]);
  });
});
