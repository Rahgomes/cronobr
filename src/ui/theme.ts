// Tema do CronôBR: uma paleta só (laranja, preto, cinza), em claro e escuro. O escuro é o padrão
// de quem não escolheu: o app nasceu escuro e é usado em academia.
import { colors as lightColors, darkColors, type ColorRole } from './tokens';

export type Colors = Record<ColorRole, string>;
export type ColorScheme = 'light' | 'dark';
export type ThemeMode = 'auto' | ColorScheme;

export function themeColors(scheme: ColorScheme): Colors {
  return scheme === 'dark' ? darkColors : lightColors;
}

export function resolveScheme(
  mode: ThemeMode,
  system: ColorScheme | null | undefined,
): ColorScheme {
  if (mode !== 'auto') return mode;
  return system ?? 'dark';
}

/** Mistura duas cores #RRGGBB: `amount` 0 devolve `a`, 1 devolve `b`. */
export function mix(a: string, b: string, amount: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return `#${[1, 3, 5]
    .map((i) =>
      Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * amount)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

// WCAG 2.2: luminância relativa e razão de contraste.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
