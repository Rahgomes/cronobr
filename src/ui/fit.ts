/** Largura de um caractere tabular em negrito, em "em" (algarismo da fonte do sistema, com folga). */
const CHAR_EM = 0.62;

/**
 * Tamanho do número grande que cabe numa linha na largura disponível (E06 C): 120 pixels de
 * "00:45" passavam de uma tela de 320. Nunca maior que o tamanho de base nem menor que `min`.
 */
export function fitFontSize(text: string, available: number, base: number, min = 32) {
  const chars = Math.max(1, text.length);
  return Math.max(min, Math.min(base, Math.floor(available / (chars * CHAR_EM))));
}
