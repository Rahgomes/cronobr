// E06 lote E: dados de antes continuam iguais. O arquivo foi gravado pelo código da E05
// (commit fbb30cf, sem a chave `aparencia`); o app de agora lê, restaura e grava de novo igual.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildTimeline } from '@/domain/timeline';
import { readTransferFile } from '@/domain/transfer';
import { replaceOps } from '@/domain/transfer-plan';
import { pt } from '@/i18n/messages/pt';
import { appRepos } from '@/test/app';

import { PORTABLE_PREF_KEYS } from './portable-prefs';
import { backupText } from './transfer-actions';

// Caminho fixo do fixture no repositório.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const FILE = readFileSync(join(__dirname, '../../test/fixtures/backup-e05.cronobr'), 'utf8');
const NOW = Date.parse('2026-11-09T12:00:00-03:00');

function read(text: string) {
  const result = readTransferFile(text, text.length, NOW, pt.words);
  if (!result.ok || result.file.kind !== 'backup') throw new Error('backup não lido');
  return result.file;
}

it('backup da E05: lê, restaura e mantém rotinas, histórico e preferências', async () => {
  const file = read(FILE);
  const { repos } = await appRepos();
  await repos.transfer.apply(replaceOps(file), PORTABLE_PREF_KEYS, null);

  const [mine] = await repos.routines.list();
  expect(mine?.name).toBe('Tabata da manhã ☀️');
  expect(mine && buildTimeline(mine)).toHaveLength(16);

  const { entries } = await repos.history.page({ limit: 10 });
  expect(entries.map((e) => [e.id, e.status, e.note ?? null, e.rounds ?? null])).toEqual([
    ['h1', 'completed', 'Pesado hoje', null],
    ['h2', 'interrupted', null, 4],
  ]);

  expect(await repos.prefs.get('favoritos')).toEqual(['minha-1']);
  expect(await repos.prefs.get('sessao')).toEqual({ view: 'lista', lockOnStart: false });
  expect(await repos.prefs.get('avisos')).toMatchObject({ voice: false });
  // Sem `aparencia` no arquivo: tema e idioma seguem o aparelho.
  expect(await repos.prefs.get('aparencia')).toBeUndefined();
});

it('backup da E05 gravado de novo pelo app de agora: mesmo conteúdo', async () => {
  const before = read(FILE);
  const { repos } = await appRepos();
  await repos.transfer.apply(replaceOps(before), PORTABLE_PREF_KEYS, null);
  const after = read(await backupText(repos, true, NOW));
  expect(after.routines).toEqual(before.routines);
  expect(after.history).toEqual(before.history);
  expect(after.prefs).toEqual(before.prefs);
});
