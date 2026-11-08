import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

test('temporizador: ajustar, nomear e cair na prévia certa', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Temporizador' }).click();
  await expect(page.getByRole('heading', { name: 'Temporizador' })).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Aumentar Minutos' }).click();
  await page.getByLabel('Nome (opcional)').fill('Prancha');
  await page.getByRole('button', { name: 'Começar 6:00' }).click();
  await expect(page.getByRole('heading', { name: 'Prancha' })).toBeVisible();
  await expect(page.getByText('Duração total: 6:00')).toBeVisible();
});

test('intervalado: total na tela e lembrado na volta', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Intervalado' }).click();
  await expect(page.getByRole('heading', { name: 'Intervalado' })).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Diminuir Rodadas' }).click();
  // 10 + 7 × 30 + 6 × 15
  await page.getByRole('button', { name: 'Começar 5:10' }).click();
  await expect(page.getByText('Duração total: 5:10')).toBeVisible();
  await page.goto('/intervalado');
  await expect(page.getByRole('button', { name: 'Começar 5:10' })).toBeVisible();
});

test('cronômetro: conta, marca volta e segue depois de recarregar', async ({ page }) => {
  await page.clock.install({ time: Date.parse('2026-11-08T10:00:00-03:00') });
  await page.goto('/cronometro');
  await expect(page.getByRole('heading', { name: 'Cronômetro' })).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await page.clock.runFor(30_000);
  await page.getByRole('button', { name: 'Marcar volta' }).click();
  await expect(page.getByText('Volta 1', { exact: true })).toBeVisible();
  await page.clock.runFor(10_000);
  await page.reload();
  await expect(page.getByText('Volta 1', { exact: true })).toBeVisible();
  await page.clock.runFor(1_000);
  await expect(page.getByRole('timer')).toHaveText(/^0:4\d\.\d$/);
});
