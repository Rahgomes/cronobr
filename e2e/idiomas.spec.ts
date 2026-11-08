import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './axe';
import { en } from '../src/i18n/messages/en';
import { es } from '../src/i18n/messages/es';
import { fr } from '../src/i18n/messages/fr';
import type { Messages } from '../src/i18n/messages/pt';

// O app em inglês, espanhol e francês pela língua do navegador ("do aparelho"): os caminhos
// principais com os textos da língua, sem nada vazando da largura da tela e com axe.

const LANGS: { locale: string; lang: string; t: Messages; tabata: string }[] = [
  { locale: 'en-US', lang: 'en', t: en, tabata: 'Classic Tabata' },
  { locale: 'es-ES', lang: 'es', t: es, tabata: 'Tabata clásico' },
  { locale: 'fr-FR', lang: 'fr', t: fr, tabata: 'Tabata classique' },
];

/** Nada passa da largura da tela: texto longo quebra linha em vez de empurrar a página. */
async function expectFits(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const { locale, lang, t, tabata } of LANGS) {
  test.describe(lang, () => {
    test.use({ locale });

    test(`${lang}: Início, modelo, sessão e editor na língua do aparelho`, async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.getByRole('button', { name: t.home.settings })).toBeVisible();
      await expect(page.getByText(t.home.modalities, { exact: true })).toBeVisible();
      await expectFits(page);
      await expectNoAxeViolations(page);

      await page
        .getByRole('button', {
          name: t.home.modalityLabel(
            t.modality.tabata.label,
            t.modality.tabata.tagline,
            t.home.models(2),
          ),
        })
        .click();
      await page.getByRole('button', { name: `${tabata}, 4:00` }).click();
      await expect(page.getByRole('heading', { name: tabata })).toBeVisible();
      await expect(page.getByRole('button', { name: t.session.start })).toBeVisible();
      await expectFits(page);
      await page.getByRole('button', { name: t.session.start }).click();
      await expect(page.getByRole('timer')).toBeVisible();
      await expect(page.getByText(t.session.lockedHint)).toBeVisible();
      await expectFits(page);
      await expectNoAxeViolations(page);

      await page.goto('/rotina/nova');
      await expect(page.getByRole('heading', { name: t.editor.newRoutine })).toBeVisible();
      await expect(page.getByRole('button', { name: t.editor.save, exact: true })).toBeVisible();
      await expectFits(page);
      await expectNoAxeViolations(page);
    });

    test(`${lang}: Ajustes, histórico e backup`, async ({ page }) => {
      for (const path of ['/ajustes', '/historico', '/backup', '/avisos']) {
        await page.goto(path);
        await expect(page.getByRole('button', { name: t.common.back, exact: true })).toBeVisible();
        await expectFits(page);
        await expectNoAxeViolations(page);
      }
      await page.goto('/ajustes');
      await expect(page.getByRole('heading', { name: t.settings.title })).toBeVisible();
    });
  });
}
