import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

test('editor: copiar um modelo, ajustar, salvar e achar na Início depois de recarregar', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Tabata: / }).click();
  await page.getByRole('button', { name: 'Opções de Tabata clássico' }).click();
  await page.getByRole('button', { name: 'Editar uma cópia' }).click();
  await expect(page.getByRole('heading', { name: 'Nova rotina' })).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByLabel('Nome da rotina').fill('Tabata da manhã');
  await page.getByRole('button', { name: 'Rodadas, 8 rodadas. Editar bloco' }).click();
  await page.getByRole('button', { name: 'Diminuir Rodadas' }).click();
  await expect(page.getByText('A rotina precisa de pelo menos um bloco.')).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Fechar' }).click();
  await expect(
    page.getByRole('button', { name: 'Rodadas, 7 rodadas. Editar bloco' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.goto('/');
  await page.reload();
  await expect(page.getByText('Suas rotinas')).toBeVisible();
  await page.getByRole('button', { name: 'Opções de Tabata da manhã' }).click();
  await page.getByRole('button', { name: 'Favoritar' }).click();
  await expect(page.getByText('Favoritas')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Favoritas')).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^Tabata da manhã, .*, favorita$/ }).first(),
  ).toBeVisible();
});

test('editor: sair sem salvar guarda rascunho e recupera', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Modalidades' })).toBeVisible();
  await page.getByRole('button', { name: 'Nova rotina' }).click();
  await expect(page.getByRole('heading', { name: 'Nova rotina' })).toBeVisible();
  await page.getByLabel('Nome da rotina').fill('Meio feito');
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page.getByRole('heading', { name: 'Sair do editor?' })).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Sair e guardar rascunho' }).click();
  await expect(page.getByRole('heading', { name: 'Modalidades' })).toBeVisible();
  await page.getByRole('button', { name: 'Nova rotina' }).click();
  await expect(page.getByLabel('Nome da rotina')).toHaveValue('Meio feito');
  await expect(page.getByText(/Rascunho recuperado/)).toBeVisible();
});
