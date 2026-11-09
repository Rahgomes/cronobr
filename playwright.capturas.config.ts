import { defineConfig, devices } from '@playwright/test';

// Capturas das telas reais (E06 D/E): `npx playwright test -c playwright.capturas.config.ts`.
// Saem em docs/imagens/capturas/<tema>/. Não é teste: só fotografa.
const env = process.env as Record<string, string | undefined>;
const PORT = Number(env.E2E_PORT ?? 18441);

export default defineConfig({
  testDir: 'capturas',
  workers: 1,
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}`, locale: 'pt-BR' },
  projects: [
    {
      name: 'escuro',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', colorScheme: 'dark' },
    },
    {
      name: 'claro',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', colorScheme: 'light' },
    },
  ],
  webServer: {
    command: `npx -y serve@14 dist -c ../e2e/serve.json -l ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
  },
});
