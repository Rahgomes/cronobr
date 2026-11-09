import { expect, test, type Page } from '@playwright/test';

import { en } from '../src/i18n/messages/en';
import { es } from '../src/i18n/messages/es';
import { fr } from '../src/i18n/messages/fr';
import { pt, type Messages } from '../src/i18n/messages/pt';

// E06 E: capturas por língua e por tamanho, só no tema escuro (o claro já sai em telas.spec).
// Saída: docs/imagens/capturas/idiomas/<língua>-NN.png e tamanhos/<tamanho>-NN.png; depois
// `python3 capturas/reduzir.py`.

const T0 = Date.parse('2026-11-07T10:00:00-03:00');

async function shot(page: Page, folder: string, name: string) {
  await page.screenshot({ path: `docs/imagens/capturas/${folder}/${name}.png` });
}

/** Prévia do Tabata clássico direto pela rota, com a trava desligada para os controles ficarem acesos. */
async function startTabata(page: Page, t: Messages) {
  await page.goto('/sessao?rotina=tabata-classic');
  await expect(page.getByRole('button', { name: t.session.start })).toBeVisible();
  await page.getByRole('switch', { name: t.session.lockOnStart }).click();
  await page.getByRole('button', { name: t.session.start }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await page.clock.runFor(12_000);
}

function onlyDark() {
  test.skip(test.info().project.name !== 'escuro', 'matriz só no tema escuro');
}

const LANGS = [
  { locale: 'en-US', lang: 'en', t: en },
  { locale: 'es-ES', lang: 'es', t: es },
  { locale: 'fr-FR', lang: 'fr', t: fr },
] as const;

for (const { locale, lang, t } of LANGS) {
  test.describe(lang, () => {
    test.use({ locale });

    test(`língua ${lang}`, async ({ page }) => {
      onlyDark();
      await page.clock.install({ time: T0 });
      await page.goto('/');
      await expect(page.getByRole('button', { name: t.home.settings })).toBeVisible();
      await shot(page, 'idiomas', `${lang}-01-inicio`);
      await page.goto('/ajustes');
      await expect(page.getByRole('heading', { name: t.settings.title })).toBeVisible();
      await shot(page, 'idiomas', `${lang}-02-ajustes`);
      await page.goto('/rotina/nova?de=tabata-classic');
      await expect(page.getByRole('heading', { name: t.editor.newRoutine })).toBeVisible();
      await shot(page, 'idiomas', `${lang}-03-editor`);
      await startTabata(page, t);
      await shot(page, 'idiomas', `${lang}-04-sessao-anel`);
      await page.getByRole('button', { name: t.session.viewLabels.lista }).click();
      await shot(page, 'idiomas', `${lang}-05-sessao-lista`);
    });
  });
}

const SIZES = [
  { name: 'pequeno-320x568', viewport: { width: 320, height: 568 } },
  { name: 'tablet-1024x1366', viewport: { width: 1024, height: 1366 } },
  { name: 'paisagem-915x412', viewport: { width: 915, height: 412 } },
] as const;

for (const { name, viewport } of SIZES) {
  test.describe(name, () => {
    test.use({ viewport });

    test(`tamanho ${name}`, async ({ page }) => {
      onlyDark();
      await page.clock.install({ time: T0 });
      await page.goto('/');
      await expect(page.getByRole('button', { name: pt.home.settings })).toBeVisible();
      await shot(page, 'tamanhos', `${name}-01-inicio`);
      await page.goto('/rotina/nova?de=tabata-classic');
      await expect(page.getByRole('heading', { name: pt.editor.newRoutine })).toBeVisible();
      await shot(page, 'tamanhos', `${name}-02-editor`);
      await startTabata(page, pt);
      await shot(page, 'tamanhos', `${name}-03-sessao-anel`);
      await page.getByRole('button', { name: pt.session.viewLabels.foco }).click();
      await shot(page, 'tamanhos', `${name}-04-sessao-foco`);
    });
  });
}
