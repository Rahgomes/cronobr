import { block, clockAt, routine, step } from '@/test/domain';

import { createSession, skip, snapshot, start } from './engine';
import { overallProgress, phaseProgress, rowState } from './progress';
import { buildTimeline } from './timeline';

const at = (seconds: number) => clockAt(seconds * 1000);

describe('progresso', () => {
  // work 20 · rest 10 · work 20 = 50 s
  const r = routine();
  const tl = buildTimeline(r);
  const s = start(createSession('s', r), tl, at(0));

  it('pelo tempo quando tudo tem duração', () => {
    const snap = snapshot(s, tl, at(25));
    expect(phaseProgress(tl, snap)).toBeCloseTo(0.5);
    expect(overallProgress(tl, snap)).toBeCloseTo(0.5);
    expect(rowState(0, snap)).toBe('done');
    expect(rowState(1, snap)).toBe('current');
    expect(rowState(2, snap)).toBe('next');
  });

  it('fim: tudo cheio e feito', () => {
    const snap = snapshot(s, tl, at(99));
    expect(phaseProgress(tl, snap)).toBe(1);
    expect(overallProgress(tl, snap)).toBe(1);
    expect(rowState(2, snap)).toBe('done');
  });

  it('com etapa por repetições anda por etapa, e a manual fica em 0 até "Concluí"', () => {
    const manual = routine({
      blocks: [
        block({
          repeat: 1,
          steps: [
            step({ kind: 'work', seconds: null, reps: 10 }),
            step({ kind: 'work', seconds: 10 }),
          ],
        }),
      ],
    });
    const mtl = buildTimeline(manual);
    const ms = start(createSession('m', manual), mtl, at(0));
    const waiting = snapshot(ms, mtl, at(60));
    expect(phaseProgress(mtl, waiting)).toBe(0);
    expect(overallProgress(mtl, waiting)).toBe(0);
    const next = skip(ms, mtl, at(60));
    expect(overallProgress(mtl, snapshot(next, mtl, at(65)))).toBeCloseTo(0.75);
  });

  it('rotina vazia conta como completa', () => {
    const empty = snapshot(createSession('e', routine()), [], at(0));
    expect(overallProgress([], empty)).toBe(1);
  });
});
