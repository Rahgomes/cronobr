import {
  beatSeconds,
  BPM_MAX,
  BPM_MIN,
  clampBpm,
  fill,
  LEAD_S,
  measureJitter,
  METRONOME_START,
  parseMetronome,
  retime,
  startCursor,
  type Marked,
} from './metronome';

describe('metrônomo, parte pura', () => {
  it('BPM preso na faixa e arredondado; passo em segundos', () => {
    expect(clampBpm(10)).toBe(BPM_MIN);
    expect(clampBpm(999)).toBe(BPM_MAX);
    expect(clampBpm(119.6)).toBe(120);
    expect(beatSeconds(120)).toBe(0.5);
    expect(beatSeconds(240)).toBe(0.25);
  });

  it('leitura tolerante do gravado', () => {
    expect(parseMetronome(undefined)).toEqual(METRONOME_START);
    expect(parseMetronome({ bpm: 'x', offsetMs: Number.NaN })).toEqual(METRONOME_START);
    expect(parseMetronome({ bpm: 300, offsetMs: 133 })).toEqual({ bpm: 240, offsetMs: 140 });
    expect(parseMetronome({ bpm: 20, offsetMs: 9999 })).toEqual({ bpm: 30, offsetMs: 400 });
    expect(parseMetronome({ bpm: 75, offsetMs: -40 })).toEqual({ bpm: 75, offsetMs: 0 });
  });

  it('marca as batidas do horizonte, no passo exato, e continua de onde parou', () => {
    const first = fill(startCursor(10), 10, 1, 120);
    expect(first.beats.map((b) => b.at)).toEqual([10 + LEAD_S, 10.56]);
    expect(first.missed).toBe(0);
    const second = fill(first.cursor, 10.3, 1, 120);
    expect(second.beats).toEqual([{ at: 11.06, index: 2 }]);
  });

  it('laço atrasado: não toca batida vencida nem em rajada, pula no mesmo passo', () => {
    // A próxima era 10,5; o laço só voltou em 11,2: 10,5 e 11,0 passaram.
    const late = fill({ at: 10.5, index: 3 }, 11.2, 0.4, 120);
    expect(late.missed).toBe(2);
    expect(late.beats).toEqual([{ at: 11.5, index: 5 }]);
  });

  it('prévia para no limite', () => {
    const preview = fill(startCursor(0), 0, 10, 240, 4);
    expect(preview.beats.map((b) => b.index)).toEqual([0, 1, 2, 3]);
    expect(fill(preview.cursor, 2, 10, 240, 4).beats).toEqual([]);
  });

  it('troca de BPM: a próxima vem um passo novo depois da última tocada, nunca no passado', () => {
    expect(retime(10, 4, 10.1, 60)).toEqual({ at: 11, index: 4 });
    expect(retime(8, 4, 10, 60)).toEqual({ at: 10 + LEAD_S, index: 4 });
    expect(retime(null, 0, 5, 60)).toEqual({ at: 5 + LEAD_S, index: 0 });
  });

  it('mede variação entre batidas e folga de marcação', () => {
    expect(measureJitter([], 120)).toEqual({
      beats: 0,
      maxDeviationMs: 0,
      minSlackMs: 0,
      late: 0,
    });
    const marked: Marked[] = [
      { at: 1, markedAt: 0.9 },
      { at: 1.5, markedAt: 0.9 },
      { at: 2.003, markedAt: 2.01 },
    ];
    expect(measureJitter(marked, 120)).toEqual({
      beats: 3,
      maxDeviationMs: 3,
      minSlackMs: -7,
      late: 1,
    });
  });
});
