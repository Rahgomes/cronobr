import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

// O relógio da página é do Playwright: Date, performance.now e os intervalos andam só quando
// o teste manda. É assim que 4 minutos de Tabata cabem em segundos, sem atalho no app.

const T0 = Date.parse('2026-11-07T10:00:00-03:00');

async function openTabata(page: Page) {
  await page.clock.install({ time: T0 });
  await page.goto('/');
  await page.getByRole('button', { name: /^Tabata: / }).click();
  await page.getByRole('button', { name: 'Tabata clássico, 4:00 · 8 exercícios' }).click();
  await expect(page.getByRole('heading', { name: 'Tabata clássico' })).toBeVisible();
  await expect(page.getByText('Duração total: 4:00')).toBeVisible();
  await freeze(page);
}

/**
 * Para o relógio da página: daqui em diante o tempo só anda no runFor (correndo, o texto do
 * timer muda durante a checagem). Só depois da tela pronta: a abertura do banco usa timers.
 */
async function freeze(page: Page) {
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 1000);
}

const timer = (page: Page) => page.getByRole('timer');

const LOCKED = 'Tela travada · segure o cadeado para usar os botões';

/** Toque longo com o relógio da página parado: o tempo do "segurar" anda pelo runFor. */
async function hold(page: Page, name: string, ms: number) {
  const box = await page.getByRole('button', { name, exact: true }).boundingBox();
  if (!box) throw new Error(`sem botão ${name}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.clock.runFor(ms);
  await page.mouse.up();
}

test('treino completo: fases pelo relógio, conclusão e histórico com um registro', async ({
  page,
}) => {
  await openTabata(page);
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.getByRole('heading', { name: 'Preparação' })).toBeVisible();
  await expect(timer(page)).toHaveText('0:10');

  await page.clock.runFor(15_000);
  await expect(page.getByRole('heading', { name: 'Exercício' })).toBeVisible();
  await expect(page.getByText('Rodada 1 de 8')).toBeVisible();
  await expect(timer(page)).toHaveText('0:15');

  await page.clock.runFor(240_000);
  await expect(page.getByRole('heading', { name: 'Treino concluído' })).toBeVisible();
  await expect(page.getByText('Tempo ativo: 4 min')).toBeVisible();
  // O axe usa timers: só com o relógio correndo.
  await page.clock.resume();
  await expectNoAxeViolations(page);

  await page.getByRole('button', { name: 'Voltar ao início' }).click();
  // O treino feito vira um card em Recentes, pronto para repetir.
  await expect(
    page.getByRole('button', { name: 'Repetir Tabata clássico, 4:00, feito hoje' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ver histórico' }).click();
  await expect(page.getByText('1 treino registrado')).toBeVisible();
  await expect(page.getByText('Concluído · 4 min · 8/8 exercícios')).toBeVisible();
});

test('travada: toque não pausa; segurar pausa e retoma; o X pede confirmação e encerra salvando', async ({
  page,
}) => {
  await openTabata(page);
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.getByText(LOCKED)).toBeVisible();
  await page.clock.runFor(4_000);
  // Esbarrar não pausa.
  await page.getByRole('button', { name: 'Pausar' }).click();
  await expect(page.getByText('Pausado')).toBeHidden();
  await hold(page, 'Pausar', 800);
  await expect(page.getByText('Pausado')).toBeVisible();
  await page.clock.runFor(60_000);
  // O toque longo leva 0,6 s: a pausa entra em 4,6 s.
  await expect(timer(page)).toHaveText('0:06');
  await hold(page, 'Retomar', 800);
  await page.clock.runFor(31_000); // resto da preparação + 20 de exercício + parte do descanso

  // O X travado não abre nada; segurar o cadeado destrava.
  await page.getByRole('button', { name: 'Encerrar treino' }).click();
  await expect(page.getByRole('heading', { name: 'Encerrar o treino?' })).toBeHidden();
  await hold(page, 'Destravar a tela', 1_200);
  await expect(page.getByText(LOCKED)).toBeHidden();
  await page.getByRole('button', { name: 'Encerrar treino' }).click();
  await expect(page.getByRole('heading', { name: 'Encerrar o treino?' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar treino' }).click();
  await expect(page.getByRole('heading', { name: 'Descanso' })).toBeVisible();

  await page.getByRole('button', { name: 'Encerrar treino' }).click();
  await page.getByRole('button', { name: 'Encerrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Treino encerrado' })).toBeVisible();
  await expect(page.getByText('Exercícios feitos: 1 de 8')).toBeVisible();
});

test('visualizações Lista, Foco e Anel com axe; salto pela lista confirmado', async ({ page }) => {
  await openTabata(page);
  await page.getByRole('button', { name: 'Lista' }).click();
  await page.getByRole('switch', { name: 'Travar a tela ao começar' }).click();
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.clock.runFor(12_000);
  await expect(page.getByRole('button', { name: '2. Exercício, 0:20, agora' })).toBeVisible();
  await page.clock.resume();
  await expectNoAxeViolations(page);
  await freeze(page);

  await page.getByRole('button', { name: '9. Descanso, 0:10' }).click();
  await expect(page.getByRole('heading', { name: 'Ir para Descanso?' })).toBeVisible();
  await page.getByRole('button', { name: 'Ir para a etapa' }).click();
  await expect(page.getByText('Rodada 4 de 8').first()).toBeVisible();

  await page.getByRole('button', { name: 'Foco' }).click();
  await expect(page.getByText('DESCANSO', { exact: true })).toBeVisible();
  await page.clock.resume();
  await expectNoAxeViolations(page);
  await freeze(page);
  await page.getByRole('button', { name: 'Anel' }).click();
  await expect(page.getByText(/^Restante no treino/)).toBeVisible();
  await page.clock.resume();
  await expectNoAxeViolations(page);
});

test('recarregar a página no meio do treino retoma de onde o relógio está', async ({ page }) => {
  await openTabata(page);
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.clock.runFor(11_000); // troca de fase grava o marco
  await expect(page.getByText('Rodada 1 de 8')).toBeVisible();

  // Recarregar mantém o endereço: a sessão volta direto, pelo marco gravado no SQLite.
  // O relógio volta a correr para a página nova conseguir abrir o banco.
  await page.clock.resume();
  await page.reload();
  await expect(page.getByText('Rodada 1 de 8')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Começar' })).toBeHidden();
  // Tela do treino rodando, com o relógio correndo (o axe usa timers).
  await expectNoAxeViolations(page);

  // Pela Início também: o treino em andamento aparece com atalho, e o tempo seguiu contando.
  await page.goto('/');
  await expect(page.getByText(/Treino em andamento: Tabata clássico/)).toBeVisible();
  await page.clock.runFor(30_000);
  await page.getByRole('button', { name: 'Continuar treino' }).click();
  await expect(page.getByText('Rodada 2 de 8')).toBeVisible();
});
