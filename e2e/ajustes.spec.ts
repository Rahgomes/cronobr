import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

// Ajustes (E06): tema e idioma escolhidos no app valem na hora e depois de reabrir.

test('idioma: inglês na hora, mantido ao recarregar, e volta ao do aparelho', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ajustes' }).click();
  await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expectNoAxeViolations(page);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stopwatch', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Device (Português)' }).click();
  await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
});

test('tema: escolher o oposto do sistema troca o fundo e fica gravado', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ajustes' }).click();
  const scheme = await page.evaluate(() =>
    matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  const [label, background] =
    scheme === 'dark' ? ['Claro', 'rgb(245, 245, 245)'] : ['Escuro', 'rgb(18, 18, 18)'];
  await page.getByRole('button', { name: label }).click();
  await expect(page.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
  await expectNoAxeViolations(page);
  await page.reload();
  await expect(page.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
  expect(
    await page.evaluate(
      (bg) =>
        [...document.querySelectorAll('div')].some(
          (el) => getComputedStyle(el).backgroundColor === bg && el.clientHeight > 400,
        ),
      background,
    ),
  ).toBe(true);
});
