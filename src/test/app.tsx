// Monta uma tela como no app: área segura, tema, banco de verdade (node:sqlite) e DialogHost.
import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DataProvider } from '@/data/data-context';
import type { Repos } from '@/data/repos';
import { sqliteRepos } from '@/data/sqlite-repos';
import type { Instant } from '@/domain/engine';
import { DialogHost } from '@/ui/dialog';
import { ThemeProvider } from '@/ui/theme-context';

import { testDb } from './data';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export async function appRepos() {
  const { db, raw } = await testDb();
  return { db, raw, repos: sqliteRepos(db) };
}

export async function renderApp(ui: ReactElement, repos: Repos) {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ThemeProvider mode="dark">
        <DataProvider open={() => Promise.resolve(repos)}>
          {ui}
          <DialogHost />
        </DataProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  return screen;
}

/** Relógio controlado: `mono` e `wall` andam juntos, a não ser que o teste mexa em um só. */
export function fakeClock(start = 0, wallOffset = 1_700_000_000_000) {
  const state = { mono: start, wall: start + wallOffset };
  return {
    now: (): Instant => ({ ...state }),
    advance(ms: number) {
      state.mono += ms;
      state.wall += ms;
    },
    /** Só o relógio civil anda (aparelho dormiu, ou hora mudada à mão). */
    advanceWall(ms: number) {
      state.wall += ms;
    },
    /** Processo novo: o monotônico recomeça, o civil continua. */
    reboot() {
      state.mono = 0;
    },
  };
}
