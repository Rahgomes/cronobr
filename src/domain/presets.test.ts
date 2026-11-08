import { must } from '@/test/domain';

import { presetById, PRESETS } from './presets';
import { buildTimeline, summarize } from './timeline';

it('ids iguais aos do app antigo e Tabata clássico com 4 min (sem descanso final)', () => {
  expect(PRESETS).toHaveLength(13);
  const tabata = presetById('tabata-classic');
  expect(tabata?.name).toBe('Tabata clássico');
  // 10 s de preparação + 8 × 20 s + 7 × 10 s = 240 s
  expect(summarize(buildTimeline(must(tabata))).knownMs).toBe(240_000);
  expect(presetById('nao-existe')).toBeUndefined();
});
