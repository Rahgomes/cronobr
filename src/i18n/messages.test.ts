import { LANGUAGES } from '@/domain/appearance';
import { segmentTitle, phasePhrase } from '@/domain/cues';
import { checkRoutine } from '@/domain/limits';
import { PRESETS } from '@/domain/presets';
import { buildTimeline } from '@/domain/timeline';
import { readTransferFile } from '@/domain/transfer';
import { localizePreset, presetLibrary } from '@/features/routines/presets';
import { must, routine } from '@/test/domain';

import { en } from './messages/en';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { pt, type Messages } from './messages/pt';
import { PRESET_TEXT } from './presets';

const ALL: Record<string, Messages> = { pt, en, es, fr };

/** Argumentos que não são número nem texto (lista de nomes). */
const SAMPLES: Record<string, unknown[]> = { '.timers.finished': [['Ovo', 'Chá', 'Pão']] };

/** Cada folha: texto não vazio; função devolve texto não vazio com argumentos de exemplo. */
function leaves(value: unknown, path: string, out: [string, string][]) {
  if (typeof value === 'string') out.push([path, value]);
  else if (typeof value === 'function') {
    const fn = value as (...args: unknown[]) => unknown;
    const sample =
      SAMPLES[path] ?? Array.from({ length: fn.length }, (_, i) => (i % 2 ? 'Nome' : 2));
    out.push([path, String(fn(...sample))]);
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, inner] of Object.entries(value)) leaves(inner, `${path}.${key}`, out);
  }
}

describe('textos nas 4 línguas', () => {
  it.each(Object.entries(ALL))('%s: nenhum texto vazio nem "undefined"', (_, messages) => {
    const out: [string, string][] = [];
    leaves(messages, '', out);
    expect(out.length).toBeGreaterThan(90);
    for (const [path, text] of out) {
      expect([path, text.trim().length > 0]).toEqual([path, true]);
      expect([path, text.includes('undefined')]).toEqual([path, false]);
    }
  });

  it('as outras línguas não ficaram com o texto em português por engano', () => {
    const out: [string, string][] = [];
    leaves(pt, '', out);
    const ptTexts = new Set(out.map(([, text]) => text).filter((text) => text.length > 12));
    for (const messages of [en, fr]) {
      const theirs: [string, string][] = [];
      leaves(messages, '', theirs);
      const same = theirs.filter(([, text]) => ptTexts.has(text)).map(([path]) => path);
      expect(same).toEqual([]);
    }
  });

  it('mesmas mensagens do domínio em outra língua', () => {
    const check = checkRoutine(routine({ name: '' }), en.words);
    expect(check.ok ? '' : check.issues[0]?.message).toBe('Give the routine a name.');
    const read = readTransferFile('{"x":1}', 7, 0, fr.words);
    expect(read.ok ? '' : read.message).toBe('Ce fichier ne vient pas de CronôBR.');
    const timeline = buildTimeline(must(PRESETS.find((p) => p.id === 'mobilidade-manha')));
    const side = must(timeline.find((s) => s.side === 'right'));
    expect(segmentTitle(side, es.words)).toBe(`Ejercicio · ${String(side.name)}, lado derecho`);
    expect(phasePhrase(timeline, must(timeline[0]), en.words)).toMatch(/^Get ready\. Next: /);
  });
});

describe('modelos prontos', () => {
  it('cada texto dos modelos tem tradução em cada língua', () => {
    const texts = new Set<string>();
    for (const preset of PRESETS) {
      texts.add(preset.name);
      for (const block of preset.blocks) {
        texts.add(block.name);
        for (const step of block.steps) texts.add(step.name);
      }
    }
    for (const [language, table] of Object.entries(PRESET_TEXT)) {
      const missing = [...texts].filter((text) => !(text in table));
      expect([language, missing]).toEqual([language, []]);
    }
  });

  it('na língua escolhida; em português ficam como estão', () => {
    const tabata = must(PRESETS.find((p) => p.id === 'tabata-classic'));
    expect(localizePreset(tabata, 'pt-BR')).toBe(tabata);
    const en = must(presetLibrary('en').byId('tabata-classic'));
    expect(en.name).toBe('Classic Tabata');
    expect(en.blocks[0]?.steps.map((s) => s.name)).toEqual(['Exercise', 'Rest']);
    expect(
      presetLibrary('fr')
        .of('corrida')
        .map((p) => p.name),
    ).toEqual(['Cours 1, marche 1', 'Débuter la course']);
    expect(presetLibrary('es').modalities).toContain('mobilidade');
    expect(LANGUAGES).toHaveLength(4);
  });
});
