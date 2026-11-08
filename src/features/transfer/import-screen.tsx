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
import { useLanguage, useT } from '@/i18n/i18n-context';
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

function RoutinePreview({ routine }: { routine: Routine }) {
  const t = useT();
  const summary = summarize(buildTimeline(routine));
  return (
    <>
      <Text variant="label" accessibilityRole="header">
        {routine.name}
      </Text>
      <Text color="textMuted">
        {`${t.modality[routine.modality].label} · ${clock(summary.knownMs)} · ${t.transfer.exercises(summary.workCount)} · ${t.transfer.blocks(routine.blocks.length)}`}
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
  const language = useLanguage();
  const exported = new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
    setState({
      status: 'ready',
      prepared: await prepareFromUri(repos, port, target, t.words, t.transfer),
    });
  }

  // Aberto com um arquivo (do seletor ou de outro app): lê assim que a tela monta.
  useEffect(() => {
    if (!uri) return;
    let active = true;
    void prepareFromUri(repos, port, uri, t.words, t.transfer).then((prepared) => {
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
        error instanceof ActiveSessionError ? t.transfer.activeRestore : t.transfer.importFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  const chooseButton = (
    <Button
      label={state.status === 'idle' ? t.transfer.choose : t.transfer.chooseAnother}
      kind={state.status === 'idle' ? 'primary' : 'secondary'}
      onPress={() => {
        void choose();
      }}
    />
  );

  let body: ReactNode = null;
  let footer: ReactNode = null;

  if (state.status === 'idle') {
    body = <Text color="textMuted">{t.transfer.importIntro}</Text>;
    footer = chooseButton;
  } else if (state.status === 'loading') {
    body = <Text color="textMuted">{t.transfer.reading}</Text>;
  } else if (state.status === 'done') {
    body = <Notice tone="positive">{[t.transfer.done, ...state.lines].join(' ')}</Notice>;
    footer = (
      <Button
        label={t.transfer.goHome}
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
              {t.transfer.origin(
                exported.format(Date.parse(prepared.meta.exportedAt)),
                prepared.meta.appVersion,
              )}
            </Text>
          </Card>
          {item.status === 'same' ? <Text>{t.transfer.alreadyHave}</Text> : null}
          {item.status === 'conflict' ? (
            <Text>{t.transfer.conflict(item.existing?.name ?? item.routine.name)}</Text>
          ) : null}
        </>
      );
      footer = (
        <View style={styles.actions}>
          {item.status === 'new' ? (
            <Button
              label={t.transfer.add}
              loading={busy}
              onPress={() => {
                run('add', t.transfer.added(item.routine.name));
              }}
            />
          ) : (
            <Button
              label={t.transfer.addCopy}
              loading={busy}
              onPress={() => {
                run('copy', t.transfer.copied(item.routine.name));
              }}
            />
          )}
          {item.status === 'conflict' ? (
            <Button
              label={t.transfer.replaceMine}
              kind="secondary"
              onPress={() => {
                dialog.alert(t.transfer.replaceRoutineTitle, t.transfer.replaceRoutineBody, [
                  { text: t.transfer.cancel, style: 'cancel' },
                  {
                    text: t.transfer.replace,
                    style: 'destructive',
                    onPress: () => {
                      run('update', t.transfer.updated(item.routine.name));
                    },
                  },
                ]);
              }}
            />
          ) : null}
        </View>
      );
    } else {
      const { summary, history } = prepared;
      const lines = [
        t.transfer.newRoutines(summary.routines.new),
        ...(summary.routines.same > 0 ? [t.transfer.sameRoutines(summary.routines.same)] : []),
        ...(summary.routines.conflict > 0
          ? [t.transfer.conflictRoutines(summary.routines.conflict)]
          : []),
        summary.history
          ? t.transfer.history(summary.history.total, summary.history.fresh)
          : t.transfer.noHistory,
        t.transfer.preferences(prepared.prefCount),
      ];
      body = (
        <>
          <Card>
            <Text variant="label" accessibilityRole="header">
              {t.transfer.backup}
            </Text>
            <Text variant="caption" color="textMuted">
              {t.transfer.origin(
                exported.format(Date.parse(prepared.meta.exportedAt)),
                prepared.meta.appVersion,
              )}
            </Text>
            <Lines lines={lines} />
          </Card>
          {prepared.notes.length > 0 ? (
            <Notice tone="soft">{prepared.notes.join(' ')}</Notice>
          ) : null}
          {summary.routines.conflict > 0 ? (
            <View style={styles.option}>
              <View style={styles.grow}>
                <Text variant="label">{t.transfer.useFile}</Text>
                <Text variant="caption" color="textMuted">
                  {t.transfer.useFileHint}
                </Text>
              </View>
              <Switch
                value={conflicts === 'update'}
                accessibilityLabel={t.transfer.useFileLabel}
                onValueChange={(value) => {
                  setConflicts(value ? 'update' : 'copy');
                }}
              />
            </View>
          ) : null}
          <Text color="textMuted">{t.transfer.mergeHint}</Text>
          {prepared.sessionActive ? <Notice tone="alert">{t.transfer.activeReplace}</Notice> : null}
        </>
      );
      footer = (
        <View style={styles.actions}>
          <Button
            label={t.transfer.merge}
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
              void apply(merged, [t.transfer.merged(merged.routines.length)]);
            }}
          />
          {prepared.sessionActive ? null : (
            <Button
              label={t.transfer.replaceAll}
              kind="secondary"
              onPress={() => {
                dialog.alert(
                  t.transfer.replaceAllTitle,
                  t.transfer.replaceAllBody(history !== null),
                  [
                    { text: t.transfer.cancel, style: 'cancel' },
                    {
                      text: t.transfer.replace,
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
                          [t.transfer.restored],
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
      <TopBar title={t.transfer.importTitle} />
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
