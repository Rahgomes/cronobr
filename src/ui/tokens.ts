// Tokens por papel, espelhados em docs/design/prompt-base.md e docs/marca/MARCA.md.
// Contraste de cada combinação medido em theme.test.ts (WCAG 2.2 AA).
import type { TextStyle } from 'react-native';

/** Tema claro. O escuro (padrão do app) está em `darkColors`. */
export const colors = {
  /** No claro o laranja da marca é escurecido: texto e borda laranja sobre branco passam 4,5:1. */
  primary: '#C2410C',
  primaryPressed: '#9A3412',
  onPrimary: '#FFFFFF',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#121212',
  scrim: 'rgba(18, 18, 18, 0.6)',
  textMuted: '#5C5C5C',
  accentSoft: '#FFF1EB',
  iconButton: '#EBEBEB',
  border: '#E0E0E0',
  inputBorder: '#8A8A8A',
  success: '#1E6B30',
  successSoft: '#E6F3E8',
  warningSoft: '#FFF4E0',
  warning: '#7A4A00',
  danger: '#B3261E',
  dangerSoft: '#FDECEA',
  focus: '#C2410C',
  backdrop: '#E6E6E6',
  hero: '#121212',
  heroEnd: '#2A2A2A',
  onHero: '#FFFFFF',
  fieldShadow: '#000000',
  gloss: '#FF8555',
  gold: '#8A5A00',
  goldSoft: '#FBF0D9',
  goldInk: '#6B4600',
  /** Cards com foto: sempre escuros, nos dois temas (a foto é escura). */
  photoClear: 'rgba(10, 10, 10, 0)',
  photoScrim: 'rgba(10, 10, 10, 0.78)',
  photoDeep: 'rgba(10, 10, 10, 0.94)',
  onPhoto: '#FFFFFF',
  onPhotoMuted: '#D9D9D9',
  /** Fundo por fase na visualização Foco: o mesmo nos dois temas, texto branco por cima. */
  phasePrep: '#8A5A00',
  phaseWork: '#1B5E20',
  phaseRest: '#1565C0',
  phaseBlockRest: '#4527A0',
  phaseCooldown: '#00695C',
  onPhase: '#FFFFFF',
  onPhaseMuted: '#EDEDED',
  /**
   * Cor da fase como traço (anel, barra da etapa, régua do editor) sobre o fundo do tema. No
   * claro é a própria cor da fase; no escuro, uma versão clara (o verde-escuro sumia no preto).
   */
  inkPrep: '#8A5A00',
  inkWork: '#1B5E20',
  inkRest: '#1565C0',
  inkBlockRest: '#4527A0',
  inkCooldown: '#00695C',
} as const;

export type ColorRole = keyof typeof colors;

/** Tema escuro: laranja da marca puro, texto escuro por cima dele (branco sobre #FF6B35 dá 2,9:1). */
export const darkColors: Record<ColorRole, string> = {
  primary: '#FF6B35',
  primaryPressed: '#E55A2B',
  onPrimary: '#121212',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  scrim: 'rgba(0, 0, 0, 0.6)',
  textMuted: '#B0B0B0',
  accentSoft: '#3A2117',
  iconButton: '#2A2A2A',
  border: '#333333',
  inputBorder: '#8A8A8A',
  success: '#7DD38A',
  successSoft: '#17301C',
  warningSoft: '#33260F',
  warning: '#FFC266',
  danger: '#FF8A80',
  dangerSoft: '#3A1616',
  focus: '#FF8555',
  backdrop: '#0A0A0A',
  hero: '#1E1E1E',
  heroEnd: '#2A2A2A',
  onHero: '#FFFFFF',
  fieldShadow: 'transparent',
  gloss: '#FF8555',
  gold: '#FFC107',
  goldSoft: '#33290A',
  goldInk: '#FFD54F',
  photoClear: 'rgba(10, 10, 10, 0)',
  photoScrim: 'rgba(10, 10, 10, 0.78)',
  photoDeep: 'rgba(10, 10, 10, 0.94)',
  onPhoto: '#FFFFFF',
  onPhotoMuted: '#D9D9D9',
  /** Fundo por fase na visualização Foco: o mesmo nos dois temas, texto branco por cima. */
  phasePrep: '#8A5A00',
  phaseWork: '#1B5E20',
  phaseRest: '#1565C0',
  phaseBlockRest: '#4527A0',
  phaseCooldown: '#00695C',
  onPhase: '#FFFFFF',
  onPhaseMuted: '#EDEDED',
  inkPrep: '#FFB74D',
  inkWork: '#66BB6A',
  inkRest: '#64B5F6',
  inkBlockRest: '#B39DDB',
  inkCooldown: '#4DB6AC',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 8, md: 16, lg: 20, pill: 999 } as const;

/** Botão principal de 56: uso com uma mão durante o treino (super PRD 00). */
export const touch = { minTarget: 48, button: 56 } as const;

export const type = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '800' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

/**
 * Teto da letra ampliada do sistema, por variante (E06 C). Texto corrido acompanha até 200%
 * (WCAG 1.4.4); título e número grande já nascem grandes e crescem menos, para não cortar.
 */
export const maxScale: Record<keyof typeof type, number> = {
  display: 1.4,
  title: 1.6,
  body: 2,
  label: 2,
  caption: 2,
};

/** Largura máxima do conteúdo: no tablet a tela fica centralizada, sem linha de 1.000 pixels. */
export const layout = { contentMax: 640, wideMax: 1080 } as const;

export const elevation = {
  raised: {
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  floating: {
    elevation: 8,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  field: {
    elevation: 2,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
} as const;

export type TypeVariant = keyof typeof type;
