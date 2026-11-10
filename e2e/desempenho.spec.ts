/// <reference types="node" />
import { expect, test, type Page } from '@playwright/test';

// Desempenho (E08 B) no Chromium, num tema só (o tema não muda o custo). Mede e guarda limite:
// abertura, resposta dos toques, precisão das trocas de fase em tempo real e biblioteca e
// histórico no tamanho máximo que o backup aceita. Os números vão anexados ao relatório e para o
// doc da E08; o aparelho tem o roteiro próprio.

test.skip(({ colorScheme }) => colorScheme !== 'light', 'mede uma vez; o tema não muda o custo');

function report(name: string, data: unknown) {
  return test.info().attach(name, {
    body: JSON.stringify(data, null, 2),
    contentType: 'application/json',
  });
}

test('abertura: Início pronta e quanto JavaScript a web baixa', async ({ page }) => {
  let jsBytes = 0;
  page.on('response', (response) => {
    if (!response.url().endsWith('.js')) return;
    void response.body().then(
      (body) => {
        jsBytes += body.length;
      },
      () => undefined,
    );
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Tabata: / })).toBeVisible();
  const readyMs = await page.evaluate(() => performance.now());
  const nav = await page.evaluate(() => {
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return {
      domContentLoaded: entry?.domContentLoadedEventEnd ?? 0,
      load: entry?.loadEventEnd ?? 0,
    };
  });
  const data = { readyMs: Math.round(readyMs), ...nav, jsMb: jsBytes / 1024 / 1024 };
  await report('abertura', data);
  // Servidor local, sem rede lenta: mede o custo do próprio app (montar banco, telas).
  expect(readyMs).toBeLessThan(5_000);
  expect(data.jsMb).toBeLessThan(6);
});

/** Toques medidos pela Event Timing API do navegador (a mesma base do INP). */
async function watchTaps(page: Page) {
  await page.evaluate(() => {
    const taps: { name: string; duration: number }[] = [];
    (window as unknown as { __taps: typeof taps }).__taps = taps;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'click' || entry.name === 'pointerup') {
          taps.push({ name: entry.name, duration: entry.duration });
        }
      }
    }).observe({ type: 'event', durationThreshold: 16, buffered: true } as PerformanceObserverInit);
  });
}

test('resposta dos controles do treino: cada toque responde em menos de 200 ms', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Tabata: / }).click();
  await page.getByRole('button', { name: 'Tabata clássico, 4:00 · 8 exercícios' }).click();
  await page.getByRole('switch', { name: 'Travar a tela ao começar' }).click();
  await watchTaps(page);
  await page.getByRole('button', { name: 'Começar' }).click();
  for (let i = 0; i < 5; i += 1) {
    await page.getByRole('button', { name: 'Pausar' }).click();
    await expect(page.getByRole('button', { name: 'Retomar' })).toBeVisible();
    await page.getByRole('button', { name: 'Retomar' }).click();
    await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible();
    await page.getByRole('button', { name: 'Pular etapa' }).click();
  }
  // O observador entrega as entradas fora do toque: dá um tempo para chegarem.
  await page.waitForTimeout(500);
  const taps = await page.evaluate(
    () => (window as unknown as { __taps: { duration: number }[] }).__taps,
  );
  const worst = Math.max(0, ...taps.map((t) => t.duration));
  await report('toques', { count: taps.length, worstMs: worst, taps });
  // "Bom" para INP é até 200 ms.
  expect(worst).toBeLessThan(200);
});

test('precisão das trocas em tempo real: cada fase troca no tempo dela', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/intervalado');
  // 5 s de exercício, 5 s de descanso, 2 rodadas, sem preparação: digitados à mão (D134).
  const set = async (label: string, minutes: string | null, value: string) => {
    await page.locator(`[role="button"][aria-label^="${label}: "]`).click();
    if (minutes === null) {
      await page.getByLabel(label, { exact: true }).fill(value);
      await page.getByLabel(label, { exact: true }).press('Enter');
      return;
    }
    await page.getByLabel(`Minutos de ${label}`).fill(minutes);
    await page.getByLabel(`Minutos de ${label}`).press('Enter');
    await page.getByLabel(`Segundos de ${label}`).fill(value);
    await page.getByLabel(`Segundos de ${label}`).press('Enter');
  };
  await set('Preparação', '0', '0');
  await set('Exercício', '0', '5');
  await set('Descanso', '0', '5');
  await set('Rodadas', null, '2');
  await expect(page.getByRole('button', { name: 'Exercício: 0:05' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rodadas: 2' })).toBeVisible();
  await page.getByRole('button', { name: /^Começar/ }).click();
  await page.getByRole('switch', { name: 'Travar a tela ao começar' }).click();
  // Marca a hora de cada troca do título da fase, de dentro da página.
  await page.evaluate(() => {
    const marks: { phase: string; at: number }[] = [];
    (window as unknown as { __marks: typeof marks }).__marks = marks;
    const known = ['Exercício', 'Descanso', 'Treino concluído'];
    let last = '';
    new MutationObserver(() => {
      const headings = [...document.querySelectorAll('[role="heading"], h1, h2')];
      const phase = headings.map((h) => h.textContent).find((t) => known.includes(t)) ?? '';
      if (phase !== last) {
        last = phase;
        if (phase) marks.push({ phase, at: performance.now() });
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.getByRole('heading', { name: 'Treino concluído' })).toBeVisible({
    timeout: 30_000,
  });
  const marks = await page.evaluate(
    () => (window as unknown as { __marks: { phase: string; at: number }[] }).__marks,
  );
  const phases = marks.filter((m) =>
    ['Exercício', 'Descanso', 'Treino concluído'].includes(m.phase),
  );
  const gaps = phases.slice(1).map((m, i) => m.at - (phases[i]?.at ?? 0));
  await report('trocas', { marks: phases, gaps });
  // Exercício, descanso, exercício e conclusão: 3 intervalos de 5 s.
  expect(phases.map((m) => m.phase)).toEqual([
    'Exercício',
    'Descanso',
    'Exercício',
    'Treino concluído',
  ]);
  // A tela lê o relógio a cada 250 ms: a troca aparece em até um passo (mais o desenho).
  for (const gap of gaps) expect(Math.abs(gap - 5_000)).toBeLessThan(400);
});

/** Memória do JS da página depois de forçar a coleta de lixo (CDP). */
async function heap(page: Page): Promise<number> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.collectGarbage');
  await cdp.send('Performance.enable');
  const { metrics } = await cdp.send('Performance.getMetrics');
  await cdp.detach();
  return (metrics.find((m) => m.name === 'JSHeapUsedSize')?.value ?? 0) / 1024 / 1024;
}

// Backup no tamanho máximo que o formato aceita (docs/spec/formato-cronobr.md).
const ROUTINES = 1_000;
const HISTORY = 20_000;
const MODALITIES = ['tabata', 'hiit', 'circuito', 'corrida', 'mobilidade', 'personalizada'];

function bigBackup(): string {
  const routine = (i: number) => ({
    id: `r${String(i)}`,
    name: `Rotina ${String(i)}`,
    modality: MODALITIES[i % MODALITIES.length],
    version: 1,
    prepSeconds: 10,
    cooldownSeconds: 0,
    blocks: [
      {
        id: 'b1',
        name: 'Rodadas',
        repeat: 8,
        restAfterSeconds: 0,
        steps: [
          { id: 'w', name: 'Exercício', kind: 'work', seconds: 20, reps: null },
          { id: 'r', name: 'Descanso', kind: 'rest', seconds: 10, reps: null },
        ],
      },
    ],
  });
  const day = 86_400_000;
  const end = Date.parse('2026-11-09T12:00:00.000Z');
  return JSON.stringify({
    format: 'cronobr',
    schemaVersion: 1,
    appVersion: '2.0.0',
    exportedAt: '2026-11-09T12:00:00.000Z',
    kind: 'backup',
    routines: Array.from({ length: ROUTINES }, (_, i) => ({
      ...routine(i),
      origin: 'custom',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:00:00.000Z',
    })),
    preferences: {},
    // Uns 13 treinos por dia ao longo de quatro anos e meio.
    history: Array.from({ length: HISTORY }, (_, i) => {
      const endedAt = end - Math.floor(i / 13) * day - (i % 13) * 3_600_000;
      return {
        id: `h${String(i)}`,
        routine: {
          ...routine(i % ROUTINES),
          origin: 'custom',
          createdAt: '2026-01-01T10:00:00.000Z',
          updatedAt: '2026-01-01T10:00:00.000Z',
        },
        status: i % 7 === 0 ? 'interrupted' : 'completed',
        startedAt: new Date(endedAt - 240_000).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
        activeMs: 240_000,
        workDone: 8,
        workTotal: 8,
        source: 'app',
      };
    }),
  });
}

test('biblioteca e histórico no máximo: importa, abre e rola sem travar', async ({ page }) => {
  test.setTimeout(240_000);
  const text = bigBackup();
  const mb = Buffer.byteLength(text) / 1024 / 1024;
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Tabata: / })).toBeVisible();
  const emptyHeapMb = await heap(page);
  await page.getByRole('button', { name: 'Ajustes' }).click();
  await page.getByRole('button', { name: 'Backup e transferência' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Abrir arquivo' }).click();
  const t0 = Date.now();
  await (
    await chooser
  ).setFiles({ name: 'grande.cronobr', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.getByText(`• ${String(ROUTINES)} rotinas novas`, { exact: false })).toBeVisible(
    {
      timeout: 60_000,
    },
  );
  const previewMs = Date.now() - t0;
  const t1 = Date.now();
  await page.getByRole('button', { name: 'Substituir tudo' }).click();
  await page.getByRole('button', { name: 'Substituir', exact: true }).click();
  await expect(page.getByText(/O backup foi restaurado/)).toBeVisible({ timeout: 120_000 });
  const restoreMs = Date.now() - t1;

  // Abrir de novo do zero, com tudo no banco.
  const t2 = Date.now();
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Tabata: / })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Rotina \d+, / }).first()).toBeVisible();
  const homeMs = Date.now() - t2;
  const homeHeapMb = await heap(page);

  const t3 = Date.now();
  await page.goto('/historico');
  await expect(page.getByRole('heading', { name: 'Histórico' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Rotina \d+/ }).first()).toBeVisible();
  const historyMs = Date.now() - t3;

  // Rolar até carregar mais páginas.
  const t4 = Date.now();
  for (let i = 0; i < 5; i += 1) await page.mouse.wheel(0, 4_000);
  const scrollMs = Date.now() - t4;

  const historyHeapMb = await heap(page);
  const data = {
    fileMb: mb,
    previewMs,
    restoreMs,
    homeMs,
    historyMs,
    scrollMs,
    emptyHeapMb,
    homeHeapMb,
    historyHeapMb,
  };
  await report('volume', data);
  expect(mb).toBeLessThan(16);
  expect(previewMs).toBeLessThan(20_000);
  expect(restoreMs).toBeLessThan(60_000);
  expect(homeMs).toBeLessThan(5_000);
  expect(historyMs).toBeLessThan(5_000);
  // Com tudo no banco, a Início e o Histórico seguram pouco mais que o app vazio: só o que
  // está à vista (antes do "Mostrar mais", a Início ia a 45 MB com 1.000 rotinas).
  expect(homeHeapMb - emptyHeapMb).toBeLessThan(10);
  expect(historyHeapMb - emptyHeapMb).toBeLessThan(10);
});
