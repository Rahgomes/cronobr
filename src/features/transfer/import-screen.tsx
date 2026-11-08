// Importar um arquivo .cronobr (E05): lê, valida, mostra a prévia e só então grava, de uma vez.
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDataChanged, useRepos } from '@/data/data-context';
import { ActiveSessionError } from '@/data/repos';
import { clock } from '@/domain/format';
import type { Routine } from '@/domain/routine';
import { buildTimeline, summarize } from '@/domain/timeline';
import {
  mergeOps,
  replaceOps,
  shareOps,
  type ConflictChoice,
  type ShareChoice,
  type TransferOps,
} from '@/domain/transfer-plan';
import { idGenerator } from '@/features/editor/ids';
import { MODALITY } from '@/features/modality/catalog';
import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { dialog } from '@/ui/dialog';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { Switch } from '@/ui/switch';
import { Text } from '@/ui/text';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { useFilePort } from './file-port';
import { PORTABLE_PREF_KEYS } from './portable-prefs';
import { backupText, prepareFromUri, type Prepared } from './transfer-actions';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; prepared: Prepared }
  | { status: 'done'; lines: string[] };

const EXPORTED = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const plural = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;

function origin(meta: { appVersion: string; exportedAt: string }) {
  return `Exportado em ${EXPORTED.format(Date.parse(meta.exportedAt))}, CronôBR ${meta.appVersion}.`;
}

function RoutinePreview({ routine }: { routine: Routine }) {
  const summary = summarize(buildTimeline(routine));
  return (
    <>
      <Text variant="label" accessibilityRole="header">
        {routine.name}
      </Text>
      <Text color="textMuted">
        {`${MODALITY[routine.modality].label} · ${clock(summary.knownMs)} · ${plural(summary.workCount, 'exercício', 'exercícios')} · ${plural(routine.blocks.length, 'bloco', 'blocos')}`}
      </Text>
    </>
  );
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line) => (
        <Text key={line} color="textMuted">
          {`• ${line}`}
        </Text>
      ))}
    </>
  );
}

export function ImportScreen({ uri }: { uri?: string | undefined }) {
  const repos = useRepos();
  const t = useT();
  const changed = useDataChanged();
  const port = useFilePort();
  const [state, setState] = useState<State>(uri ? { status: 'loading' } : { status: 'idle' });
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictChoice>('copy');

  async function open(target: string) {
    setFailure(null);
    setState({ status: 'loading' });
    setState({ status: 'ready', prepared: await prepareFromUri(repos, port, target, t.words) });
  }

  // Aberto com um arquivo (do seletor ou de outro app): lê assim que a tela monta.
  useEffect(() => {
    if (!uri) return;
    let active = true;
    void prepareFromUri(repos, port, uri, t.words).then((prepared) => {
      if (active) setState({ status: 'ready', prepared });
    });
    return () => {
      active = false;
    };
  }, [repos, port, uri, t]);

  async function choose() {
    const picked = await port.pick();
    if (picked) await open(picked.uri);
  }

  async function apply(ops: TransferOps, lines: string[], restore = false) {
    setBusy(true);
    setFailure(null);
    try {
      const point = restore ? await backupText(repos, true) : null;
      await repos.transfer.apply(ops, PORTABLE_PREF_KEYS, point);
      changed();
      setState({ status: 'done', lines });
    } catch (error) {
      setFailure(
        error instanceof ActiveSessionError
          ? 'Há um treino em andamento. Termine ou encerre o treino antes de restaurar.'
          : 'Não deu para importar. Nada foi alterado.',
      );
    } finally {
      setBusy(false);
    }
  }

  const chooseButton = (
    <Button
      label={state.status === 'idle' ? 'Escolher arquivo' : 'Escolher outro arquivo'}
      kind={state.status === 'idle' ? 'primary' : 'secondary'}
      onPress={() => {
        void choose();
      }}
    />
  );

  let body: ReactNode = null;
  let footer: ReactNode = null;

  if (state.status === 'idle') {
    body = (
      <Text color="textMuted">
        Escolha um arquivo .cronobr: uma rotina que alguém mandou ou um backup seu. Nada muda antes
        de você confirmar.
      </Text>
    );
    footer = chooseButton;
  } else if (state.status === 'loading') {
    body = <Text color="textMuted">Lendo o arquivo…</Text>;
  } else if (state.status === 'done') {
    body = <Notice tone="positive">{['Pronto.', ...state.lines].join(' ')}</Notice>;
    footer = (
      <Button
        label="Ir para o início"
        onPress={() => {
          router.replace('/');
        }}
      />
    );
  } else {
    const { prepared } = state;
    if (prepared.kind === 'error') {
      body = <Notice tone="danger">{[prepared.message, ...prepared.details].join('\n')}</Notice>;
      footer = chooseButton;
    } else if (prepared.kind === 'routine') {
      const { item } = prepared;
      const run = (choice: ShareChoice, line: string) => {
        void apply(shareOps(item, choice, idGenerator(), Date.now(), t.words), [line]);
      };
      body = (
        <>
          <Card>
            <RoutinePreview routine={item.routine} />
            <Text variant="caption" color="textMuted">
              {origin(prepared.meta)}
            </Text>
          </Card>
          {item.status === 'same' ? (
            <Text>
              Esta rotina já está na sua biblioteca. Dá para adicionar uma cópia mesmo assim.
            </Text>
          ) : null}
          {item.status === 'conflict' ? (
            <Text>
              {`Você já tem "${item.existing?.name ?? item.routine.name}" com outra configuração. Adicione como cópia ou substitua a sua.`}
            </Text>
          ) : null}
        </>
      );
      footer = (
        <View style={styles.actions}>
          {item.status === 'new' ? (
            <Button
              label="Adicionar à biblioteca"
              loading={busy}
              onPress={() => {
                run('add', `"${item.routine.name}" está na sua biblioteca.`);
              }}
            />
          ) : (
            <Button
              label="Adicionar como cópia"
              loading={busy}
              onPress={() => {
                run('copy', `A cópia de "${item.routine.name}" está na sua biblioteca.`);
              }}
            />
          )}
          {item.status === 'conflict' ? (
            <Button
              label="Substituir a minha"
              kind="secondary"
              onPress={() => {
                dialog.alert(
                  'Substituir a sua rotina?',
                  'Ela fica igual à do arquivo. O histórico de treinos não muda.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Substituir',
                      style: 'destructive',
                      onPress: () => {
                        run('update', `"${item.routine.name}" foi atualizada.`);
                      },
                    },
                  ],
                );
              }}
            />
          ) : null}
        </View>
      );
    } else {
      const { summary, history } = prepared;
      const lines = [
        plural(summary.routines.new, 'rotina nova', 'rotinas novas'),
        ...(summary.routines.same > 0
          ? [plural(summary.routines.same, 'rotina que você já tem', 'rotinas que você já tem')]
          : []),
        ...(summary.routines.conflict > 0
          ? [plural(summary.routines.conflict, 'rotina com diferença', 'rotinas com diferença')]
          : []),
        summary.history
          ? `${plural(summary.history.total, 'treino', 'treinos')} no histórico (${plural(summary.history.fresh, 'novo', 'novos')})`
          : 'Sem histórico',
        plural(prepared.prefCount, 'preferência', 'preferências'),
      ];
      body = (
        <>
          <Card>
            <Text variant="label" accessibilityRole="header">
              Backup
            </Text>
            <Text variant="caption" color="textMuted">
              {origin(prepared.meta)}
            </Text>
            <Lines lines={lines} />
          </Card>
          {prepared.notes.length > 0 ? (
            <Notice tone="soft">{prepared.notes.join(' ')}</Notice>
          ) : null}
          {summary.routines.conflict > 0 ? (
            <View style={styles.option}>
              <View style={styles.grow}>
                <Text variant="label">Usar a versão do arquivo</Text>
                <Text variant="caption" color="textMuted">
                  Nas rotinas com diferença. Desligado, as duas ficam (a do arquivo vira cópia).
                </Text>
              </View>
              <Switch
                value={conflicts === 'update'}
                accessibilityLabel="Usar a versão do arquivo nas rotinas com diferença"
                onValueChange={(value) => {
                  setConflicts(value ? 'update' : 'copy');
                }}
              />
            </View>
          ) : null}
          <Text color="textMuted">
            Juntar só acrescenta: suas rotinas, preferências e treinos continuam. Substituir deixa
            tudo igual ao arquivo e guarda uma cópia do estado atual para desfazer.
          </Text>
          {prepared.sessionActive ? (
            <Notice tone="alert">
              Há um treino em andamento. Para substituir tudo, termine ou encerre o treino antes.
            </Notice>
          ) : null}
        </>
      );
      footer = (
        <View style={styles.actions}>
          <Button
            label="Juntar com o que tenho"
            loading={busy}
            onPress={() => {
              const merged = mergeOps(
                prepared.items,
                history,
                conflicts,
                idGenerator(),
                Date.now(),
                t.words,
              );
              void apply(merged, [
                `${plural(merged.routines.length, 'rotina entrou', 'rotinas entraram')} na biblioteca.`,
              ]);
            }}
          />
          {prepared.sessionActive ? null : (
            <Button
              label="Substituir tudo"
              kind="secondary"
              onPress={() => {
                dialog.alert(
                  'Substituir tudo?',
                  `Suas rotinas e preferências ficam iguais às do backup${history ? ', e o histórico também' : ''}. Uma cópia do estado atual fica guardada em Backup para desfazer.`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Substituir',
                      style: 'destructive',
                      onPress: () => {
                        void apply(
                          replaceOps({
                            kind: 'backup',
                            meta: prepared.meta,
                            routines: prepared.routines,
                            prefs: prepared.prefs,
                            history,
                          }),
                          ['O backup foi restaurado. Dá para desfazer em Backup.'],
                          true,
                        );
                      },
                    },
                  ],
                );
              }}
            />
          )}
        </View>
      );
    }
  }

  return (
    <Screen footer={footer}>
      <TopBar title="Importar" />
      <View style={styles.content}>
        {body}
        {failure ? <Notice tone="danger">{failure}</Notice> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  actions: { gap: space.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
});
