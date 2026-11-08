import { pt } from '@/i18n/messages/pt';
import { block, clockAt, must, routine, step } from '@/test/domain';

import { planAlerts, MAX_ALERTS } from './alerts';
import {
  cuesFor,
  DEFAULT_CUE_PREFS,
  earlyRestCues,
  parseCuePrefs,
  phasePhrase,
  soundSlot,
  spokenDuration,
  type CuePrefs,
} from './cues';
import { createSession, pause, start } from './engine';
import type { SessionEvent } from './events';
import { presetById } from './presets';
import { buildTimeline } from './timeline';

const W = pt.words;

const TABATA = must(presetById('tabata-classic'));
const tabata = buildTimeline(TABATA);
const PREFS = DEFAULT_CUE_PREFS;

describe('frases', () => {
  it.each([
    [1000, '1 segundo'],
    [20_000, '20 segundos'],
    [60_000, '1 minuto'],
    [90_000, '1 minuto e 30 segundos'],
    [125_000, '2 minutos e 5 segundos'],
    [0, '0 segundos'],
  ])('%i ms = "%s"', (ms, text) => {
    expect(spokenDuration(ms, W)).toBe(text);
  });

  it('Tabata: preparar, vai com o tempo, descanso, e a última rodada avisada', () => {
    expect(phasePhrase(tabata, must(tabata[0]), W)).toBe('Preparar');
    expect(phasePhrase(tabata, must(tabata[1]), W)).toBe('Vai, 20 segundos');
    expect(phasePhrase(tabata, must(tabata[2]), W)).toBe('Descanso');
    const lastWork = must(tabata.at(-1));
    expect(phasePhrase(tabata, lastWork, W)).toBe('Última rodada. Vai, 20 segundos');
  });

  it('etapas com nome: anuncia o exercício e o próximo no descanso e na preparação', () => {
    const timeline = buildTimeline(
      routine({
        prepSeconds: 5,
        cooldownSeconds: 30,
        blocks: [
          block({
            repeat: 2,
            restAfterSeconds: 15,
            steps: [
              step({ kind: 'work', name: 'Agachamento', seconds: 40 }),
              step({ kind: 'rest', name: 'Descanso', seconds: 10 }),
              step({ kind: 'work', name: 'Flexão', seconds: null, reps: 12 }),
            ],
          }),
          block({ repeat: 1, steps: [step({ kind: 'work', name: 'Prancha', seconds: 60 })] }),
        ],
      }),
    );
    const said = timeline.map((s) => phasePhrase(timeline, s, W));
    expect(said).toEqual([
      'Preparar. Próximo: Agachamento',
      'Agachamento, 40 segundos',
      'Descanso. Próximo: Flexão',
      'Flexão, 12 repetições',
      'Última rodada. Agachamento, 40 segundos',
      'Descanso. Próximo: Flexão',
      'Flexão, 12 repetições',
      'Descanso entre blocos',
      'Prancha, 1 minuto',
      'Desaquecimento',
    ]);
  });

  it('descanso no fim sem trabalho depois e repetições sem número', () => {
    const timeline = buildTimeline(
      routine({
        blocks: [
          block({
            repeat: 1,
            steps: [step({ kind: 'work', name: 'Remada', seconds: null, reps: null })],
          }),
        ],
        cooldownSeconds: 0,
      }),
    );
    expect(phasePhrase(timeline, must(timeline[0]), W)).toBe('Remada, 0 repetições');
    const rest = { ...must(timeline[0]), phase: 'rest' as const, name: 'Descanso' };
    expect(phasePhrase(timeline, rest, W)).toBe('Descanso');
  });

  it('descanso entre blocos e desaquecimento soam como descanso', () => {
    expect(soundSlot('blockRest')).toBe('rest');
    expect(soundSlot('cooldown')).toBe('rest');
    expect(soundSlot('prep')).toBe('prep');
  });
});

describe('avisos por leitura', () => {
  const phase = (segment: number): SessionEvent => ({
    type: 'phase',
    segment,
    phase: must(tabata[segment]).phase,
    late: false,
  });

  it('troca de etapa: som da fase, frase e vibração', () => {
    expect(cuesFor([phase(1)], tabata, PREFS, W)).toEqual({
      sound: 'bell',
      speech: 'Vai, 20 segundos',
      haptic: 'phase',
    });
    expect(cuesFor([phase(2)], tabata, PREFS, W).sound).toBe('whistle');
  });

  it('contagem: beep curto e pulso, sem fala; desligada não toca', () => {
    const tick: SessionEvent = { type: 'countdown', segment: 1, value: 2 };
    expect(cuesFor([tick], tabata, PREFS, W)).toEqual({
      sound: 'beepShort',
      speech: null,
      haptic: 'tick',
    });
    expect(cuesFor([tick], tabata, { ...PREFS, countdown: false }, W)).toEqual({
      sound: null,
      speech: null,
      haptic: null,
    });
  });

  it('metade só fala; conclusão tem som, frase e vibração próprios', () => {
    expect(cuesFor([{ type: 'halfway', segment: 1 }], tabata, PREFS, W)).toEqual({
      sound: null,
      speech: 'Metade',
      haptic: null,
    });
    expect(cuesFor([{ type: 'completed' }], tabata, PREFS, W)).toEqual({
      sound: 'finish',
      speech: 'Treino concluído',
      haptic: 'finish',
    });
  });

  it('vários eventos na mesma leitura: vale o mais importante, um de cada canal', () => {
    const many: SessionEvent[] = [
      { type: 'countdown', segment: 1, value: 1 },
      phase(2),
      { type: 'halfway', segment: 2 },
    ];
    expect(cuesFor(many, tabata, PREFS, W).speech).toBe('Descanso');
    expect(cuesFor([phase(2), { type: 'completed' }], tabata, PREFS, W).speech).toBe(
      'Treino concluído',
    );
  });

  it('canais independentes: cada chave desliga só o seu', () => {
    const off = (over: Partial<CuePrefs>) => cuesFor([phase(1)], tabata, { ...PREFS, ...over }, W);
    expect(off({ sound: false })).toEqual({
      sound: null,
      speech: 'Vai, 20 segundos',
      haptic: 'phase',
    });
    expect(off({ voice: false }).speech).toBeNull();
    expect(off({ vibration: false }).haptic).toBeNull();
  });

  it('fase atrasada (volta de suspensão): silêncio, a notificação já avisou', () => {
    const late: SessionEvent = { type: 'phase', segment: 1, phase: 'work', late: true };
    expect(cuesFor([late], tabata, PREFS, W)).toEqual({ sound: null, speech: null, haptic: null });
  });

  it('nada a avisar: lista vazia ou etapa que não existe', () => {
    expect(cuesFor([], tabata, PREFS, W)).toEqual({ sound: null, speech: null, haptic: null });
    expect(
      cuesFor([{ type: 'phase', segment: 99, phase: 'work', late: false }], tabata, PREFS, W),
    ).toEqual({ sound: null, speech: null, haptic: null });
  });
});

describe('avisos agendados (app fora da tela)', () => {
  const T0 = clockAt(0);
  const running = start(createSession('s', TABATA), tabata, T0);

  it('cada troca futura no relógio civil, com som da fase e conclusão no fim', () => {
    const plan = planAlerts(running, tabata, clockAt(4_000), PREFS, W);
    expect(plan).toHaveLength(tabata.length);
    expect(plan[0]).toEqual({
      at: T0.wall + 10_000,
      segment: 1,
      title: 'Vai, 20 segundos',
      body: 'Rodada 1 de 8 · Tabata clássico',
      sound: 'bell',
    });
    expect(plan[1]).toMatchObject({ at: T0.wall + 30_000, title: 'Descanso', sound: 'whistle' });
    expect(plan.at(-1)).toEqual({
      at: T0.wall + 240_000,
      segment: null,
      title: 'Treino concluído',
      body: 'Tabata clássico',
      sound: 'finish',
    });
  });

  it('respeita o teto do sistema e o som desligado', () => {
    const plan = planAlerts(running, tabata, T0, { ...PREFS, sound: false }, W, 3);
    expect(plan).toHaveLength(3);
    expect(plan.every((a) => a.sound === null)).toBe(true);
    expect(MAX_ALERTS).toBeLessThan(64);
  });

  it('para numa etapa manual: o fim dela depende da pessoa', () => {
    const r = routine({
      prepSeconds: 5,
      blocks: [
        block({
          repeat: 1,
          steps: [
            step({ kind: 'work', name: 'Flexão', seconds: null, reps: 10 }),
            step({ kind: 'work', name: 'Prancha', seconds: 30 }),
          ],
        }),
      ],
    });
    const timeline = buildTimeline(r);
    const plan = planAlerts(start(createSession('m', r), timeline, T0), timeline, T0, PREFS, W);
    expect(plan.map((a) => a.title)).toEqual(['Flexão, 10 repetições']);
    expect(plan[0]?.body).toBe('Exercício · Teste');
  });

  it('etapas fora das rodadas levam o nome da fase', () => {
    const r = routine({ cooldownSeconds: 10, blocks: [block({ repeat: 1 })] });
    const timeline = buildTimeline(r);
    const plan = planAlerts(start(createSession('c', r), timeline, T0), timeline, T0, PREFS, W);
    expect(plan.map((a) => a.body)).toEqual(['Desaquecimento · Teste', 'Teste']);
  });

  it('pausada, parada, terminada ou numa etapa manual: nada a agendar', () => {
    expect(planAlerts(createSession('s', TABATA), tabata, T0, PREFS, W)).toEqual([]);
    expect(planAlerts(pause(running, tabata, clockAt(1_000)), tabata, T0, PREFS, W)).toEqual([]);
    expect(planAlerts(running, tabata, clockAt(999_000), PREFS, W)).toEqual([]);
    const manual = routine({
      blocks: [block({ repeat: 1, steps: [step({ kind: 'work', seconds: null, reps: 5 })] })],
    });
    const mt = buildTimeline(manual);
    expect(planAlerts(start(createSession('x', manual), mt, T0), mt, T0, PREFS, W)).toEqual([]);
  });
});

describe('preferências gravadas', () => {
  it('ausentes ou estragadas voltam ao padrão, campo a campo', () => {
    expect(parseCuePrefs(undefined)).toEqual(PREFS);
    expect(parseCuePrefs('lixo')).toEqual(PREFS);
    expect(parseCuePrefs({ voice: false, sounds: { work: 'gong', rest: 'trompete' } })).toEqual({
      ...PREFS,
      voice: false,
      sounds: { ...PREFS.sounds, work: 'gong' },
    });
    expect(parseCuePrefs({ sound: 'sim', sounds: null }).sound).toBe(true);
  });

  it('válidas passam inteiras', () => {
    const mine: CuePrefs = {
      sound: false,
      voice: true,
      vibration: false,
      countdown: false,
      sounds: { prep: 'gong', work: 'whistle', rest: 'beepLong', finish: 'bell' },
    };
    expect(parseCuePrefs(mine)).toEqual(mine);
  });
});

describe('EMOM terminado antes', () => {
  it('soa e fala descanso, respeitando cada canal', () => {
    expect(earlyRestCues(DEFAULT_CUE_PREFS, W)).toEqual({
      sound: 'whistle',
      speech: 'Descanso',
      haptic: 'phase',
    });
    expect(
      earlyRestCues({ ...DEFAULT_CUE_PREFS, sound: false, voice: false, vibration: false }, W),
    ).toEqual({ sound: null, speech: null, haptic: null });
  });
});
