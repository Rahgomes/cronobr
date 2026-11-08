import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

test('a Início abre com a marca, o banco local e as modalidades em carrossel', async ({ page }) => {
  await page.goto('/');
  // No web o Image do RN vira div role=img com um <img> dentro: os dois têm o nome.
  await expect(page.getByRole('img', { name: 'CronôBR' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Modalidades' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Tabata: .*, 2 modelos$/ })).toBeVisible();
  await expectNoAxeViolations(page);
});

test('modalidade: foto, modelos prontos; "ver todas" abre a grade', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Boxe: / }).click();
  await expect(page.getByRole('heading', { name: 'Boxe' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Boxe iniciante, / })).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('button', { name: 'Ver todas' }).click();
  await expect(page.getByRole('heading', { name: 'Modalidades' })).toBeVisible();
  await expect(page.getByRole('button', { name: / modelos?$/ })).toHaveCount(8);
  await expectNoAxeViolations(page);
});

test('rota desconhecida mostra a página de não encontrado com saída', async ({ page }) => {
  await page.goto('/nao-existe');
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar ao início' }).click();
  await expect(page.getByRole('heading', { name: 'Modalidades' })).toBeVisible();
});
