/// <reference types="node" />
// Ler o download e montar o arquivo do seletor pede as APIs do Node do próprio Playwright.
import { expect, test, type Download, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

// Backup e transferência (E05) na prévia web: o arquivo sai como download e entra pelo seletor
// do navegador. O arquivo de teste é escrito à mão, seguindo docs/spec/formato-cronobr.md.

const step = (id: string, name: string, kind: 'work' | 'rest', seconds: number) => ({
  id,
  name,
  kind,
  seconds,
  reps: null,
});

const pernas = {
  id: 'pernas-e2e',
  name: 'Pernas 🦵 ção',
  modality: 'circuito',
  version: 1,
  prepSeconds: 10,
  cooldownSeconds: 0,
  blocks: [
    {
      id: 'b1',
      name: 'Bloco A',
      repeat: 3,
      restAfterSeconds: 30,
      steps: [step('s1', 'Agachamento', 'work', 40), step('s2', 'Pausa', 'rest', 20)],
    },
  ],
};

const routineFile = JSON.stringify({
  format: 'cronobr',
  schemaVersion: 1,
  appVersion: '2.0.0',
  exportedAt: '2026-11-08T12:00:00.000Z',
  kind: 'routine',
  routine: pernas,
});

const backupFile = JSON.stringify({
  format: 'cronobr',
  schemaVersion: 1,
  appVersion: '2.0.0',
  exportedAt: '2026-11-08T12:00:00.000Z',
  kind: 'backup',
  routines: [
    {
      ...pernas,
      id: 'bracos-e2e',
      name: 'Braços do backup',
      origin: 'custom',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    },
  ],
  preferences: { sessao: { view: 'foco', lockOnStart: false } },
});

async function textOf(download: Download): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

/** Backup fica em Ajustes desde a E06 D (a Início ficou só com a engrenagem). */
async function goToBackup(page: Page) {
  await page.getByRole('button', { name: 'Ajustes' }).click();
  await page.getByRole('button', { name: 'Backup e transferência' }).click();
}

async function openBackup(page: Page) {
  await page.goto('/');
  await goToBackup(page);
  await expect(page.getByRole('heading', { name: 'Exportar backup' })).toBeVisible();
}

async function chooseFile(page: Page, name: string, text: string) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Abrir arquivo' }).click();
  await (
    await chooser
  ).setFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(text, 'utf8'),
  });
}

test('importar uma rotina: prévia, adicionar e achar na Início', async ({ page }) => {
  await openBackup(page);
  await expectNoAxeViolations(page);
  await chooseFile(page, 'pernas.cronobr', routineFile);
  await expect(page.getByRole('heading', { name: 'Pernas 🦵 ção' })).toBeVisible();
  await expect(page.getByText(/^Circuito · /)).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Adicionar à biblioteca' }).click();
  await expect(page.getByText(/está na sua biblioteca/)).toBeVisible();
  await page.getByRole('button', { name: 'Ir para o início' }).click();
  await expect(page.getByRole('button', { name: /^Pernas 🦵 ção, / })).toBeVisible();

  // Compartilhar de volta: sai um arquivo só com a rotina.
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Opções de Pernas 🦵 ção' }).click();
  await page.getByRole('button', { name: 'Compartilhar' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('pernas-cao.cronobr');
  const shared = JSON.parse(await textOf(file)) as Record<string, unknown>;
  expect(shared).toMatchObject({ format: 'cronobr', kind: 'routine', routine: pernas });
});

test('exportar backup, restaurar outro por cima e desfazer', async ({ page }) => {
  await openBackup(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^cronobr-backup-\d{4}-\d{2}-\d{2}\.cronobr$/);
  expect(JSON.parse(await textOf(file))).toMatchObject({
    format: 'cronobr',
    kind: 'backup',
    routines: [],
    history: [],
  });

  await chooseFile(page, 'backup.cronobr', backupFile);
  await expect(page.getByText('• 1 rotina nova')).toBeVisible();
  await expect(page.getByText('• Sem histórico')).toBeVisible();
  await page.getByRole('button', { name: 'Substituir tudo' }).click();
  await expect(page.getByRole('heading', { name: 'Substituir tudo?' })).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Substituir', exact: true }).click();
  await expect(page.getByText(/O backup foi restaurado/)).toBeVisible();

  await page.getByRole('button', { name: 'Ir para o início' }).click();
  await expect(page.getByRole('button', { name: /^Braços do backup, / })).toBeVisible();
  // Persistiu: recarregar mantém.
  await page.reload();
  await expect(page.getByRole('button', { name: /^Braços do backup, / })).toBeVisible();

  await goToBackup(page);
  await page.getByRole('button', { name: 'Voltar ao estado anterior' }).click();
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.getByText(/tudo voltou a como estava antes/)).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Braços do backup, / })).toBeHidden();
});

test('arquivo que não é do CronôBR é recusado sem mudar nada', async ({ page }) => {
  await openBackup(page);
  await chooseFile(page, 'foto.cronobr', '{"isto":"não é do app"}');
  await expect(page.getByText('Este arquivo não é do CronôBR.')).toBeVisible();
  await expectNoAxeViolations(page);
});
