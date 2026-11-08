import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** WCAG 2.2 AA na página como está agora. */
export async function expectNoAxeViolations(page: Page) {
  // O Modal do RN-web nasce com aria-modal e só ganha role="dialog" depois de entrar na pilha
  // (efeito). Em máquina lenta o axe pegava esse meio-tempo: espera o modal assentar.
  await expect(page.locator('[aria-modal="true"]:not([role])')).toHaveCount(0);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
}
