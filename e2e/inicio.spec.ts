import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

test('a Início abre com a marca, o banco local e as rotinas prontas', async ({ page }) => {
  await page.goto('/');
  // No web o Image do RN vira div role=img com um <img> dentro: os dois têm o nome.
  await expect(page.getByRole('img', { name: 'CronôBR' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Escolha um treino' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Tabata clássico, 4:00 · 8 exercícios' }),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

test('rota desconhecida mostra a página de não encontrado com saída', async ({ page }) => {
  await page.goto('/nao-existe');
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar ao início' }).click();
  await expect(page.getByRole('heading', { name: 'Escolha um treino' })).toBeVisible();
});
