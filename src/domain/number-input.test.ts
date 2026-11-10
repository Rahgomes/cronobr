import { digits, fit, readCount, readDuration, splitDuration } from './number-input';

describe('valor digitado à mão', () => {
  it('fica só com os dígitos, no máximo 6', () => {
    expect(digits(' 45 s')).toBe('45');
    expect(digits('1:30')).toBe('130');
    expect(digits('-3')).toBe('3');
    expect(digits('12345678')).toBe('123456');
    expect(digits('abc')).toBe('');
  });

  it('contagem: vazio vale zero', () => {
    expect(readCount('12')).toBe(12);
    expect(readCount('')).toBe(0);
    expect(readCount('007')).toBe(7);
  });

  it('duração: minutos e segundos, segundos acima de 59 somam', () => {
    expect(readDuration('1', '30')).toBe(90);
    expect(readDuration('0', '90')).toBe(90);
    expect(readDuration('', '7')).toBe(7);
    expect(readDuration('180', '')).toBe(10_800);
  });

  it('separa a duração atual nos dois campos', () => {
    expect(splitDuration(90)).toEqual({ minutes: '1', seconds: '30' });
    expect(splitDuration(5)).toEqual({ minutes: '0', seconds: '05' });
    expect(splitDuration(10_800)).toEqual({ minutes: '180', seconds: '00' });
    expect(splitDuration(-3)).toEqual({ minutes: '0', seconds: '00' });
  });

  it('encaixa no limite e avisa quando precisou', () => {
    expect(fit(30, 5, 60)).toEqual({ value: 30, clamped: false });
    expect(fit(2, 5, 60)).toEqual({ value: 5, clamped: true });
    expect(fit(90, 5, 60)).toEqual({ value: 60, clamped: true });
  });
});
