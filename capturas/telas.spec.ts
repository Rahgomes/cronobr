import { expect, test, type Page } from '@playwright/test';

const T0 = Date.parse('2026-11-07T10:00:00-03:00');

async function shot(page: Page, name: string, full = false) {
  const theme = test.info().project.name;
  // PNG aqui; o .jpg do repositório sai de capturas/reduzir.py (780 px, q78).
  const path = `docs/imagens/capturas/${theme}/${name}.png`;
  if (!full) {
    await page.screenshot({ path });
    return;
  }
  // A rolagem do RN-web é de um div, não da página: a tela inteira sai de uma janela bem alta.
  const size = page.viewportSize();
  if (!size) throw new Error('sem viewport');
  await page.setViewportSize({ width: size.width, height: 2400 });
  await page.screenshot({ path });
  await page.setViewportSize(size);
}

async function openTabata(page: Page) {
  await page.getByRole('button', { name: /^Tabata: / }).click();
  await page.getByRole('button', { name: 'Tabata clássico, 4:00 · 8 exercícios' }).click();
  await expect(page.getByRole('heading', { name: 'Tabata clássico' })).toBeVisible();
}

test('telas', async ({ page }) => {
  await page.clock.install({ time: T0 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Ajustes' })).toBeVisible();
  await shot(page, '01-inicio-vazia');
  await shot(page, '01-inicio-vazia-inteira', true);

  // Uma rotina própria e favorita, para a Início "com uso".
  await page.getByRole('button', { name: /^Tabata: / }).click();
  await shot(page, '02-modalidade');
  await page.getByRole('button', { name: 'Opções de Tabata clássico' }).click();
  await shot(page, '03-menu-rotina');
  await page.getByRole('button', { name: 'Editar uma cópia' }).click();
  await expect(page.getByRole('heading', { name: 'Nova rotina' })).toBeVisible();
  await page.getByLabel('Nome da rotina').fill('Tabata da manhã');
  await shot(page, '04-editor');
  await shot(page, '04-editor-inteiro', true);
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Tabata da manhã, / })).toBeVisible();
  await page.goto('/');
  await page.getByRole('button', { name: 'Opções de Tabata da manhã' }).click();
  await page.getByRole('button', { name: 'Favoritar' }).click();
  await expect(page.getByText('Favoritas')).toBeVisible();

  await page.goto('/');
  await openTabata(page);
  await shot(page, '05-previa');
  await page.getByRole('switch', { name: 'Travar a tela ao começar' }).click();
  await page.getByRole('button', { name: 'Começar' }).click();
  await shot(page, '06-sessao-anel-preparar');
  await page.clock.runFor(12_000);
  await shot(page, '07-sessao-anel-exercicio');
  await page.getByRole('button', { name: 'Foco' }).click();
  await shot(page, '08-sessao-foco-exercicio');
  await page.clock.runFor(20_000);
  await shot(page, '09-sessao-foco-descanso');
  await page.getByRole('button', { name: 'Lista' }).click();
  await shot(page, '10-sessao-lista');
  await page.getByRole('button', { name: 'Anel' }).click();
  await page.getByRole('button', { name: 'Pausar' }).click();
  await shot(page, '11-sessao-pausada');
  await page.getByRole('button', { name: 'Retomar' }).click();
  await page.clock.runFor(240_000);
  await expect(page.getByRole('heading', { name: 'Treino concluído' })).toBeVisible();
  await shot(page, '12-concluido');

  await page.goto('/');
  await expect(page.getByText('Favoritas')).toBeVisible();
  await shot(page, '13-inicio-com-uso');
  await shot(page, '13-inicio-com-uso-inteira', true);
  await page.goto('/historico');
  await expect(page.getByRole('heading').first()).toBeVisible();
  await shot(page, '14-historico');
  await page.goto('/ajustes');
  await expect(page.getByRole('heading').first()).toBeVisible();
  await shot(page, '16-ajustes');
  await page.goto('/backup');
  await expect(page.getByRole('heading').first()).toBeVisible();
  await shot(page, '15-backup');
});
