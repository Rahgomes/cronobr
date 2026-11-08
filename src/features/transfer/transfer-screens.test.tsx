// Backup e importação pela tela (E05), com banco real e porta de arquivos falsa.
import { act, fireEvent, screen } from '@testing-library/react-native';

import type { Repos } from '@/data/repos';
import { createSession, start } from '@/domain/engine';
import type { HistoryEntry } from '@/domain/history';
import { presetById } from '@/domain/presets';
import { buildTimeline } from '@/domain/timeline';
import { readTransferFile, routineFileText, type TransferFile } from '@/domain/transfer';
import { RoutineOptions } from '@/features/routines/routine-options';
import { pt } from '@/i18n/messages/pt';
import { appRepos, fakeFiles, renderApp } from '@/test/app';
import { block, clockAt, must, routine, step } from '@/test/domain';
import { router } from '@/test/expo-router-mock';

import { BackupScreen } from './backup-screen';
import { ImportScreen } from './import-screen';
import { PORTABLE_PREF_KEYS } from './portable-prefs';
import { backupText } from './transfer-actions';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.clearAllMocks();
});

function activeSession() {
  const tabata = must(presetById('tabata-classic'));
  return start(createSession('ativa', tabata), buildTimeline(tabata), clockAt(0));
}

const settle = () =>
  act(async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  });

const pernas = routine({
  id: 'pernas',
  name: 'Pernas 🦵 ção',
  modality: 'circuito',
  prepSeconds: 10,
  blocks: [
    block({
      id: 'b1',
      name: 'Bloco A',
      repeat: 3,
      restAfterSeconds: 30,
      steps: [
        step({ id: 's1', kind: 'work', name: 'Agachamento', seconds: 40 }),
        step({ id: 's2', kind: 'work', name: 'Avanço', seconds: 30, sides: true }),
        step({ id: 's3', kind: 'rest', name: 'Pausa', seconds: 20 }),
      ],
    }),
  ],
  createdAt: Date.UTC(2026, 9, 1),
  updatedAt: Date.UTC(2026, 9, 2),
});

const treino: HistoryEntry = {
  id: 'h1',
  routine: pernas,
  status: 'completed',
  startedAt: Date.UTC(2026, 10, 7, 10),
  endedAt: Date.UTC(2026, 10, 7, 10, 20),
  activeMs: 1_200_000,
  workDone: 6,
  workTotal: 6,
  source: 'app',
  note: 'bom',
};

async function library(env?: Awaited<ReturnType<typeof appRepos>>) {
  const { repos, raw } = env ?? (await appRepos());
  await repos.routines.save(pernas);
  await repos.prefs.set('sessao', { view: 'lista', lockOnStart: false });
  await repos.prefs.set('favoritos', ['pernas', 'tabata-classic']);
  await repos.session.finish(treino);
  return { repos, raw };
}

const parsed = (text: string): TransferFile => {
  const result = readTransferFile(text, text.length, 0, pt.words);
  if (!result.ok) throw new Error(result.message);
  return result.file;
};

async function openImport(repos: Repos, text: string) {
  const files = fakeFiles({ 'file:///x.cronobr': text });
  await renderApp(<ImportScreen uri="file:///x.cronobr" />, repos, undefined, files);
  await settle();
  return files;
}

describe('exportar', () => {
  it('backup com histórico: rotinas, preferências portáveis e treinos; nome com a data', async () => {
    const { repos } = await library();
    await repos.prefs.set('cronometro', { laps: [1] });
    const files = fakeFiles();
    await renderApp(<BackupScreen />, repos, undefined, files);
    expect(await screen.findByText('1 treino registrado')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Exportar backup' }));
    expect(await screen.findByText('Backup pronto')).toBeOnTheScreen();
    const [out] = files.shared;
    expect(out?.name).toMatch(/^cronobr-backup-\d{4}-\d{2}-\d{2}\.cronobr$/);
    const file = parsed(must(out).text);
    expect(file).toMatchObject({
      kind: 'backup',
      routines: [pernas],
      prefs: {
        sessao: { view: 'lista', lockOnStart: false },
        favoritos: ['pernas', 'tabata-classic'],
      },
      history: [treino],
    });
    expect(file.kind === 'backup' && file.prefs).not.toHaveProperty('cronometro');
  });

  it('sem histórico quando a chave está desligada; falha ao gerar avisa', async () => {
    const { repos } = await library();
    const files = fakeFiles();
    await renderApp(<BackupScreen />, repos, undefined, files);
    await fireEvent(await screen.findByRole('switch', { name: 'Incluir histórico' }), 'press');
    await fireEvent.press(screen.getByRole('button', { name: 'Exportar backup' }));
    await settle();
    expect(parsed(must(files.shared[0]).text)).toMatchObject({ history: null });

    files.share.mockRejectedValueOnce(new Error('cancelou'));
    await fireEvent.press(screen.getByRole('button', { name: 'Exportar backup' }));
    expect(
      await screen.findByText('Não deu para gerar o backup. Tente de novo.'),
    ).toBeOnTheScreen();
  });

  it('"Abrir arquivo" leva o arquivo escolhido para a importação; desistir não faz nada', async () => {
    const { repos } = await appRepos();
    const files = fakeFiles();
    await renderApp(<BackupScreen />, repos, undefined, files);
    await fireEvent.press(await screen.findByRole('button', { name: 'Abrir arquivo' }));
    await settle();
    expect(router.push).not.toHaveBeenCalled();
    files.picker.next = 'content://x';
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir arquivo' }));
    await settle();
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/importar',
      params: { arquivo: 'content://x' },
    });
  });

  it('compartilhar uma rotina pelo menu "⋯": só a rotina, nome do arquivo pelo nome dela', async () => {
    const { repos } = await appRepos();
    const files = fakeFiles();
    const onClose = jest.fn();
    await renderApp(
      <RoutineOptions
        routine={pernas}
        actions={{ favorite: false, toggleFavorite: jest.fn(), edit: jest.fn() }}
        onClose={onClose}
      />,
      repos,
      undefined,
      files,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Compartilhar' }));
    await settle();
    expect(onClose).toHaveBeenCalled();
    expect(files.shared[0]?.name).toBe('pernas-cao.cronobr');
    expect(parsed(must(files.shared[0]).text)).toMatchObject({
      kind: 'routine',
      routine: { name: 'Pernas 🦵 ção', blocks: pernas.blocks },
    });
  });
});

describe('importar rotina', () => {
  const text = routineFileText(pernas, '2.0.0', Date.UTC(2026, 10, 8, 12));

  it('nova: prévia com tempo e etapas; adiciona; abrir de novo diz que já está', async () => {
    const { repos } = await appRepos();
    await openImport(repos, text);
    expect(screen.getByRole('header', { name: 'Pernas 🦵 ção' })).toBeOnTheScreen();
    expect(screen.getByText(/^Circuito · /)).toBeOnTheScreen();
    expect(screen.getByText(/^Exportado em .*CronôBR 2\.0\.0\.$/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar à biblioteca' }));
    expect(await screen.findByText(/está na sua biblioteca/)).toBeOnTheScreen();
    const [saved] = await repos.routines.list();
    expect(saved).toMatchObject({ id: 'pernas', origin: 'custom', blocks: pernas.blocks });

    await screen.unmount();
    await openImport(repos, text);
    expect(screen.getByText(/já está na sua biblioteca/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar como cópia' }));
    await settle();
    expect((await repos.routines.list()).map((r) => r.name)).toEqual([
      'Pernas 🦵 ção (cópia)',
      'Pernas 🦵 ção',
    ]);
  });

  it('conflito: substituir pede confirmação e atualiza a sua', async () => {
    const { repos } = await appRepos();
    await repos.routines.save({ ...pernas, prepSeconds: 0 });
    await openImport(repos, text);
    expect(screen.getByText(/com outra configuração/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Substituir a minha' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect((await repos.routines.get('pernas'))?.prepSeconds).toBe(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Substituir a minha' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Substituir' }));
    expect(await screen.findByText(/foi atualizada/)).toBeOnTheScreen();
    expect(await repos.routines.list()).toHaveLength(1);
    expect(await repos.routines.get('pernas')).toMatchObject({ prepSeconds: 10, version: 2 });
    await fireEvent.press(screen.getByRole('button', { name: 'Ir para o início' }));
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('falha ao gravar: avisa que nada mudou', async () => {
    const { repos, raw } = await appRepos();
    raw.failOn('INSERT INTO routines');
    await openImport(repos, text);
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar à biblioteca' }));
    expect(await screen.findByText('Não deu para importar. Nada foi alterado.')).toBeOnTheScreen();
    expect(await repos.routines.list()).toEqual([]);
  });
});

describe('arquivos recusados', () => {
  it.each([
    ['truncado', '{"format":"cronobr","sche', 'O arquivo está incompleto ou não é do CronôBR.'],
    ['de outro app', '{"nome":"x"}', 'Este arquivo não é do CronôBR.'],
    [
      'de versão futura',
      routineFileText(pernas, '9.0.0', 0).replace('"schemaVersion":1', '"schemaVersion":7'),
      /versão mais nova do CronôBR \(9\.0\.0\)/,
    ],
  ])('%s: explica e oferece escolher outro', async (_, text, message) => {
    const { repos } = await appRepos();
    await openImport(repos, text);
    expect(screen.getByText(message)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Escolher outro arquivo' })).toBeOnTheScreen();
    expect(await repos.routines.list()).toEqual([]);
  });

  it('grande demais não chega a ser lido', async () => {
    const { repos } = await appRepos();
    const files = await openImport(repos, 'x'.repeat(17 * 1024 * 1024));
    expect(screen.getByText(/O arquivo passa de 16 MB/)).toBeOnTheScreen();
    expect(files.read).toHaveBeenCalledWith('file:///x.cronobr', 16 * 1024 * 1024);
  });

  it('arquivo que some no caminho (link quebrado) avisa sem quebrar', async () => {
    const { repos } = await appRepos();
    await renderApp(<ImportScreen uri="content://sumiu" />, repos, undefined, fakeFiles());
    expect(await screen.findByText(/Não deu para abrir o arquivo/)).toBeOnTheScreen();
  });

  it('sem arquivo: escolher pelo seletor do sistema', async () => {
    const { repos } = await appRepos();
    const files = fakeFiles({ 'file:///r': routineFileText(pernas, '2.0.0', 0) });
    await renderApp(<ImportScreen />, repos, undefined, files);
    expect(screen.getByText(/Nada muda antes de você confirmar/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Escolher arquivo' }));
    await settle();
    expect(screen.queryByRole('header', { name: 'Pernas 🦵 ção' })).toBeNull();
    files.picker.next = 'file:///r';
    await fireEvent.press(screen.getByRole('button', { name: 'Escolher arquivo' }));
    expect(await screen.findByRole('header', { name: 'Pernas 🦵 ção' })).toBeOnTheScreen();
  });
});

describe('importar backup', () => {
  it('juntar: prévia com contagens e adaptações; importar de novo não duplica nada', async () => {
    const source = await library();
    await source.repos.prefs.set('avisos', { voice: true, sounds: { work: 'trombeta' } });
    const text = await backupText(source.repos, true);

    const { repos } = await appRepos();
    await repos.routines.save(routine({ id: 'minha', name: 'Minha' }));
    await openImport(repos, text);
    expect(screen.getByText('• 1 rotina nova')).toBeOnTheScreen();
    expect(screen.getByText('• 1 treino no histórico (1 novo)')).toBeOnTheScreen();
    expect(screen.getByText('• 3 preferências')).toBeOnTheScreen();
    expect(screen.getByText(/Som que não existe nesta versão/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Juntar com o que tenho' }));
    expect(await screen.findByText(/1 rotina entrou na biblioteca/)).toBeOnTheScreen();
    expect((await repos.routines.list()).map((r) => r.id)).toEqual(['pernas', 'minha']);
    expect(await repos.history.count()).toBe(1);
    // Juntar não mexe nas preferências daqui.
    expect(await repos.prefs.get('sessao')).toBeUndefined();

    await screen.unmount();
    await openImport(repos, text);
    expect(screen.getByText('• 0 rotinas novas')).toBeOnTheScreen();
    expect(screen.getByText('• 1 rotina que você já tem')).toBeOnTheScreen();
    expect(screen.getByText('• 1 treino no histórico (0 novos)')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Juntar com o que tenho' }));
    await settle();
    expect(await repos.routines.list()).toHaveLength(2);
    expect(await repos.history.count()).toBe(1);
  });

  it('conflito no backup: a chave escolhe entre manter as duas e usar a do arquivo', async () => {
    const source = await library();
    const text = await backupText(source.repos, false);
    const { repos } = await appRepos();
    await repos.routines.save({ ...pernas, prepSeconds: 0 });
    await openImport(repos, text);
    expect(screen.getByText('• 1 rotina com diferença')).toBeOnTheScreen();
    expect(screen.getByText('• Sem histórico')).toBeOnTheScreen();
    await fireEvent(
      screen.getByRole('switch', { name: 'Usar a versão do arquivo nas rotinas com diferença' }),
      'press',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Juntar com o que tenho' }));
    await settle();
    expect(await repos.routines.list()).toHaveLength(1);
    expect((await repos.routines.get('pernas'))?.prepSeconds).toBe(10);
  });

  it('substituir com treino em andamento fica bloqueado', async () => {
    const source = await library();
    const text = await backupText(source.repos, true);
    const { repos } = await appRepos();
    await repos.session.save(activeSession());
    await openImport(repos, text);
    expect(screen.getByText(/Para substituir tudo, termine ou encerre/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Substituir tudo' })).toBeNull();
  });
});

describe('restaurar e desfazer', () => {
  it('Android → iPhone: a biblioteca volta igual em outro aparelho, e dá para desfazer', async () => {
    const origin = await library();
    const text = await backupText(origin.repos, true);

    // Outro aparelho, com coisas próprias.
    const target = await appRepos();
    await target.repos.routines.save(routine({ id: 'local', name: 'Local' }));
    await target.repos.prefs.set('sessao', { view: 'foco', lockOnStart: true });
    await openImport(target.repos, text);
    await fireEvent.press(screen.getByRole('button', { name: 'Substituir tudo' }));
    expect(screen.getByRole('header', { name: 'Substituir tudo?' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Substituir' }));
    expect(await screen.findByText(/O backup foi restaurado/)).toBeOnTheScreen();

    const [a, b] = await Promise.all([
      origin.repos.transfer.snapshot(PORTABLE_PREF_KEYS, true),
      target.repos.transfer.snapshot(PORTABLE_PREF_KEYS, true),
    ]);
    // Tempos, ordem, blocos, repetições, preferências e histórico iguais.
    expect(b).toEqual(a);

    // Desfazer pela tela de Backup.
    await screen.unmount();
    await renderApp(<BackupScreen />, target.repos, undefined, fakeFiles());
    expect(
      await screen.findByRole('header', { name: 'Desfazer a última restauração' }),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao estado anterior' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Desfazer' }));
    expect(await screen.findByText(/tudo voltou a como estava antes/)).toBeOnTheScreen();
    expect((await target.repos.routines.list()).map((r) => r.id)).toEqual(['local']);
    expect(await target.repos.prefs.get('sessao')).toEqual({ view: 'foco', lockOnStart: true });
    expect(await target.repos.history.count()).toBe(0);
    expect(screen.queryByRole('header', { name: 'Desfazer a última restauração' })).toBeNull();
  });

  it('desfazer com treino em andamento avisa e não muda nada', async () => {
    const { repos } = await appRepos();
    await repos.transfer.apply(
      { replace: true, routines: [], history: [], replaceHistory: false, prefs: null },
      PORTABLE_PREF_KEYS,
      await backupText(repos, true),
    );
    await repos.session.save(activeSession());
    await renderApp(<BackupScreen />, repos, undefined, fakeFiles());
    await fireEvent.press(await screen.findByRole('button', { name: 'Voltar ao estado anterior' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Desfazer' }));
    expect(await screen.findByText(/Há um treino em andamento/)).toBeOnTheScreen();
    expect(await repos.transfer.restorePoint()).not.toBeNull();
  });
});
