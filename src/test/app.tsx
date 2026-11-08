// Monta uma tela como no app: área segura, tema, banco de verdade (node:sqlite) e DialogHost.
import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DataProvider } from '@/data/data-context';
import type { Repos } from '@/data/repos';
import { sqliteRepos } from '@/data/sqlite-repos';
import type { Instant } from '@/domain/engine';
import { CueProvider } from '@/features/cues/cue-context';
import type { CuePort } from '@/features/cues/port';
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

export async function renderApp(ui: ReactElement, repos: Repos, port?: CuePort) {
  const content = (
    <>
      {ui}
      <DialogHost />
    </>
  );
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ThemeProvider mode="dark">
        <DataProvider open={() => Promise.resolve(repos)}>
          {port ? <CueProvider port={port}>{content}</CueProvider> : content}
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

/** Porta de avisos falsa: registra o que a tela pediu para tocar, agendar e manter acesa. */
export function fakePort() {
  const port = {
    play: jest.fn<undefined, Parameters<CuePort['play']>>(),
    preview: jest.fn<undefined, Parameters<CuePort['preview']>>(),
    schedule: jest.fn<undefined, Parameters<CuePort['schedule']>>(),
    keepAwake: jest.fn<undefined, Parameters<CuePort['keepAwake']>>(),
  };
  return port satisfies CuePort;
}
