// Um treino do histórico (E04 lote E): o que foi feito, nota opcional e repetir a mesma cópia.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import { cleanNote, NOTE_MAX } from '@/domain/calendar';
import type { HistoryEntry } from '@/domain/history';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { dialog } from '@/ui/dialog';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { DATE, statusLine } from './history-screen';

type Load =
  { status: 'loading' } | { status: 'missing' } | { status: 'ready'; entry: HistoryEntry };

export function HistoryDetailScreen({ id }: { id: string }) {
  const repos = useRepos();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [draft, setDraft] = useState('');
  /** A nota na tela é a que está gravada (o botão confirma "Nota salva"). */
  const [stored, setStored] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void repos.history.get(id).then((entry) => {
      if (!active) return;
      setLoad(entry ? { status: 'ready', entry } : { status: 'missing' });
      setDraft(entry?.note ?? '');
    });
    return () => {
      active = false;
    };
  }, [repos, id]);

  if (load.status === 'loading') return <Screen>{null}</Screen>;

  if (load.status === 'missing') {
    return (
      <Screen>
        <TopBar title="Treino" />
        <Text color="textMuted">Este treino não está mais no histórico.</Text>
      </Screen>
    );
  }

  const { entry } = load;
  const done = entry.status === 'completed';

  async function saveNote() {
    const note = cleanNote(draft);
    try {
      // Grava e só depois mostra como salva (CI lento já pegou tela à frente do banco).
      await repos.history.setNote(entry.id, note);
      setDraft(note ?? '');
      setLoad({ status: 'ready', entry: { ...entry, note: note ?? undefined } });
      setStored(true);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  function confirmRemove() {
    dialog.alert('Apagar este treino?', 'Ele sai do histórico e do calendário.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await repos.history.remove(entry.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen
      footer={
        <Button
          label="Repetir este treino"
          onPress={() => {
            router.push({ pathname: '/sessao', params: { repetir: entry.id } });
          }}
        />
      }
    >
      <TopBar title="Treino" />
      <View style={styles.content}>
        <Card>
          <Text variant="label" accessibilityRole="header">
            {entry.routine.name}
          </Text>
          <Text color="textMuted">{DATE.format(entry.endedAt)}</Text>
          <Text color={done ? 'success' : 'warning'}>{statusLine(entry)}</Text>
          {entry.rounds === undefined ? null : (
            <Text color="textMuted">Rodadas registradas: {String(entry.rounds)}</Text>
          )}
          {entry.adjusted ? (
            <Text color="textMuted">Ajustado: teve salto de etapa ou tempo recalculado.</Text>
          ) : null}
        </Card>
        <Text color="textMuted">
          Repetir usa a mesma configuração deste dia, mesmo que a rotina tenha mudado depois.
        </Text>
        <View style={styles.note}>
          <TextField
            label="Nota"
            value={draft}
            multiline
            maxLength={NOTE_MAX}
            placeholder="Como foi? Carga, sensação, o que mudar."
            onChangeText={(text) => {
              setDraft(text);
              setStored(false);
            }}
          />
          <Text variant="caption" color="textMuted" tabular>
            {`${String(draft.length)} de ${String(NOTE_MAX)}`}
          </Text>
          <Button
            label="Salvar nota"
            kind="secondary"
            done={stored ? 'Nota salva' : undefined}
            onPress={() => {
              void saveNote();
            }}
          />
          {failed ? <Notice tone="danger">Não deu para salvar a nota.</Notice> : null}
        </View>
        <Button label="Apagar do histórico" kind="text" onPress={confirmRemove} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  note: { gap: space.sm },
});
