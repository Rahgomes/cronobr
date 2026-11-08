// Backup e transferência (E05): exportar, abrir um arquivo e desfazer a última restauração.
// Tudo offline: o arquivo sai e entra pelo compartilhar e pelo seletor do sistema.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDataChanged, useRepos } from '@/data/data-context';
import { ActiveSessionError } from '@/data/repos';
import { readTransferFile } from '@/domain/transfer';
import { replaceOps } from '@/domain/transfer-plan';
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
import { exportBackup } from './transfer-actions';

const WHEN = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function BackupScreen() {
  const repos = useRepos();
  const t = useT();
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
      setMessage({ tone: 'danger', text: 'Não deu para gerar o backup. Tente de novo.' });
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
      setMessage({ tone: 'positive', text: 'Pronto: tudo voltou a como estava antes.' });
    } catch (error) {
      setMessage({
        tone: 'danger',
        text:
          error instanceof ActiveSessionError
            ? 'Há um treino em andamento. Termine ou encerre o treino antes de desfazer.'
            : 'Não deu para desfazer. Nada foi alterado.',
      });
    }
  }

  return (
    <Screen>
      <TopBar title="Backup" />
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text variant="label" accessibilityRole="header">
            Exportar backup
          </Text>
          <Text color="textMuted">
            Rotinas, favoritas, avisos e jeito de ver o treino, num arquivo .cronobr. Abre no
            Android e no iPhone. Ficam de fora permissões do aparelho e treino em andamento.
          </Text>
          <View style={styles.option}>
            <View style={styles.grow}>
              <Text variant="label">Incluir histórico</Text>
              <Text variant="caption" color="textMuted">
                {historyCount === 1
                  ? '1 treino registrado'
                  : `${String(historyCount)} treinos registrados`}
              </Text>
            </View>
            <Switch
              value={withHistory}
              accessibilityLabel="Incluir histórico"
              onValueChange={(value) => {
                setWithHistory(value);
                setExported(false);
              }}
            />
          </View>
          <Button
            label="Exportar backup"
            done={exported ? 'Backup pronto' : undefined}
            onPress={() => {
              void runExport();
            }}
          />
        </Card>

        <Card style={styles.card}>
          <Text variant="label" accessibilityRole="header">
            Importar
          </Text>
          <Text color="textMuted">
            Uma rotina que alguém mandou ou um backup seu. Você vê o que tem no arquivo antes de
            confirmar.
          </Text>
          <Button
            label="Abrir arquivo"
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
              Desfazer a última restauração
            </Text>
            <Text color="textMuted">
              {`Cópia de como estava em ${WHEN.format(restorePoint.createdAt)}, antes de substituir tudo.`}
            </Text>
            <Button
              label="Voltar ao estado anterior"
              kind="secondary"
              onPress={() => {
                dialog.alert(
                  'Voltar ao estado anterior?',
                  'Rotinas, preferências e histórico voltam a como estavam antes da restauração.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Desfazer',
                      style: 'destructive',
                      onPress: () => {
                        void undo(restorePoint);
                      },
                    },
                  ],
                );
              }}
            />
          </Card>
        ) : null}

        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

        <Text variant="caption" color="textMuted">
          Sons vão pelo nome e tocam iguais em qualquer aparelho. A voz é a do aparelho em
          português. Áudio próprio ainda não existe no app.
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
