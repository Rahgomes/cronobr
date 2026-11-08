import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

// Histórico (E04 lote E): nota depois do treino, calendário, filtro por dia e repetir.
// Fuso fixo: o dia do calendário é o local, e o CI roda em UTC.
test.use({ timezoneId: 'America/Sao_Paulo' });

const T0 = Date.parse('2026-11-07T10:00:00-03:00');

async function finishTabata(page: Page) {
  await page.clock.install({ time: T0 });
  await page.goto('/');
  await page.getByRole('button', { name: /^Tabata: / }).click();
  await page.getByRole('button', { name: 'Tabata clássico, 4:00 · 8 exercícios' }).click();
  await expect(page.getByText('Duração total: 4:00')).toBeVisible();
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.clock.runFor(255_000);
  await expect(page.getByRole('heading', { name: 'Treino concluído' })).toBeVisible();
  await page.clock.resume();
}

test('nota escrita no fim do treino fica no registro depois de recarregar', async ({ page }) => {
  await finishTabata(page);
  await page.getByRole('button', { name: 'Escrever uma nota' }).click();
  await expect(page.getByRole('heading', { name: 'Tabata clássico' })).toBeVisible();
  await page.getByLabel('Nota', { exact: true }).fill('Último bloco pesado');
  await page.getByRole('button', { name: 'Salvar nota' }).click();
  await expect(page.getByText('Nota salva')).toBeVisible();
  await expectNoAxeViolations(page);

  await page.reload();
  await expect(page.getByLabel('Nota', { exact: true })).toHaveValue('Último bloco pesado');
});

test('calendário marca o dia, filtra e o registro repete a mesma rotina', async ({ page }) => {
  await finishTabata(page);
  await page.getByRole('button', { name: 'Voltar ao início' }).click();
  await page.getByRole('button', { name: 'Ver histórico' }).click();

  await expect(page.getByRole('heading', { name: 'Novembro de 2026' })).toBeVisible();
  const today = page.getByRole('button', { name: '7 de novembro, hoje, 1 treino' });
  await expect(today).toBeVisible();
  await expectNoAxeViolations(page);

  await today.click();
  await expect(page.getByRole('heading', { name: 'Treinos de 7 de novembro' })).toBeVisible();
  await page.getByRole('button', { name: 'Mês anterior' }).click();
  await expect(page.getByText('Nenhum treino neste mês.')).toBeVisible();
  // Trocar de mês limpa o filtro.
  await expect(page.getByRole('heading', { name: 'Treinos de 7 de novembro' })).toBeHidden();
  await page.getByRole('button', { name: 'Próximo mês' }).click();

  await page.getByRole('button', { name: /^Tabata clássico, .*Concluído/ }).click();
  await expect(page.getByRole('button', { name: 'Repetir este treino' })).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Repetir este treino' }).click();
  await expect(page.getByRole('heading', { name: 'Tabata clássico' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Começar' })).toBeVisible();
});
