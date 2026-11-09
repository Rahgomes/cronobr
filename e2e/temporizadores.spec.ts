import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

const T0 = Date.parse('2026-11-09T10:00:00-03:00');

/** Cria pelo formulário a partir dos 5:00 do começo. */
async function create(page: Page, name: string, minutes: number) {
  await page.getByRole('button', { name: 'Novo temporizador' }).click();
  await page.getByLabel('Nome').fill(name);
  for (let m = 5; m > minutes; m -= 1) {
    await page.getByRole('button', { name: 'Diminuir Minutos' }).click();
  }
  await page.getByRole('button', { name: `Iniciar ${String(minutes)}:00` }).click();
}

/** O axe usa os timers da página: com o relógio parado ele não termina. Solta, mede e para de novo. */
async function axe(page: Page) {
  await page.clock.resume();
  await expectNoAxeViolations(page);
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
}

async function openFromHome(page: Page) {
  await page.clock.install({ time: T0 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Temporizadores' }).click();
  await expect(page.getByRole('heading', { name: 'Temporizadores' })).toBeVisible();
}

test('vários ao mesmo tempo: cria, pausa, conclui com o nome e repete', async ({ page }) => {
  await openFromHome(page);
  await expect(page.getByText(/Nenhum temporizador ainda/)).toBeVisible();
  await expectNoAxeViolations(page);

  await create(page, 'Ovo', 1);
  await create(page, 'Chá', 3);
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await page.clock.runFor(30_000);
  await expect(page.getByRole('timer', { name: /^Ovo, 0:[23]\d, Rodando$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Pausar Chá' }).click();
  await expect(page.getByRole('timer', { name: /^Chá, 2:\d\d, Pausado$/ })).toBeVisible();
  await axe(page);

  await page.clock.runFor(40_000);
  // Aviso no diálogo do app, com o nome; dá para repetir dali ou fechar.
  await expect(page.getByRole('heading', { name: 'Ovo terminou' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Repetir', exact: true })).toBeVisible();
  await axe(page);
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('heading', { name: 'Ovo terminou' })).toHaveCount(0);
  await expect(page.getByRole('timer', { name: 'Ovo terminou' })).toBeVisible();

  await page.getByRole('button', { name: 'Repetir Ovo' }).click();
  await expect(page.getByRole('timer', { name: /^Ovo, (1:00|0:5\d), Rodando$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Encerrar Chá' }).click();
  await expect(page.getByRole('timer')).toHaveCount(1);
});

test('estado preservado ao navegar e ao recarregar; resumo na Início', async ({ page }) => {
  await openFromHome(page);
  await create(page, 'Feijão', 4);
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await page.clock.runFor(60_000);
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(
    page.getByRole('button', { name: /^Temporizadores, 1 ativo\. Feijão 2:\d\d$/ }),
  ).toBeVisible();
  await axe(page);

  await page.clock.resume();
  await page.reload();
  await expect(
    page.getByRole('button', { name: /^Temporizadores, 1 ativo\. Feijão/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Temporizadores, / }).click();
  await expect(page.getByRole('timer', { name: /^Feijão, 2:\d\d, Rodando$/ })).toBeVisible();
});

test('com um treino rodando, o fim do temporizador aparece por cima da sessão', async ({
  page,
}) => {
  await openFromHome(page);
  await create(page, 'Ovo', 1);
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('button', { name: 'Temporizador', exact: true }).click();
  await page.getByRole('button', { name: /^Começar / }).click();
  await page.getByRole('switch', { name: 'Travar a tela ao começar' }).click();
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await page.getByRole('button', { name: 'Começar', exact: true }).click();
  await page.clock.runFor(65_000);
  await expect(page.getByRole('heading', { name: 'Ovo terminou' })).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('heading', { name: 'Ovo terminou' })).toHaveCount(0);
});
