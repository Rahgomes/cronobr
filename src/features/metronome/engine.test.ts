import { measureJitter } from '@/domain/metronome';
import { fakeAudio, live } from '@/test/audio';

import { HORIZON_S, Metronome, REFILL_MS } from './engine';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('motor do metrônomo', () => {
  it('10 s a 240 BPM: intervalos exatos no relógio de áudio, fila nunca seca, pulso em ordem', () => {
    const audio = fakeAudio();
    const beats: number[] = [];
    const m = new Metronome(audio.clock, (b) => beats.push(b.index), jest.fn());
    m.start(240, 0);
    jest.advanceTimersByTime(10_000);
    const jitter = measureJitter(m.marked, 240);
    expect(jitter.maxDeviationMs).toBe(0);
    expect(jitter.late).toBe(0);
    expect(jitter.minSlackMs).toBeGreaterThan(0);
    expect(m.missed).toBe(0);
    expect(beats.length).toBeGreaterThanOrEqual(39);
    expect(beats).toEqual(beats.map((_, i) => i));
    m.stop();
  });

  it('laço travado 1 s (navegador em segundo plano): a fila de 1,5 s cobre e nada se perde', () => {
    const audio = fakeAudio();
    const m = new Metronome(audio.clock, jest.fn(), jest.fn());
    m.start(120, 0);
    jest.advanceTimersByTime(REFILL_MS);
    audio.stall += 1;
    jest.advanceTimersByTime(3_000);
    expect(m.missed).toBe(0);
    expect(measureJitter(m.marked, 120).maxDeviationMs).toBe(0);
    expect(HORIZON_S).toBeGreaterThan(1 + REFILL_MS / 1000);
    m.stop();
  });

  it('laço travado 3 s: pula as batidas vencidas no mesmo passo, sem rajada', () => {
    const audio = fakeAudio();
    const m = new Metronome(audio.clock, jest.fn(), jest.fn());
    m.start(120, 0);
    jest.advanceTimersByTime(REFILL_MS);
    audio.stall += 3;
    jest.advanceTimersByTime(REFILL_MS);
    expect(m.missed).toBeGreaterThan(0);
    // Toda batida marcada depois da trava ainda está no futuro de quando foi marcada.
    expect(measureJitter(m.marked, 120).late).toBe(0);
    m.stop();
  });

  it('trocar o BPM desmarca o que não tocou e segue no passo novo', () => {
    const audio = fakeAudio();
    const m = new Metronome(audio.clock, jest.fn(), jest.fn());
    m.start(60, 0);
    jest.advanceTimersByTime(1_100); // tocou a de 0,06 e a de 1,06
    m.setBpm(120);
    const after = live(audio.clicks);
    expect(after.slice(0, 3)).toEqual([0.06, 1.06, 1.56]);
    expect(audio.clicks.some((c) => c.cancelled && c.at > 1.1)).toBe(true);
    m.stop();
  });

  it('parar desmarca tudo e cala o pulso; o atraso do fone adia o pulso, não o som', () => {
    const audio = fakeAudio();
    const pulse = jest.fn();
    const m = new Metronome(audio.clock, pulse, jest.fn());
    m.start(120, 200);
    jest.advanceTimersByTime(100);
    expect(pulse).not.toHaveBeenCalled();
    jest.advanceTimersByTime(200); // 60 ms da primeira + 200 do fone
    expect(pulse).toHaveBeenCalledTimes(1);
    m.setOffset(0);
    m.stop();
    expect(live(audio.clicks).every((at) => at <= 0.3)).toBe(true);
    jest.advanceTimersByTime(5_000);
    expect(pulse).toHaveBeenCalledTimes(1);
    expect(m.running).toBe(false);
  });

  it('prévia: 4 batidas e acaba sozinha', () => {
    const audio = fakeAudio();
    const end = jest.fn();
    const m = new Metronome(audio.clock, jest.fn(), end);
    m.start(240, 0, { preview: true });
    jest.advanceTimersByTime(3_000);
    expect(live(audio.clicks)).toHaveLength(4);
    expect(end).toHaveBeenCalledTimes(1);
    expect(m.running).toBe(false);
  });

  it('batida calada: sem som, mas a tela pulsa e o compasso não muda', () => {
    const audio = fakeAudio();
    const pulse = jest.fn();
    const m = new Metronome(audio.clock, pulse, jest.fn());
    // Cala o primeiro segundo (como a frase da troca de etapa).
    m.start(120, 0, { muted: (since) => since < 1000 });
    jest.advanceTimersByTime(3_000);
    const heard = live(audio.clicks);
    expect(heard[0]).toBeCloseTo(1.06, 6);
    expect(heard[1]).toBeCloseTo(1.56, 6);
    expect(pulse.mock.calls.length).toBeGreaterThanOrEqual(6);
    m.stop();
  });
});
