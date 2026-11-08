import { contrast, mix, resolveScheme, themeColors, type ColorScheme } from './theme';
import type { ColorRole } from './tokens';

// Texto normal pede 4,5:1; ícone e borda de campo, 3:1 (WCAG 2.2 AA).
const TEXT_PAIRS: [ColorRole, ColorRole][] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['onPrimary', 'primary'],
  ['onPrimary', 'primaryPressed'],
  ['primary', 'background'],
  ['primary', 'surface'],
  ['primary', 'accentSoft'],
  ['success', 'successSoft'],
  ['warning', 'warningSoft'],
  ['danger', 'dangerSoft'],
  ['danger', 'surface'],
  ['goldInk', 'goldSoft'],
  ['onHero', 'hero'],
  ['text', 'iconButton'],
];
const UI_PAIRS: [ColorRole, ColorRole][] = [
  ['inputBorder', 'surface'],
  ['focus', 'background'],
  ['gold', 'goldSoft'],
];

describe.each<ColorScheme>(['light', 'dark'])('tema %s', (scheme) => {
  const c = themeColors(scheme);

  it.each(TEXT_PAIRS)('%s sobre %s passa 4,5:1', (fg, bg) => {
    expect(contrast(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)('%s sobre %s passa 3:1', (fg, bg) => {
    expect(contrast(c[fg], c[bg])).toBeGreaterThanOrEqual(3);
  });
});

it('texto sobre foto passa 4,5:1 no pior caso (degradê sobre foto clara)', () => {
  // O texto fica abaixo de FADE_SOLID_AT, onde o degradê já tem 78% de #0A0A0A. Sobre branco puro
  // isso dá ~#3B3B3B: o fundo mais claro possível atrás do texto.
  const worst = mix('#0A0A0A', '#FFFFFF', 0.22);
  const c = themeColors('dark');
  expect(contrast(c.onPhoto, worst)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(c.onPhotoMuted, worst)).toBeGreaterThanOrEqual(4.5);
});

describe('resolveScheme', () => {
  it('respeita a escolha explícita', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });

  it('segue o sistema no automático e cai no escuro sem informação', () => {
    expect(resolveScheme('auto', 'light')).toBe('light');
    expect(resolveScheme('auto', null)).toBe('dark');
    expect(resolveScheme('auto', undefined)).toBe('dark');
  });
});

it('contraste é simétrico e vai de 1 a 21', () => {
  expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  expect(contrast('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
  expect(contrast('#777777', '#777777')).toBe(1);
});

it('mix vai de uma cor à outra', () => {
  expect(mix('#000000', '#FFFFFF', 0)).toBe('#000000');
  expect(mix('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
  expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
});
