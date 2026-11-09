import { cadenceOf, HALFWAY_QUIET_MS, isQuiet, PHASE_QUIET_MS, quietWindows } from './cadence';
import { DEFAULT_CUE_PREFS, parseCuePrefs } from './cues';
import type { Segment } from './timeline';

const work = (durationMs: number | null, bpm?: number): Segment => ({
  index: 0,
  phase: 'work',
  name: 'Corrida',
  durationMs,
  reps: durationMs === null ? 10 : null,
  block: 0,
  round: 1,
  rounds: 1,
  ...(bpm === undefined ? {} : { bpm }),
});

describe('cadência na etapa', () => {
  it('toca o BPM da etapa só com o pulso ligado', () => {
    expect(cadenceOf(work(60_000, 170), DEFAULT_CUE_PREFS)).toBe(170);
    expect(cadenceOf(work(60_000), DEFAULT_CUE_PREFS)).toBeNull();
    expect(cadenceOf(undefined, DEFAULT_CUE_PREFS)).toBeNull();
    expect(cadenceOf(work(60_000, 170), { ...DEFAULT_CUE_PREFS, pulse: false })).toBeNull();
  });

  it('pulso desligado nas preferências gravadas; o que falta volta ligado', () => {
    expect(parseCuePrefs({ pulse: false }).pulse).toBe(false);
    expect(parseCuePrefs({}).pulse).toBe(true);
  });

  it('prioridade: troca de etapa, meio do tempo e contagem calam o pulso', () => {
    const windows = quietWindows(work(60_000, 170), DEFAULT_CUE_PREFS);
    expect(windows).toEqual([
      { from: 0, to: PHASE_QUIET_MS },
      { from: 30_000, to: 30_000 + HALFWAY_QUIET_MS },
      { from: 57_000, to: 60_000 },
      { from: 60_000, to: Infinity },
    ]);
    expect(isQuiet(windows, 100)).toBe(true);
    expect(isQuiet(windows, PHASE_QUIET_MS)).toBe(false);
    expect(isQuiet(windows, 30_500)).toBe(true);
    expect(isQuiet(windows, 45_000)).toBe(false);
    expect(isQuiet(windows, 58_000)).toBe(true);
    expect(isQuiet(windows, 60_100)).toBe(true);
  });

  it('sem o aviso, sem a janela dele', () => {
    const silent = { ...DEFAULT_CUE_PREFS, sound: false, voice: false };
    expect(quietWindows(work(60_000), silent)).toEqual([{ from: 60_000, to: Infinity }]);
    // Sem voz: não há "metade do tempo"; sem contagem: não há os 3 s finais.
    const noVoice = { ...DEFAULT_CUE_PREFS, voice: false, countdown: false };
    expect(quietWindows(work(60_000), noVoice)).toEqual([
      { from: 0, to: PHASE_QUIET_MS },
      { from: 60_000, to: Infinity },
    ]);
  });

  it('etapa curta, por repetições ou de descanso', () => {
    expect(quietWindows(work(2_000), DEFAULT_CUE_PREFS)).toEqual([
      { from: 0, to: PHASE_QUIET_MS },
      { from: 0, to: 2_000 },
      { from: 2_000, to: Infinity },
    ]);
    expect(quietWindows(work(null), DEFAULT_CUE_PREFS)).toEqual([{ from: 0, to: PHASE_QUIET_MS }]);
    const rest: Segment = { ...work(60_000), phase: 'rest' };
    expect(quietWindows(rest, DEFAULT_CUE_PREFS)).toHaveLength(3);
  });
});
