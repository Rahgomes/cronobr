import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

test('som e avisos: canais independentes, escolha com prévia e gravado no aparelho', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Som e avisos' }).click();
  await expect(page.getByRole('heading', { name: 'Som e avisos' })).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole('switch', { name: 'Voz' }).click();
  await expect(page.getByRole('switch', { name: 'Voz' })).toHaveAttribute('aria-checked', 'false');
  // Segunda seção (Exercício): o gongo passa a ser o som da troca para exercício.
  await page.getByRole('button', { name: 'Gongo' }).nth(1).click();
  await expect(page.getByRole('button', { name: 'Gongo' }).nth(1)).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.reload();
  await expect(page.getByRole('switch', { name: 'Voz' })).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('button', { name: 'Gongo' }).nth(1)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
