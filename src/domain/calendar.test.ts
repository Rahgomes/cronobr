// Datas montadas na hora local: o teste vale em qualquer fuso (CI em UTC, servidor em BRT).
import {
  cleanNote,
  countByDay,
  dayKey,
  monthGrid,
  monthOf,
  monthRange,
  NOTE_MAX,
  sameMonth,
  shiftMonth,
} from './calendar';

const local = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m, d, h, min).getTime();

describe('dia e mês locais', () => {
  it('o treino das 23h59 é do dia em que foi feito; 00h00 já é o seguinte', () => {
    expect(dayKey(local(2026, 10, 7, 23, 59))).toBe('2026-11-07');
    expect(dayKey(local(2026, 10, 8, 0, 0))).toBe('2026-11-08');
    expect(dayKey(local(2026, 0, 5))).toBe('2026-01-05');
  });

  it('mês do instante, troca de mês virando o ano e comparação', () => {
    expect(monthOf(local(2026, 10, 30))).toEqual({ year: 2026, month: 10 });
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(sameMonth({ year: 2026, month: 1 }, { year: 2026, month: 1 })).toBe(true);
    expect(sameMonth({ year: 2026, month: 1 }, { year: 2025, month: 1 })).toBe(false);
  });

  it('intervalo do mês vai do dia 1 à meia-noite até o dia 1 seguinte (exclusivo)', () => {
    const range = monthRange({ year: 2026, month: 1 });
    expect(range.from).toBe(local(2026, 1, 1, 0));
    expect(range.to).toBe(local(2026, 2, 1, 0));
  });
});

describe('grade do mês', () => {
  it('novembro de 2026: começa num domingo, 30 dias, semanas completas de 7', () => {
    const weeks = monthGrid({ year: 2026, month: 10 });
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]?.[0]?.day).toBe(1);
    const days = weeks.flat().filter((cell) => cell !== null);
    expect(days).toHaveLength(30);
    expect(days.at(-1)).toMatchObject({ key: '2026-11-30', day: 30 });
    // Cada dia cobre da meia-noite até a meia-noite seguinte.
    expect(days[6]).toMatchObject({ from: local(2026, 10, 7, 0), to: local(2026, 10, 8, 0) });
  });

  it('fevereiro de 2026: começa no domingo; mês que começa no meio da semana tem casas vazias', () => {
    expect(monthGrid({ year: 2026, month: 1 }).flat().filter(Boolean)).toHaveLength(28);
    // Outubro de 2026 começa numa quinta: 4 casas vazias antes do dia 1.
    const [first] = monthGrid({ year: 2026, month: 9 });
    expect(first?.slice(0, 4)).toEqual([null, null, null, null]);
    expect(first?.[4]?.day).toBe(1);
  });
});

describe('contagem e nota', () => {
  it('conta treinos por dia local', () => {
    const counts = countByDay([
      local(2026, 10, 7, 7),
      local(2026, 10, 7, 23, 30),
      local(2026, 10, 8, 0, 10),
    ]);
    expect(Object.fromEntries(counts)).toEqual({ '2026-11-07': 2, '2026-11-08': 1 });
  });

  it('nota sem espaço nas pontas, no limite; vazia apaga', () => {
    expect(cleanNote('  pesado hoje \n')).toBe('pesado hoje');
    expect(cleanNote('   ')).toBeNull();
    expect(cleanNote('x'.repeat(NOTE_MAX + 10))).toHaveLength(NOTE_MAX);
  });
});
