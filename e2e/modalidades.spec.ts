import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

const T0 = Date.parse('2026-11-08T10:00:00-03:00');

/** Abre um modelo pela Início e desliga a trava na prévia (o teste aqui é da modalidade). */
async function open(page: Page, card: RegExp, preset: RegExp) {
  await page.clock.install({ time: T0 });
  await page.goto('/');
  await page.getByRole('button', { name: card }).click();
  await page.getByRole('button', { name: preset }).click();
  await page.getByRole('switch', { name: 'Travar a tela ao começar' }).click();
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 1000);
  await page.getByRole('button', { name: 'Começar' }).click();
}

test('EMOM: "Terminei" vira descanso e a rodada seguinte começa no minuto', async ({ page }) => {
  await open(page, /^EMOM: /, /^EMOM 10 minutos, /);
  await page.clock.runFor(30_000); // 20 s na rodada 1
  await page.getByRole('button', { name: 'Terminei' }).click();
  await expect(page.getByRole('heading', { name: 'Descanso' })).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText('0:40');
  await page.clock.resume();
  await expectNoAxeViolations(page);
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await page.clock.runFor(42_000);
  await expect(page.getByText('Rodada 2 de 10')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Exercício' })).toBeVisible();
});

test('AMRAP: contador de rodadas e registro no fim', async ({ page }) => {
  // 10 minutos de treino simulado: cada minuto são 240 leituras do motor desenhadas.
  test.slow();
  await open(page, /^AMRAP: /, /^AMRAP 10 minutos, /);
  await page.clock.runFor(15_000);
  await page.getByRole('button', { name: 'Mais uma rodada' }).click();
  await page.getByRole('button', { name: 'Mais uma rodada' }).click();
  await page.getByRole('button', { name: 'Mais uma rodada' }).click();
  await page.getByRole('button', { name: 'Tirar uma rodada' }).click();
  await expect(page.getByLabel('2 rodadas')).toBeVisible();
  await page.clock.resume();
  await expectNoAxeViolations(page);
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await page.clock.runFor(600_000);
  await expect(page.getByText('Rodadas registradas: 2')).toBeVisible();
});
