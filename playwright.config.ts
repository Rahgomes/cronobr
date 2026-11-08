import { defineConfig, devices } from '@playwright/test';

// E2E no build web exportado (dist/), servido localmente. Comportamento nativo (segundo plano,
// áudio, notificação) não se prova aqui: vai para o roteiro de aparelho (Maestro).
const PORT = Number(process.env.E2E_PORT ?? 18440);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    ...(process.env.CHROME_PATH
      ? { launchOptions: { executablePath: process.env.CHROME_PATH } }
      : {}),
  },
  projects: [
    { name: 'celular-escuro', use: { ...devices['Pixel 7'], colorScheme: 'dark' } },
    { name: 'celular-claro', use: { ...devices['Pixel 7'], colorScheme: 'light' } },
  ],
  webServer: {
    command: `npx -y serve@14 dist -s -l ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
