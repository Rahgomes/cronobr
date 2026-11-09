// Monta uma tela como no app: área segura, tema, banco de verdade (node:sqlite) e DialogHost.
import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DataProvider } from '@/data/data-context';
import type { Repos } from '@/data/repos';
import { sqliteRepos } from '@/data/sqlite-repos';
import type { Instant } from '@/domain/engine';
import { CueProvider } from '@/features/cues/cue-context';
import type { CuePort, NotifyState } from '@/features/cues/port';
import { FilePortProvider, type FilePort } from '@/features/transfer/file-port';
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

export async function renderApp(ui: ReactElement, repos: Repos, port?: CuePort, files?: FilePort) {
  const inner = (
    <>
      {ui}
      <DialogHost />
    </>
  );
  const content = files ? <FilePortProvider port={files}>{inner}</FilePortProvider> : inner;
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
export function fakePort(notify: NotifyState = 'on') {
  const port = {
    notifications: jest.fn(() => Promise.resolve(notify)),
    openSettings: jest.fn<undefined, []>(),
    play: jest.fn<undefined, Parameters<CuePort['play']>>(),
    preview: jest.fn<undefined, Parameters<CuePort['preview']>>(),
    schedule: jest.fn<undefined, Parameters<CuePort['schedule']>>(),
    keepAwake: jest.fn<undefined, Parameters<CuePort['keepAwake']>>(),
  };
  return port satisfies CuePort;
}

/** Porta de arquivos falsa: guarda o que foi compartilhado e serve arquivos por endereço. */
export function fakeFiles(files: Record<string, string> = {}) {
  const shared: { name: string; text: string }[] = [];
  /** Próximo arquivo que o seletor devolve (null: a pessoa desistiu). */
  const picker: { next: string | null } = { next: null };
  const port = {
    shared,
    files,
    picker,
    share: jest.fn((name: string, text: string) => {
      shared.push({ name, text });
      return Promise.resolve();
    }),
    pick: jest.fn(() => Promise.resolve(picker.next ? { uri: picker.next } : null)),
    read: jest.fn((uri: string, maxBytes: number) => {
      const text = files[uri];
      if (text === undefined) return Promise.reject(new Error(`sem arquivo ${uri}`));
      const size = new TextEncoder().encode(text).length;
      return Promise.resolve({ text: size > maxBytes ? '' : text, size });
    }),
  } satisfies FilePort & Record<string, unknown>;
  return port;
}
