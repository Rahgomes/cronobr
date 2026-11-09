import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

// Fluxos críticos da E08 que ainda não tinham E2E próprio. Os demais estão mapeados no doc da
// E08 (lote A) para o teste que já os cobre.

test('primeira abertura sem rede: nada vem de fora, e dá para treinar', async ({ page }) => {
  const outside: string[] = [];
  // Tudo que não é o próprio app falha, como num aparelho sem internet.
  await page.route('**/*', (route) => {
    const { hostname } = new URL(route.request().url());
    if (hostname === '127.0.0.1' || hostname === 'localhost') return route.continue();
    outside.push(route.request().url());
    return route.abort('internetdisconnected');
  });
  await page.clock.install({ time: Date.parse('2026-11-09T10:00:00-03:00') });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Tabata: / })).toBeVisible();
  await page.getByRole('button', { name: /^Tabata: / }).click();
  await page.getByRole('button', { name: 'Tabata clássico, 4:00 · 8 exercícios' }).click();
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.clock.runFor(12_000);
  await expect(page.getByRole('heading', { name: 'Exercício' })).toBeVisible();
  await expectNoAxeViolations(page);
  // Nem tentou: fonte, ícone, som e textos estão todos no pacote.
  expect(outside).toEqual([]);
});
