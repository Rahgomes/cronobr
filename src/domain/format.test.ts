import { clock, duration } from './format';

describe('formato de tempo', () => {
  it.each([
    [0, '0:00'],
    [400, '0:01'],
    [59_001, '1:00'],
    [600_000, '10:00'],
    [3_600_000, '1:00:00'],
    [3_725_000, '1:02:05'],
    [-5, '0:00'],
  ])('relógio %d ms → %s', (ms, text) => {
    expect(clock(ms)).toBe(text);
  });

  it.each([
    [45_000, '45 s'],
    [120_000, '2 min'],
    [90_000, '1 min 30 s'],
    [3_900_000, '1 h 05 min'],
    [-1, '0 s'],
  ])('duração %d ms → %s', (ms, text) => {
    expect(duration(ms)).toBe(text);
  });
});
