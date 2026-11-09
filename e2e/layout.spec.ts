import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

// E06 C: alvos de toque, paisagem na sessão, tablet e tela pequena.

const T0 = Date.parse('2026-11-07T10:00:00-03:00');

async function openTabata(page: Page) {
  await page.clock.install({ time: T0 });
  await page.goto('/');
  await page.getByRole('button', { name: /^Tabata: / }).click();
  await page.getByRole('button', { name: 'Tabata clássico, 4:00 · 8 exercícios' }).click();
  await expect(page.getByRole('heading', { name: 'Tabata clássico' })).toBeVisible();
}

/** Nada passa da largura da janela (rolagem lateral = layout quebrado). */
async function expectNoSideScroll(page: Page) {
  const { scroll, inner } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(inner);
}

/**
 * Todo controle visível tem pelo menos 44 x 44 (WCAG 2.5.5). No aparelho os ícones redondos
 * somam 2 de folga (hitSlop) e chegam a 48; a web não tem folga, por isso 44 aqui.
 */
async function expectComfortableTargets(page: Page) {
  const small = await page.evaluate(() => {
    const found: string[] = [];
    const roles = '[role="button"],[role="switch"],[role="radio"],[role="checkbox"],a[href]';
    for (const el of document.querySelectorAll<HTMLElement>(roles)) {
      const box = el.getBoundingClientRect();
      const visible =
        box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      if (!visible || el.closest('[aria-hidden="true"]')) continue;
      if (box.width < 44 || box.height < 44) {
        const name = el.getAttribute('aria-label') ?? el.textContent;
        found.push(
          `${name.slice(0, 40)} ${String(Math.round(box.width))}x${String(Math.round(box.height))}`,
        );
      }
    }
    return found;
  });
  expect(small).toEqual([]);
}

const ROUTES = [
  '/avisos',
  '/backup',
  '/historico',
  '/modalidades',
  '/intervalado',
  '/temporizador',
  '/cronometro',
  '/modalidade/tabata',
  '/rotina/nova?modalidade=circuito',
];

test('alvos de toque confortáveis nas demais telas', async ({ page }) => {
  for (const path of ROUTES) {
    await page.goto(path);
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expectComfortableTargets(page);
  }
});

test('alvos de toque confortáveis nas telas principais', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Ajustes' })).toBeVisible();
  await expectComfortableTargets(page);

  await page.getByRole('button', { name: 'Ajustes' }).click();
  await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible();
  await expectComfortableTargets(page);
  await page.getByRole('button', { name: 'Voltar' }).click();

  await openTabata(page);
  await expectComfortableTargets(page);
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await expectComfortableTargets(page);
});

test.describe('paisagem', () => {
  test.use({ viewport: { width: 915, height: 412 } });

  test('sessão em duas colunas: tempo e controles sem rolar', async ({ page }) => {
    await openTabata(page);
    await page.getByRole('button', { name: 'Começar' }).click();
    const timer = page.getByRole('timer');
    await expect(timer).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: 'Pausar' })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: 'Encerrar treino' })).toBeInViewport({
      ratio: 1,
    });
    // O cartão "Próxima" (E06 D) também cabe sem rolar.
    await expect(page.getByLabel(/^Depois: /)).toBeInViewport({ ratio: 1 });
    const clock = await timer.boundingBox();
    const pause = await page.getByRole('button', { name: 'Pausar' }).boundingBox();
    expect(clock && pause && pause.x > clock.x + clock.width).toBe(true);
    await expectNoSideScroll(page);
    await expectNoAxeViolations(page);
  });
});

test.describe('tablet', () => {
  test.use({ viewport: { width: 1024, height: 1366 } });

  test('conteúdo centralizado com largura limitada', async ({ page }) => {
    await page.goto('/');
    const settings = page.getByRole('button', { name: 'Ajustes' });
    await expect(settings).toBeVisible();
    const box = await settings.boundingBox();
    // Largura máxima de 640 centralizada: a engrenagem fica longe da borda direita.
    expect(box && box.x + box.width).toBeLessThanOrEqual((1024 + 640) / 2);
    await expectNoSideScroll(page);
    await expectNoAxeViolations(page);
  });
});

test.describe('celular pequeno', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('Foco: número grande cabe na tela', async ({ page }) => {
    await openTabata(page);
    await page.getByRole('button', { name: 'Foco' }).click();
    await page.getByRole('button', { name: 'Começar' }).click();
    const timer = page.getByRole('timer');
    await expect(timer).toBeVisible();
    const box = await timer.boundingBox();
    const text = await timer.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    expect(box && box.x >= 0 && box.x + box.width <= 320).toBe(true);
    expect(text.scroll).toBeLessThanOrEqual(text.client);
    await expectNoSideScroll(page);
    await expectNoAxeViolations(page);
  });
});
