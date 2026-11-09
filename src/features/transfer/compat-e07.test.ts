// E07 C: rotina com cadência. O mesmo arquivo foi aberto pelo código anterior (commit 49ad67a,
// numa worktree): abriu sem erro, com os mesmos tempos, só sem o `bpm` (o z.object descarta
// campo desconhecido). Aqui o app de agora lê e mantém a cadência.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildTimeline } from '@/domain/timeline';
import { readTransferFile } from '@/domain/transfer';
import { pt } from '@/i18n/messages/pt';

// Caminho fixo do fixture no repositório.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const FILE = readFileSync(
  join(__dirname, '../../test/fixtures/rotina-cadencia-e07.cronobr'),
  'utf8',
);

it('rotina com cadência: o app de agora mantém o BPM de cada etapa', () => {
  const result = readTransferFile(FILE, FILE.length, 0, pt.words);
  if (!result.ok || result.file.kind !== 'routine') throw new Error('não abriu');
  expect(result.file.meta.schemaVersion).toBe(1);
  const timeline = buildTimeline(result.file.routine);
  expect(timeline.map((s) => s.bpm ?? null)).toEqual([null, 170, 110, 170, 110, 170, 110, 170]);
});
