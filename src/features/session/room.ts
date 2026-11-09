import { layout, space } from '@/ui/tokens';

/** Largura da coluna de controles na paisagem. */
export const CONTROLS_WIDTH = 300;

/** Quanto espaço a sessão tem (E06 C): retrato numa coluna, paisagem em duas. */
export interface Room {
  /** Paisagem (ou tablet deitado): corpo à esquerda, controles à direita. */
  wide: boolean;
  /** Largura útil do corpo, para o número grande caber numa linha. */
  text: number;
  /** Diâmetro do anel. */
  ring: number;
}

const RING_MAX = 260;
const RING_MIN = 140;
/** Título, rodada, próxima etapa, barra e total em volta do anel. */
const AROUND_RING = 190;
/** Em pé somam ainda o topo e os controles do rodapé. */
const AROUND_RING_PORTRAIT = 470;

export function sessionRoom(width: number, height: number): Room {
  const wide = width > height && width >= 560;
  if (!wide) {
    const text = Math.min(width, layout.contentMax) - space.lg * 2;
    // Em pé, o anel também cede à altura: tempo, barra e "Próxima" cabem sem rolar.
    const byHeight = Math.max(RING_MIN, height - AROUND_RING_PORTRAIT);
    return { wide, text, ring: Math.min(RING_MAX, text, byHeight) };
  }
  const text = Math.min(width, layout.wideMax) - space.lg * 3 - CONTROLS_WIDTH;
  const ring = Math.max(RING_MIN, Math.min(RING_MAX, height - AROUND_RING, text));
  return { wide, text, ring };
}
