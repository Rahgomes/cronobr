import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

test('sequência do profissional: cola, confere, cria e revisa no editor', async ({ page }) => {
  await page.goto('/modalidade/profissional');
  await expect(page.getByRole('heading', { name: 'Do profissional' })).toBeVisible();
  await page.getByRole('button', { name: 'Cadastrar sequência recebida' }).click();
  await expect(page.getByRole('heading', { name: 'Cadastrar sequência' })).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByLabel('Nome da rotina').fill('Fisioterapia do joelho');
  await page
    .getByLabel('Sequência', { exact: true })
    .fill('- Ponte de glúteo 30s\n- Agachamento 2x12\n- Concha 12 reps cada lado\n- Prancha');
  await expect(
    page.getByText('Linha 4: faltou o tempo ou as repetições no fim.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByText('2 séries · 12 reps')).toBeVisible();
  await expect(page.getByText('12 reps · cada lado')).toBeVisible();
  await expectNoAxeViolations(page);

  await page
    .getByLabel('Sequência', { exact: true })
    .fill('- Ponte de glúteo 30s\n- Agachamento 2x12\n- Concha 12 reps cada lado\n- Prancha 20s');
  await expect(page.getByText('Linha 4:', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Aumentar Voltas' }).click();
  await page.getByRole('button', { name: 'Criar e revisar' }).click();

  await expect(page.getByRole('heading', { name: 'Editar rotina' })).toBeVisible();
  await expect(page.getByLabel('Nome da rotina')).toHaveValue('Fisioterapia do joelho');
  await expect(page.getByText('Agachamento (série 2 de 2)').first()).toBeVisible();
  await expectNoAxeViolations(page);
});

test('estudo: a sessão fala "Foco", não "Exercício"', async ({ page }) => {
  await page.clock.install({ time: Date.parse('2026-11-09T10:00:00-03:00') });
  await page.goto('/modalidade/foco');
  await expect(page.getByRole('heading', { name: 'Estudo e foco' })).toBeVisible();
  await page.getByRole('button', { name: /^Pomodoro 25\/5, / }).click();
  await expect(page.getByRole('heading', { name: 'Pomodoro 25/5' })).toBeVisible();
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.clock.runFor(12_000);
  await expect(page.getByRole('heading', { name: 'Foco' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Encerrar sessão' })).toBeVisible();
  await expectNoAxeViolations(page);
});
