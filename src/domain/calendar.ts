// Calendário do histórico: mês em grade, dia pela hora local do aparelho (o treino das 23h é do
// dia em que a pessoa treinou, não do dia em UTC).

export interface Month {
  year: number;
  /** 0 = janeiro, como no Date. */
  month: number;
}

export interface CalendarDay {
  key: string;
  day: number;
  /** Início e fim (exclusivo) do dia, em ms. */
  from: number;
  to: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Chave do dia local: "2026-11-07". */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function monthOf(ms: number): Month {
  const d = new Date(ms);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function shiftMonth({ year, month }: Month, delta: number): Month {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function sameMonth(a: Month, b: Month): boolean {
  return a.year === b.year && a.month === b.month;
}

/** Início e fim (exclusivo) do mês, em ms. */
export function monthRange({ year, month }: Month): { from: number; to: number } {
  return { from: new Date(year, month, 1).getTime(), to: new Date(year, month + 1, 1).getTime() };
}

/**
 * Semanas do mês, de domingo a sábado (como no calendário brasileiro). null = casa vazia antes do
 * dia 1 ou depois do último dia.
 */
export function monthGrid({ year, month }: Month): (CalendarDay | null)[][] {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (CalendarDay | null)[] = Array.from({ length: first }, () => null);
  for (let day = 1; day <= days; day += 1) {
    const from = new Date(year, month, day).getTime();
    cells.push({ key: dayKey(from), day, from, to: new Date(year, month, day + 1).getTime() });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (CalendarDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Quantos treinos terminaram em cada dia. */
export function countByDay(endedAt: readonly number[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ms of endedAt) {
    const key = dayKey(ms);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export const NOTE_MAX = 280;

/** Nota como a pessoa digitou, sem espaço nas pontas; vazia vira null (apaga). */
export function cleanNote(text: string): string | null {
  const trimmed = text.trim().slice(0, NOTE_MAX);
  return trimmed === '' ? null : trimmed;
}
