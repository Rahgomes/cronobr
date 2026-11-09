import { fitFontSize } from './fit';

it('mantém o tamanho de base quando cabe', () => {
  expect(fitFontSize('0:45', 600, 120)).toBe(120);
});

it('diminui para caber na largura (tela de 320 menos as margens)', () => {
  const size = fitFontSize('00:45', 288, 120);
  expect(size).toBeLessThan(120);
  expect(size * 5 * 0.62).toBeLessThanOrEqual(288);
});

it('hora cheia diminui mais que minuto', () => {
  expect(fitFontSize('1:05:00', 288, 120)).toBeLessThan(fitFontSize('05:00', 288, 120));
});

it('nunca abaixo do mínimo, nem com texto vazio', () => {
  expect(fitFontSize('99:99:99:99', 50, 120)).toBe(32);
  expect(fitFontSize('', 50, 120, 20)).toBe(80);
});
