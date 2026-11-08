// Backup e transferência (E05): exportar, abrir um arquivo e desfazer a última restauração.
// Tudo offline: o arquivo sai e entra pelo compartilhar e pelo seletor do sistema.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDataChanged, useRepos } from '@/data/data-context';
import { ActiveSessionError } from '@/data/repos';
import { readTransferFile } from '@/domain/transfer';
import { replaceOps } from '@/domain/transfer-plan';
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
import { exportBackup } from './transfer-actions';

export function BackupScreen() {
  const repos = useRepos();
  const t = useT();
  const language = useLanguage();
  const when = new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const changed = useDataChanged();
  const port = useFilePort();
  const [withHistory, setWithHistory] = useState(true);
  const [historyCount, setHistoryCount] = useState(0);
  const [restorePoint, setRestorePoint] = useState<{ createdAt: number; text: string } | null>(
    null,
  );
  const [exported, setExported] = useState(false);
  const [message, setMessage] = useState<{ tone: 'danger' | 'positive'; text: string } | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([repos.history.count(), repos.transfer.restorePoint()]).then(
        ([count, point]) => {
          if (!active) return;
          setHistoryCount(count);
          setRestorePoint(point);
        },
      );
      return () => {
        active = false;
      };
    }, [repos]),
  );

  async function runExport() {
    setMessage(null);
    try {
      await exportBackup(repos, port, withHistory);
      setExported(true);
    } catch {
      setMessage({ tone: 'danger', text: t.transfer.exportFailed });
    }
  }

  async function undo(point: { text: string }) {
    const read = readTransferFile(point.text, point.text.length, Date.now(), t.words);
    try {
      if (!read.ok || read.file.kind !== 'backup') throw new Error('cópia ilegível');
      await repos.transfer.apply(replaceOps(read.file), PORTABLE_PREF_KEYS, null);
      await repos.transfer.dropRestorePoint();
      changed();
      setRestorePoint(null);
      setMessage({ tone: 'positive', text: t.transfer.undone });
    } catch (error) {
      setMessage({
        tone: 'danger',
        text: error instanceof ActiveSessionError ? t.transfer.activeUndo : t.transfer.undoFailed,
      });
    }
  }

  return (
    <Screen>
      <TopBar title={t.transfer.backup} />
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text variant="label" accessibilityRole="header">
            {t.transfer.export}
          </Text>
          <Text color="textMuted">{t.transfer.exportIntro}</Text>
          <View style={styles.option}>
            <View style={styles.grow}>
              <Text variant="label">{t.transfer.includeHistory}</Text>
              <Text variant="caption" color="textMuted">
                {t.transfer.recorded(historyCount)}
              </Text>
            </View>
            <Switch
              value={withHistory}
              accessibilityLabel={t.transfer.includeHistory}
              onValueChange={(value) => {
                setWithHistory(value);
                setExported(false);
              }}
            />
          </View>
          <Button
            label={t.transfer.export}
            done={exported ? t.transfer.backupReady : undefined}
            onPress={() => {
              void runExport();
            }}
          />
        </Card>

        <Card style={styles.card}>
          <Text variant="label" accessibilityRole="header">
            {t.transfer.importTitle}
          </Text>
          <Text color="textMuted">{t.transfer.openIntro}</Text>
          <Button
            label={t.transfer.openFile}
            kind="secondary"
            onPress={() => {
              void port.pick().then((picked) => {
                if (picked) router.push({ pathname: '/importar', params: { arquivo: picked.uri } });
              });
            }}
          />
        </Card>

        {restorePoint ? (
          <Card style={styles.card}>
            <Text variant="label" accessibilityRole="header">
              {t.transfer.undoRestore}
            </Text>
            <Text color="textMuted">
              {t.transfer.restorePoint(when.format(restorePoint.createdAt))}
            </Text>
            <Button
              label={t.transfer.previousState}
              kind="secondary"
              onPress={() => {
                dialog.alert(t.transfer.previousStateTitle, t.transfer.previousStateBody, [
                  { text: t.transfer.cancel, style: 'cancel' },
                  {
                    text: t.transfer.undo,
                    style: 'destructive',
                    onPress: () => {
                      void undo(restorePoint);
                    },
                  },
                ]);
              }}
            />
          </Card>
        ) : null}

        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

        <Text variant="caption" color="textMuted">
          {t.transfer.soundsHint}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  card: { gap: space.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
});
