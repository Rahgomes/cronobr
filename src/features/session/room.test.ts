import { CONTROLS_WIDTH, sessionRoom } from './room';

it('retrato: uma coluna, anel inteiro quando cabe', () => {
  expect(sessionRoom(412, 915)).toEqual({ wide: false, text: 380, ring: 260 });
});

it('celular pequeno: anel encolhe para a largura', () => {
  expect(sessionRoom(240, 520)).toMatchObject({ wide: false, ring: 208 });
});

it('tablet em pé: largura do conteúdo limitada', () => {
  expect(sessionRoom(1024, 1366)).toMatchObject({ wide: false, text: 608 });
});

it('paisagem: duas colunas, anel pela altura', () => {
  const room = sessionRoom(915, 412);
  expect(room.wide).toBe(true);
  expect(room.ring).toBe(222);
  expect(room.text).toBe(915 - 48 - CONTROLS_WIDTH);
});

it('paisagem baixa: anel nunca menor que o mínimo', () => {
  expect(sessionRoom(700, 300).ring).toBe(140);
});

it('janela quase quadrada ou estreita fica em uma coluna', () => {
  expect(sessionRoom(540, 500).wide).toBe(false);
});
