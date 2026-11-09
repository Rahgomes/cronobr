import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

interface Start {
  when: number;
  now: number;
}

/** Cada `start(quando)` da Web Audio, com o relógio de áudio da hora em que foi marcado. */
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

test('cadência na etapa: editor com prévia, pulso no treino depois da frase, pausa cala', async ({
  page,
}) => {
  // Relógio de áudio de verdade (o page.clock não manda nele): o treino anda em tempo real.
  test.setTimeout(60_000);
  await recordStarts(page);
  await page.goto('/');
  await page.getByRole('button', { name: /^Tabata: / }).click();
  await page.getByRole('button', { name: 'Opções de Tabata clássico' }).click();
  await page.getByRole('button', { name: 'Editar uma cópia' }).click();
  await page.getByLabel('Nome da rotina').fill('Tabata ritmado');
  await page.getByRole('button', { name: /^Exercício, 0:20\. Editar etapa$/ }).click();
  await page.getByRole('switch', { name: 'Metrônomo nesta etapa' }).click();
  await expect(page.getByLabel('Cadência: 90 BPM')).toBeVisible();
  await expectNoAxeViolations(page);
  // Prévia antes de iniciar: 4 batidas.
  await page.getByRole('button', { name: 'Ouvir 4 batidas' }).click();
  await expect(page.getByRole('button', { name: 'Ouvir 4 batidas' })).toBeEnabled({
    timeout: 5_000,
  });
  expect(await starts(page)).toHaveLength(4);
  await page.getByRole('button', { name: 'Fechar' }).click();
  await expect(
    page.getByRole('button', { name: /^Exercício, 0:20, 90 BPM\. Editar etapa$/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();

  await page.getByRole('button', { name: /^Tabata ritmado, / }).click();
  await page.getByRole('switch', { name: 'Travar a tela ao começar' }).click();
  await page.getByRole('button', { name: 'Começar', exact: true }).click();
  // 10 s de preparação (sem cadência) e 6 s de exercício.
  await expect(page.getByLabel('Cadência 90 BPM')).toBeVisible({ timeout: 15_000 });
  await expectNoAxeViolations(page);
  await page.waitForTimeout(6_000);
  const session = (await starts(page)).slice(4);
  expect(session.length).toBeGreaterThanOrEqual(4);
  // O áudio do treino nasce quando a etapa com cadência começa (relógio dele em 0). A frase da
  // troca tem a vez: a primeira batida sai depois de 2,5 s, e logo depois (um passo de folga).
  const first = session[0] as Start;
  expect(first.when).toBeGreaterThan(2.4);
  expect(first.when).toBeLessThan(2.5 + 60 / 90 + 0.5);
  const step = 60 / 90;
  for (let i = 1; i < session.length; i += 1) {
    const gap = (session[i] as Start).when - (session[i - 1] as Start).when;
    expect(Math.abs(gap - step)).toBeLessThan(1e-6);
  }

  await page.getByRole('button', { name: 'Pausar' }).click();
  const paused = (await starts(page)).length;
  await page.waitForTimeout(1_500);
  expect((await starts(page)).length).toBe(paused);
});
