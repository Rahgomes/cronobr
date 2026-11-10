import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

test('temporizador: ajustar, nomear e cair na prévia certa', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Temporizador', exact: true }).click();
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

test('valores digitados à mão: minutos e segundos, limite explicado, sem violação', async ({
  page,
}) => {
  await page.goto('/intervalado');
  await expect(page.getByRole('heading', { name: 'Intervalado' })).toBeVisible();
  // + e − andam 1 segundo.
  await page.getByRole('button', { name: 'Aumentar Exercício' }).click();
  await expect(page.getByRole('button', { name: 'Exercício: 0:31' })).toBeVisible();
  // Tocar no número abre minutos e segundos com o valor atual.
  await page.getByRole('button', { name: 'Exercício: 0:31' }).click();
  await expect(page.getByLabel('Minutos de Exercício')).toHaveValue('0');
  await expect(page.getByLabel('Segundos de Exercício')).toHaveValue('31');
  await expect(page.getByLabel('Minutos de Exercício')).toBeFocused();
  await expectNoAxeViolations(page);
  await page.getByLabel('Minutos de Exercício').fill('1');
  // Enter nos minutos passa para os segundos; Enter nos segundos confirma.
  await page.getByLabel('Minutos de Exercício').press('Enter');
  await expect(page.getByLabel('Segundos de Exercício')).toBeFocused();
  await page.getByLabel('Segundos de Exercício').fill('15');
  await page.getByLabel('Segundos de Exercício').press('Enter');
  await expect(page.getByRole('button', { name: 'Exercício: 1:15' })).toBeVisible();
  // Rodadas acima do máximo: ajusta para 99 e diz o porquê.
  await page.getByRole('button', { name: 'Rodadas: 8' }).click();
  await page.getByLabel('Rodadas', { exact: true }).fill('500');
  await page.getByRole('button', { name: 'Confirmar Rodadas' }).click();
  await expect(page.getByRole('button', { name: 'Rodadas: 99' })).toBeVisible();
  await expect(page.getByText('Use entre 1 e 99. Ajustado para o limite.')).toBeVisible();
  // Tocar fora também confirma.
  await page.getByRole('button', { name: /^Descanso: / }).click();
  await page.getByLabel('Segundos de Descanso').fill('45');
  await page.getByRole('heading', { name: 'Intervalado' }).click();
  await expect(page.getByRole('button', { name: 'Descanso: 0:45' })).toBeVisible();
  await expectNoAxeViolations(page);
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
