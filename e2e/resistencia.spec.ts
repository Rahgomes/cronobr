import { expect, test, type Page } from '@playwright/test';

// Resistência (E07 E) no Chromium real, em tempo real (o relógio de áudio não obedece ao
// page.clock): 10 temporizadores rodando, treino com cadência e a tela "bloqueada" (aba oculta)
// várias vezes. Mede o que o app segura: áudios abertos, intervalos e timeouts vivos, nós do DOM,
// listeners e a memória do JS depois da coleta de lixo.

interface Probe {
  contexts: number;
  oscillators: number;
  intervals: number;
  timeouts: number;
}

/** Contadores instalados antes do app: AudioContext criados, osciladores e timers vivos. */
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const probe = { contexts: 0, oscillators: 0, intervals: 0, timeouts: 0 };
    (window as unknown as { __probe: typeof probe }).__probe = probe;
    const Base = window.AudioContext;
    window.AudioContext = class extends Base {
      constructor(options?: AudioContextOptions) {
        super(options);
        probe.contexts += 1;
        (window as unknown as { __ctx: AudioContext }).__ctx = this;
      }
    };
    const createOscillator = BaseAudioContext.prototype.createOscillator;
    BaseAudioContext.prototype.createOscillator = function oscillator(this: BaseAudioContext) {
      probe.oscillators += 1;
      return createOscillator.call(this);
    };
    const live = new Set<number>();
    const setI = window.setInterval.bind(window);
    const clearI = window.clearInterval.bind(window);
    window.setInterval = ((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
      const id = setI(fn, ms, ...args);
      live.add(id);
      probe.intervals = live.size;
      return id;
    }) as typeof window.setInterval;
    window.clearInterval = ((id?: number) => {
      if (id !== undefined) live.delete(id);
      probe.intervals = live.size;
      clearI(id);
    }) as typeof window.clearInterval;
    const pending = new Set<number>();
    const setT = window.setTimeout.bind(window);
    const clearT = window.clearTimeout.bind(window);
    window.setTimeout = ((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
      const id = setT(
        (...inner: unknown[]) => {
          pending.delete(id);
          probe.timeouts = pending.size;
          if (typeof fn === 'function') (fn as (...a: unknown[]) => void)(...inner);
        },
        ms,
        ...args,
      );
      pending.add(id);
      probe.timeouts = pending.size;
      return id;
    }) as typeof window.setTimeout;
    window.clearTimeout = ((id?: number) => {
      if (id !== undefined) pending.delete(id);
      probe.timeouts = pending.size;
      clearT(id);
    }) as typeof window.clearTimeout;
  });
}

const probe = (page: Page) =>
  page.evaluate(() => ({ ...(window as unknown as { __probe: Probe }).__probe }));

/** Simula bloquear e desbloquear a tela: o RN-web ouve o visibilitychange da página. */
async function setHidden(page: Page, hidden: boolean) {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (value ? 'hidden' : 'visible'),
    });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

async function createTimer(page: Page, name: string) {
  await page.getByRole('button', { name: 'Novo temporizador' }).click();
  await page.getByLabel('Nome').fill(name);
  await page.getByRole('button', { name: 'Iniciar 5:00' }).click();
}

test('10 temporizadores + treino com cadência + tela bloqueada: nada acumula', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'celular-claro', 'mede uma vez; o tema não muda o consumo');
  test.setTimeout(240_000);
  await instrument(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const metrics = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    const { metrics: list } = await cdp.send('Performance.getMetrics');
    const get = (name: string) => list.find((m) => m.name === name)?.value ?? 0;
    return {
      heapMb: get('JSHeapUsedSize') / 1024 / 1024,
      nodes: get('Nodes'),
      listeners: get('JSEventListeners'),
    };
  };

  await page.goto('/');
  // Rotina com cadência, como no cadencia.spec.
  await page.getByRole('button', { name: /^Tabata: / }).click();
  await page.getByRole('button', { name: 'Opções de Tabata clássico' }).click();
  await page.getByRole('button', { name: 'Editar uma cópia' }).click();
  await page.getByLabel('Nome da rotina').fill('Tabata ritmado');
  await page.getByRole('button', { name: /^Exercício, 0:20\. Editar etapa$/ }).click();
  await page.getByRole('switch', { name: 'Metrônomo nesta etapa' }).click();
  await page.getByRole('button', { name: 'Fechar' }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  // Sem recarregar a página no meio: a gravação ainda pode estar na fila.
  await expect(page.getByRole('button', { name: /^Tabata ritmado, / })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('button', { name: 'Temporizadores' }).click();
  for (let i = 1; i <= 10; i += 1) await createTimer(page, `T${String(i)}`);
  await expect(page.getByRole('timer', { name: /Rodando$/ })).toHaveCount(10);
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('button', { name: /^Tabata: / }).click();
  await page.getByRole('button', { name: /^Tabata ritmado, / }).click();
  await page.getByRole('switch', { name: 'Travar a tela ao começar' }).click();
  await page.getByRole('button', { name: 'Começar', exact: true }).click();
  await expect(page.getByLabel('Cadência 90 BPM')).toBeVisible({ timeout: 15_000 });

  const before = { ...(await metrics()), ...(await probe(page)) };
  const samples: (Probe & { heapMb: number; nodes: number; listeners: number })[] = [];
  // 6 ciclos de 10 s: 7 s com a tela à vista e 3 s "bloqueada".
  for (let i = 0; i < 6; i += 1) {
    await page.waitForTimeout(7_000);
    await setHidden(page, true);
    const hidden = (await probe(page)).oscillators;
    await page.waitForTimeout(3_000);
    // Bloqueada, o pulso para (D104/D109): nenhum clique novo.
    expect((await probe(page)).oscillators - hidden).toBeLessThanOrEqual(0);
    await setHidden(page, false);
    samples.push({ ...(await metrics()), ...(await probe(page)) });
  }
  const after = samples.at(-1);
  if (!after) throw new Error('sem amostra');
  // Números para o doc da E07 (seção do lote E), no relatório do Playwright.
  await info.attach('consumo', {
    body: JSON.stringify({ before, samples }, null, 2),
    contentType: 'application/json',
  });

  // Um áudio só para o treino inteiro, por mais que a tela bloqueie.
  expect(after.contexts).toBe(1);
  // Temporizadores: um intervalo só para os 10 (D95); sessão: o dela.
  expect(Math.max(...samples.map((s) => s.intervals))).toBeLessThanOrEqual(before.intervals);
  // Timeouts vivos limitados (fila de 1,5 s do pulso + laço + os do app), sem crescer.
  expect(Math.max(...samples.map((s) => s.timeouts))).toBeLessThan(40);
  expect(after.nodes - before.nodes).toBeLessThan(200);
  expect(after.listeners - before.listeners).toBeLessThan(50);
  expect(after.heapMb - before.heapMb).toBeLessThan(3);
  // O pulso tocou (houve exercício com cadência nesses 60 s).
  expect(after.oscillators).toBeGreaterThan(before.oscillators);
});

test('áudio suspenso no meio (saída trocada, ligação): o metrônomo retoma sozinho', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'celular-claro', 'mede uma vez');
  await instrument(page);
  await page.goto('/metronomo');
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.getByRole('button', { name: 'Parar' })).toBeVisible();
  await page.waitForTimeout(1_000);
  const state = () =>
    page.evaluate(() => (window as unknown as { __ctx: AudioContext }).__ctx.state);
  // O que o sistema faz numa ligação ou troca de saída: suspende o áudio do app.
  await page.evaluate(() => (window as unknown as { __ctx: AudioContext }).__ctx.suspend());
  expect(await state()).toBe('suspended');
  await expect.poll(state, { timeout: 3_000 }).toBe('running');
  const resumed = (await probe(page)).oscillators;
  await page.waitForTimeout(2_000);
  expect((await probe(page)).oscillators).toBeGreaterThan(resumed);
  expect((await probe(page)).contexts).toBe(1);
});
