import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import { clock } from '@/domain/format';
import { checkRoutine, LIMITS } from '@/domain/limits';
import { withNames, parseSequence, sequenceRoutine, type SequenceItem } from '@/domain/sequence';
import { idGenerator } from '@/features/editor/ids';
import { useT } from '@/i18n/i18n-context';
import type { Messages } from '@/i18n/messages/pt';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { SectionTitle } from '@/ui/section-title';
import { Stepper } from '@/ui/stepper';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

const REST_BETWEEN_MAX = 120;
const TEXT_MAX = 4000;

function amount(item: SequenceItem, s: Messages['sequence']): string {
  const parts = [item.seconds === null ? s.reps(item.reps ?? 0) : clock(item.seconds * 1000)];
  if (item.sets > 1) parts.unshift(s.sets(item.sets));
  if (item.sides) parts.push(s.sides);
  return parts.join(' · ');
}

/**
 * Sequência recebida do profissional (E07 D): a pessoa cola a lista como recebeu, vê como o app
 * entendeu cada linha e cria a rotina. Depois revisa no editor de sempre.
 */
export function SequenceScreen({ now = Date.now }: { now?: () => number } = {}) {
  const t = useT();
  const s = t.sequence;
  const repos = useRepos();
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [repeat, setRepeat] = useState(1);
  const [restBetween, setRestBetween] = useState(15);
  const [failed, setFailed] = useState(false);
  const [newId] = useState(() => idGenerator());

  const { items, issues } = parseSequence(text);
  const routine = sequenceRoutine(
    { id: 'previa', name: name.trim() || s.defaultName, now: 0 },
    items,
    { repeat, restBetweenSeconds: restBetween },
    s.words,
  );
  const check = items.length > 0 ? checkRoutine(routine, t.words) : null;
  const problem = check && !check.ok ? (check.issues[0]?.message ?? null) : null;
  const ready = items.length > 0 && issues.length === 0 && check?.ok === true;
  const first = issues[0];
  const hint = first ? s.issue[first.kind](first.line) : (problem ?? s.empty);

  const save = async () => {
    const built = sequenceRoutine(
      { id: newId(), name: name.trim() || s.defaultName, now: now() },
      items,
      { repeat, restBetweenSeconds: restBetween },
      s.words,
    );
    const result = checkRoutine(built, t.words);
    if (!result.ok) return;
    try {
      await repos.routines.save(result.routine);
      router.replace({ pathname: '/rotina/[id]', params: { id: result.routine.id } });
    } catch {
      setFailed(true);
    }
  };

  return (
    <Screen
      footer={
        <Button
          label={s.save}
          disabled={!ready}
          disabledHint={ready ? undefined : hint}
          onPress={() => {
            void save();
          }}
        />
      }
    >
      <TopBar title={s.title} />
      <Text color="textMuted">{s.intro}</Text>
      <TextField
        label={s.name}
        value={name}
        onChangeText={setName}
        placeholder={s.namePlaceholder}
        maxLength={LIMITS.nameMax}
      />
      <TextField
        label={s.text}
        value={text}
        onChangeText={setText}
        placeholder={s.example}
        maxLength={TEXT_MAX}
        multiline
      />
      <Text variant="caption" color="textMuted">
        {s.exampleHint}
      </Text>
      <Card style={styles.card}>
        <Stepper
          label={s.rounds}
          value={repeat}
          min={1}
          max={LIMITS.repeatMax}
          onChange={setRepeat}
        />
        <Stepper
          label={s.restBetween}
          value={restBetween}
          min={0}
          max={REST_BETWEEN_MAX}
          kind="duration"
          onChange={setRestBetween}
        />
      </Card>
      {issues.map((issue) => (
        <Notice key={`${String(issue.line)}-${issue.kind}`} tone="alert">
          {`${s.issue[issue.kind](issue.line)} "${issue.text}"`}
        </Notice>
      ))}
      {problem ? <Notice tone="danger">{problem}</Notice> : null}
      {failed ? <Notice tone="danger">{s.saveFailed}</Notice> : null}
      <SectionTitle>{s.preview}</SectionTitle>
      {items.length === 0 ? (
        <Text color="textMuted">{s.empty}</Text>
      ) : (
        <View style={styles.list}>
          {withNames(items, s.words).map((item, i) => (
            <View key={`${String(i)}-${item.name}`} style={styles.row}>
              <Text style={styles.name} color={item.kind === 'rest' ? 'textMuted' : 'text'}>
                {item.name}
                {item.kind === 'rest' ? ` (${s.rest})` : ''}
              </Text>
              <Text tabular color="textMuted">
                {amount(item, s)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  list: { gap: space.xs },
  row: { flexDirection: 'row', gap: space.sm, justifyContent: 'space-between' },
  name: { flex: 1 },
});
