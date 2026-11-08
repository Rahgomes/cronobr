import { must } from '@/test/domain';

import { presetById, PRESETS } from './presets';
import { buildTimeline, summarize } from './timeline';

it('ids iguais aos do app antigo e Tabata clássico com 4 min (sem descanso final)', () => {
  expect(PRESETS).toHaveLength(17);
  const tabata = presetById('tabata-classic');
  expect(tabata?.name).toBe('Tabata clássico');
  // 10 s de preparação + 8 × 20 s + 7 × 10 s = 240 s
  expect(summarize(buildTimeline(must(tabata))).knownMs).toBe(240_000);
  expect(presetById('nao-existe')).toBeUndefined();
});

it('EMOM: uma rodada por minuto, sem descanso fixo, e dá para terminar antes', () => {
  const emom = buildTimeline(must(presetById('emom-15s')));
  const work = emom.filter((s) => s.phase === 'work');
  expect(work).toHaveLength(10);
  expect(work.every((s) => s.durationMs === 60_000 && s.early === true)).toBe(true);
  expect(emom.some((s) => s.phase === 'rest')).toBe(false);
});

it('AMRAP: um tempo só', () => {
  const amrap = buildTimeline(must(presetById('amrap-quick')));
  expect(amrap.map((s) => [s.phase, s.durationMs])).toEqual([
    ['prep', 10_000],
    ['work', 600_000],
  ]);
});

it('corrida e caminhada alternadas, com nome', () => {
  const run = buildTimeline(must(presetById('corrida-1-1')));
  expect(run.slice(1, 3).map((s) => s.name)).toEqual(['Corrida', 'Caminhada']);
});

it('mobilidade: etapa dos dois lados vira esquerdo e direito', () => {
  const names = buildTimeline(must(presetById('mobilidade-manha'))).map((s) =>
    s.side ? `${String(s.name)}, ${s.side}` : s.name,
  );
  expect(names).toContain('Quadril, left');
  expect(names.indexOf('Quadril, right')).toBe(names.indexOf('Quadril, left') + 1);
  expect(names).toContain('Pescoço');
  expect(names).not.toContain('Pescoço, left');
});
