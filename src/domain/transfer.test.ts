import { pt } from '@/i18n/messages/pt';
import { block, must, routine, step } from '@/test/domain';

import type { HistoryEntry } from './history';
import { presetById } from './presets';
import type { Routine } from './routine';
import {
  backupFileText,
  fileName,
  fingerprint,
  MAX_FILE_BYTES,
  readTransferFile,
  routineFileText,
  SCHEMA_VERSION,
  type TransferFile,
} from './transfer';

const W = pt.words;

const NOW = Date.UTC(2026, 10, 8, 13, 0);
const bytes = (text: string) => new TextEncoder().encode(text).length;
const read = (text: string, now = NOW) => readTransferFile(text, bytes(text), now, W);

function ok(text: string): TransferFile {
  const result = read(text);
  if (!result.ok) throw new Error(`${result.message} ${result.details.join(' | ')}`);
  return result.file;
}

// Tudo que a rotina pode ter: blocos, repetições, etapa manual, desativada, lados, EMOM, Unicode.
const rich: Routine = routine({
  id: 'r-rica',
  name: 'Perna 💪 com ção e "aspas"',
  modality: 'circuito',
  version: 3,
  prepSeconds: 15,
  cooldownSeconds: 120,
  createdAt: Date.UTC(2026, 9, 1, 10),
  updatedAt: Date.UTC(2026, 10, 2, 18, 30),
  blocks: [
    block({
      id: 'b1',
      name: 'Aquecimento',
      repeat: 2,
      restAfterSeconds: 60,
      steps: [
        step({ id: 's1', kind: 'work', name: 'Polichinelo', seconds: 30 }),
        step({ id: 's2', kind: 'work', name: 'Agachamento', seconds: null, reps: 12 }),
        step({ id: 's3', kind: 'rest', name: 'Respira', seconds: 15 }),
      ],
    }),
    block({
      id: 'b2',
      name: 'Principal',
      repeat: 4,
      steps: [
        step({ id: 's4', kind: 'work', name: 'Avanço', seconds: 40, sides: true }),
        step({ id: 's5', kind: 'work', name: 'Burpee', seconds: 60, early: true }),
        step({ id: 's6', kind: 'work', name: 'Prancha', seconds: 30, disabled: true }),
      ],
    }),
  ],
});

const entry: HistoryEntry = {
  id: 'h1',
  routine: rich,
  status: 'interrupted',
  startedAt: Date.UTC(2026, 10, 7, 9, 0),
  endedAt: Date.UTC(2026, 10, 7, 9, 31),
  activeMs: 1_812_345,
  workDone: 5,
  workTotal: 16,
  source: 'app',
  adjusted: true,
  rounds: 0,
  note: 'Joelho 🦵 doeu',
};

describe('rotina compartilhada', () => {
  it('ida e volta preserva tempos, ordem, blocos, repetições e Unicode', () => {
    const file = ok(routineFileText(rich, '2.0.0', NOW));
    expect(file.kind).toBe('routine');
    // Sem datas nem origem no arquivo: entra como rotina própria, criada agora.
    expect(file).toMatchObject({
      routine: { ...rich, origin: 'custom', createdAt: NOW, updatedAt: NOW },
    });
  });

  it('leva só o necessário: sem datas, origem, histórico ou preferências', () => {
    const raw = JSON.parse(routineFileText(rich, '2.0.0', NOW)) as Record<string, unknown>;
    expect(Object.keys(raw).sort()).toEqual(
      ['appVersion', 'exportedAt', 'format', 'kind', 'routine', 'schemaVersion'].sort(),
    );
    expect(raw).toMatchObject({
      format: 'cronobr',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-11-08T13:00:00.000Z',
    });
    const body = raw.routine as Record<string, unknown>;
    expect(body).not.toHaveProperty('createdAt');
    expect(body).not.toHaveProperty('origin');
    // Tempo com unidade no nome do campo.
    expect(body).toHaveProperty('prepSeconds', 15);
  });

  it('nome de 60 letras e modelo pronto passam inteiros', () => {
    const long = routine({ name: 'x'.repeat(60) });
    expect(ok(routineFileText(long, '2.0.0', NOW))).toMatchObject({ routine: { name: long.name } });
    const tabata = must(presetById('tabata-classic'));
    expect(ok(routineFileText(tabata, '2.0.0', NOW))).toMatchObject({
      routine: { blocks: tabata.blocks, origin: 'custom' },
    });
  });
});

describe('backup', () => {
  const prefs = { avisos: { voice: false }, favoritos: ['r-rica'] };

  it('com histórico: tudo volta com o mesmo significado', () => {
    const text = backupFileText({ routines: [rich], prefs, history: [entry] }, '2.0.0', NOW);
    expect(ok(text)).toEqual({
      kind: 'backup',
      meta: { schemaVersion: 1, appVersion: '2.0.0', exportedAt: '2026-11-08T13:00:00.000Z' },
      routines: [rich],
      prefs,
      history: [entry],
    });
  });

  it('registro sem marca, rodadas nem nota volta sem esses campos', () => {
    const plain: HistoryEntry = { ...entry, id: 'h2', status: 'completed' };
    delete plain.adjusted;
    delete plain.rounds;
    delete plain.note;
    const text = backupFileText({ routines: [], prefs: {}, history: [plain] }, '2.0.0', NOW);
    expect(ok(text)).toMatchObject({ history: [plain] });
    const [back] = (ok(text) as { history: HistoryEntry[] }).history;
    expect(Object.keys(must(back))).not.toContain('note');
  });

  it('sem histórico: o arquivo não tem a chave e volta null', () => {
    const text = backupFileText({ routines: [rich], prefs, history: null }, '2.0.0', NOW);
    expect(JSON.parse(text)).not.toHaveProperty('history');
    expect(ok(text)).toMatchObject({ history: null });
  });

  it('datas interoperáveis: ISO 8601 em UTC no arquivo', () => {
    const raw = JSON.parse(
      backupFileText({ routines: [rich], prefs: {}, history: [entry] }, '2.0.0', NOW),
    ) as { routines: { createdAt: string }[]; history: { endedAt: string }[] };
    expect(raw.routines[0]?.createdAt).toBe('2026-10-01T10:00:00.000Z');
    expect(raw.history[0]?.endedAt).toBe('2026-11-07T09:31:00.000Z');
  });

  it('arquivo mínimo de uma versão anterior do app (sem campos opcionais) abre', () => {
    const text = JSON.stringify({
      format: 'cronobr',
      schemaVersion: 1,
      appVersion: '2.0.0',
      exportedAt: '2026-11-01T10:00:00Z',
      kind: 'backup',
      routines: [
        {
          id: 'a',
          name: 'Antiga',
          modality: 'hiit',
          version: 1,
          origin: 'custom',
          prepSeconds: 0,
          cooldownSeconds: 0,
          createdAt: '2026-11-01T10:00:00-03:00',
          updatedAt: '2026-11-01T10:00:00-03:00',
          blocks: [
            {
              id: 'b',
              name: 'B',
              repeat: 1,
              restAfterSeconds: 0,
              steps: [{ id: 's', name: 'S', kind: 'work', seconds: 20, reps: null }],
            },
          ],
          campoNovoQueEstaVersaoNaoConhece: true,
        },
      ],
      preferences: {},
    });
    const file = ok(text);
    expect(file).toMatchObject({
      history: null,
      routines: [{ id: 'a', createdAt: Date.UTC(2026, 10, 1, 13) }],
    });
    expect(file.kind === 'backup' && file.routines[0]).not.toHaveProperty(
      'campoNovoQueEstaVersaoNaoConhece',
    );
  });
});

describe('arquivos recusados antes de mexer em qualquer dado', () => {
  const good = routineFileText(rich, '2.0.0', NOW);

  it('grande demais: recusa pelo tamanho, sem ler', () => {
    expect(readTransferFile('{}', MAX_FILE_BYTES + 1, NOW, W)).toMatchObject({
      ok: false,
      reason: 'tooBig',
    });
  });

  it('truncado ou que não é JSON', () => {
    expect(read(good.slice(0, good.length / 2))).toMatchObject({ ok: false, reason: 'notJson' });
    expect(read('')).toMatchObject({ ok: false, reason: 'notJson' });
  });

  it('JSON de outro app', () => {
    expect(read('{"a":1}')).toMatchObject({ ok: false, reason: 'notCronobr' });
    expect(read('[1,2]')).toMatchObject({ ok: false, reason: 'notCronobr' });
    expect(read('null')).toMatchObject({ ok: false, reason: 'notCronobr' });
  });

  it('do CronôBR com cabeçalho estragado', () => {
    expect(read('{"format":"cronobr","schemaVersion":"1"}')).toMatchObject({
      ok: false,
      reason: 'invalid',
    });
  });

  it('versão futura pede atualizar; versão zero é desconhecida', () => {
    const future = good.replace('"schemaVersion":1', '"schemaVersion":2');
    const result = read(future);
    expect(result).toMatchObject({ ok: false, reason: 'newerVersion' });
    expect(!result.ok && result.message).toContain('versão mais nova');
    expect(read(good.replace('"schemaVersion":1', '"schemaVersion":0'))).toMatchObject({
      ok: false,
      reason: 'olderVersion',
    });
  });

  it('tipos errados e rotina acima dos limites do editor', () => {
    expect(read(good.replace('"prepSeconds":15', '"prepSeconds":"15"'))).toMatchObject({
      ok: false,
      reason: 'invalid',
    });
    const huge = read(good.replace('"repeat":4', '"repeat":500'));
    expect(huge).toMatchObject({ ok: false, reason: 'invalid' });
    expect(!huge.ok && huge.details[0]).toContain('99 rodadas');
  });

  it('backup com rotina acima do limite ou id repetido não aproveita nada', () => {
    const backup = (routines: Routine[]) =>
      read(backupFileText({ routines, prefs: {}, history: null }, '2.0.0', NOW));
    expect(backup([rich, routine({ id: 'x', name: '' })])).toMatchObject({
      ok: false,
      reason: 'invalid',
    });
    const twice = backup([rich, { ...rich, name: 'Outra' }]);
    expect(twice).toMatchObject({ ok: false, message: 'O backup tem rotinas repetidas.' });
  });

  it('modalidade desconhecida e data que não é data', () => {
    expect(read(good.replace('"modality":"circuito"', '"modality":"natacao"'))).toMatchObject({
      ok: false,
    });
    const text = backupFileText({ routines: [rich], prefs: {}, history: null }, '2.0.0', NOW);
    expect(read(text.replace('2026-10-01T10:00:00.000Z', 'ontem'))).toMatchObject({ ok: false });
  });
});

describe('nome do arquivo e impressão do conteúdo', () => {
  it('nome sem acento, símbolo nem espaço; vazio vira "rotina"', () => {
    expect(fileName('Treino de Perna: ção! 💪')).toBe('treino-de-perna-cao.cronobr');
    expect(fileName('💪💪')).toBe('rotina.cronobr');
    expect(fileName('a'.repeat(80))).toBe(`${'a'.repeat(40)}.cronobr`);
  });

  it('mesmo treino com ids e datas diferentes tem a mesma impressão', () => {
    const copy: Routine = {
      ...rich,
      id: 'outro',
      createdAt: 1,
      version: 9,
      blocks: rich.blocks.map((b, i) => ({
        ...b,
        id: `x${String(i)}`,
        steps: b.steps.map((s, j) => ({ ...s, id: `y${String(j)}` })),
      })),
    };
    expect(fingerprint(copy)).toBe(fingerprint(rich));
    const changed = { ...rich, prepSeconds: 16 };
    expect(fingerprint(changed)).not.toBe(fingerprint(rich));
  });
});
