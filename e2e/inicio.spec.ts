import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('a Início abre offline com a marca e a sheet própria', async ({ page }) => {
  await page.goto('/');
  // No web o Image do RN vira div role=img com um <img> dentro: os dois têm o nome.
  await expect(page.getByRole('img', { name: 'CronôBR' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nova versão em construção' })).toBeVisible();

  await page.getByRole('button', { name: 'O que vem por aí' }).click();
  await expect(page.getByText('Backup em arquivo entre Android e iPhone')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar' }).click();
  await expect(page.getByText('Backup em arquivo entre Android e iPhone')).toBeHidden();
});

test('a Início não tem violação de acessibilidade (axe, WCAG 2.2 AA)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Nova versão em construção' })).toBeVisible();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

test('rota desconhecida mostra a página de não encontrado com saída', async ({ page }) => {
  await page.goto('/nao-existe');
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar ao início' }).click();
  await expect(page.getByRole('heading', { name: 'Nova versão em construção' })).toBeVisible();
});
