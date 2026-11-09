import { pt } from '@/i18n/messages/pt';
import { must } from '@/test/domain';

import { checkRoutine } from './limits';
import { presetById, PRESETS } from './presets';
import { buildTimeline, summarize } from './timeline';

it('ids iguais aos do app antigo e Tabata clássico com 4 min (sem descanso final)', () => {
  expect(PRESETS).toHaveLength(24);
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

it('estudo, tarefas e exemplo do profissional: todos passam nos limites', () => {
  const pomodoro = buildTimeline(must(presetById('foco-pomodoro')));
  expect(pomodoro.filter((s) => s.phase === 'work')).toHaveLength(4);
  expect(pomodoro.find((s) => s.phase === 'work')?.durationMs).toBe(25 * 60_000);
  // Sem a última pausa (D11): 4 focos + 3 pausas.
  expect(pomodoro.filter((s) => s.phase === 'rest')).toHaveLength(3);
  const morning = buildTimeline(must(presetById('tarefas-manha'))).map((s) => s.name);
  expect(morning).toContain('Café da manhã');
  const pro = must(presetById('profissional-exemplo'));
  expect(pro.modality).toBe('profissional');
  const steps = buildTimeline(pro);
  expect(steps.some((s) => s.reps === 15)).toBe(true);
  expect(steps.some((s) => s.side === 'left' && s.name === 'Concha deitado')).toBe(true);
  for (const preset of PRESETS) expect(checkRoutine(preset, pt.words).ok).toBe(true);
});
