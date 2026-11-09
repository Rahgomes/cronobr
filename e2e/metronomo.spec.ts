import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

interface Start {
  when: number;
  now: number;
}

/**
 * Medição no navegador de verdade, sem gancho no app: cada `start(quando)` da Web Audio fica
 * registrado com o relógio de áudio da hora em que foi marcado.
 */
async function recordStarts(page: Page) {
  await page.addInitScript(() => {
    const starts: { when: number; now: number }[] = [];
    (window as unknown as { __starts: typeof starts }).__starts = starts;
    const proto = AudioScheduledSourceNode.prototype;
    const original = proto.start;
    proto.start = function start(this: AudioScheduledSourceNode, when?: number) {
      starts.push({ when: when ?? 0, now: this.context.currentTime });
      original.call(this, when);
    };
  });
}

const starts = (page: Page) =>
  page.evaluate(() => (window as unknown as { __starts: Start[] }).__starts.slice());

async function openFromHome(page: Page) {
  await recordStarts(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Metrônomo' }).click();
  await expect(page.getByRole('heading', { name: 'Metrônomo' })).toBeVisible();
}

test('a 180 BPM no relógio de áudio: intervalos exatos, fila sempre adiantada, parar cala', async ({
  page,
}, info) => {
  await openFromHome(page);
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: '180 BPM' }).click();
  await expect(page.getByLabel('180 batidas por minuto')).toBeVisible();
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.getByRole('button', { name: 'Parar' })).toBeVisible();
  await expectNoAxeViolations(page);
  await page.waitForTimeout(4_000);
  await page.getByRole('button', { name: 'Parar' }).click();
  const marked = await starts(page);
  expect(marked.length).toBeGreaterThanOrEqual(12);

  const step = 60 / 180;
  const deviations = marked
    .slice(1)
    .map((s, i) => Math.abs(s.when - (marked[i]?.when ?? 0) - step));
  const slack = marked.map((s) => s.when - s.now);
  const result = {
    beats: marked.length,
    maxDeviationMs: Math.max(...deviations) * 1000,
    minSlackMs: Math.min(...slack) * 1000,
  };
  info.annotations.push({ type: 'variação', description: JSON.stringify(result) });
  // Precisão de amostra: menos de 1 µs entre o marcado e o passo do BPM.
  expect(result.maxDeviationMs).toBeLessThan(0.001);
  // Toda batida marcada antes da hora (a fila nunca secou).
  expect(result.minSlackMs).toBeGreaterThan(0);

  await page.waitForTimeout(1_000);
  expect((await starts(page)).length).toBe(marked.length);
  await expect(page.getByRole('button', { name: 'Começar' })).toBeVisible();
});

test('prévia de 4 batidas; ritmo e atraso do fone ficam gravados', async ({ page }) => {
  await openFromHome(page);
  await page.getByRole('button', { name: 'Ouvir 4 batidas' }).click();
  await expect(page.getByRole('button', { name: 'Ouvir 4 batidas' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Ouvir 4 batidas' })).toBeEnabled({
    timeout: 5_000,
  });
  expect(await starts(page)).toHaveLength(4);

  await page.getByRole('button', { name: 'Diminuir BPM' }).click();
  await expect(page.getByLabel('89 batidas por minuto')).toBeVisible();
  await page.getByRole('button', { name: 'Aumentar Atraso do fone' }).click();
  await expect(page.getByText('20 ms')).toBeVisible();
  await page.getByRole('button', { name: 'Aumentar Atraso do fone' }).click();
  await expect(page.getByText('40 ms')).toBeVisible();
  // A tela mostra na hora e grava logo depois; recarregar no meio mata a escrita. Sair e voltar
  // relê do banco, e a leitura entra na mesma fila depois da escrita: ver 40 aqui = gravado.
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('button', { name: 'Metrônomo' }).click();
  await expect(page.getByText('40 ms')).toBeVisible();
  await page.reload();
  await expect(page.getByText('40 ms')).toBeVisible();
  await expect(page.getByLabel('89 batidas por minuto')).toBeVisible();
  await expectNoAxeViolations(page);
});
