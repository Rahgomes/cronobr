import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { clock } from '@/domain/format';
import { NAME_MAX, remaining, TIMERS_MAX, type Timer } from '@/domain/timers';
import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Screen } from '@/ui/screen';
import { Sheet } from '@/ui/sheet';
import { Stepper } from '@/ui/stepper';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { space } from '@/ui/tokens';
import { RoundAction, TopBar } from '@/ui/top-bar';

import { useTimers } from './timers-context';

const START = { name: '', hours: 0, minutes: 5, seconds: 0 };

/** Vários temporizadores (E07 A): cada um com nome, iniciar, pausar, repetir e encerrar. */
export function TimersScreen() {
  const t = useT();
  const timers = useTimers();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(START);
  const full = timers.timers.length >= TIMERS_MAX;
  const durationMs = ((form.hours * 60 + form.minutes) * 60 + form.seconds) * 1000;

  const create = () => {
    timers.add(form.name, durationMs);
    setCreating(false);
    setForm(START);
  };

  return (
    <Screen
      footer={
        <Button
          label={t.timers.add}
          disabled={!timers.ready || full}
          disabledHint={full ? t.timers.full(TIMERS_MAX) : undefined}
          onPress={() => {
            setCreating(true);
          }}
        />
      }
    >
      <TopBar title={t.timers.title} />
      {timers.timers.length === 0 ? (
        <Text color="textMuted">{t.timers.empty}</Text>
      ) : (
        timers.timers.map((timer) => <TimerRow key={timer.id} timer={timer} />)
      )}
      {full ? (
        <Text variant="caption" color="textMuted">
          {t.timers.full(TIMERS_MAX)}
        </Text>
      ) : null}

      <Sheet
        title={t.timers.add}
        visible={creating}
        onClose={() => {
          setCreating(false);
        }}
        footer={
          <Button
            label={t.timers.startTime(clock(durationMs))}
            disabled={durationMs === 0}
            onPress={create}
          />
        }
      >
        <TextField
          label={t.timers.name}
          value={form.name}
          placeholder={t.timers.namePlaceholder}
          maxLength={NAME_MAX}
          onChangeText={(name) => {
            setForm({ ...form, name });
          }}
        />
        <Card style={styles.card}>
          <Stepper
            label={t.timers.hours}
            value={form.hours}
            min={0}
            max={23}
            onChange={(hours) => {
              setForm({ ...form, hours });
            }}
          />
          <Stepper
            label={t.timers.minutes}
            value={form.minutes}
            min={0}
            max={59}
            onChange={(minutes) => {
              setForm({ ...form, minutes });
            }}
          />
          <Stepper
            label={t.timers.seconds}
            value={form.seconds}
            min={0}
            max={59}
            format={(s) => String(s).padStart(2, '0')}
            onChange={(seconds) => {
              setForm({ ...form, seconds });
            }}
          />
        </Card>
      </Sheet>
    </Screen>
  );
}

function TimerRow({ timer }: { timer: Timer }) {
  const t = useT();
  const timers = useTimers();
  const time = clock(remaining(timer, timers.now));
  const status =
    timer.status === 'done'
      ? t.timers.done
      : timer.status === 'paused'
        ? t.timers.paused
        : t.timers.running;
  const done = timer.status === 'done';
  return (
    <Card style={styles.row}>
      <View
        style={styles.info}
        accessible
        accessibilityRole="timer"
        accessibilityLabel={
          done ? t.timers.finished([timer.name]) : t.timers.rowLabel(timer.name, time, status)
        }
      >
        <Text variant="label" numberOfLines={2}>
          {timer.name}
        </Text>
        <Text variant="title" tabular color={done ? 'success' : 'text'}>
          {done ? t.timers.done : time}
        </Text>
        <Text variant="caption" color="textMuted">
          {timer.status === 'paused' ? `${t.timers.paused} · ` : ''}
          {t.timers.ofTotal(clock(timer.durationMs))}
        </Text>
      </View>
      <View style={styles.actions}>
        {timer.status === 'running' ? (
          <RoundAction
            icon="pause"
            label={t.timers.action(t.timers.pause, timer.name)}
            onPress={() => {
              timers.pause(timer.id);
            }}
          />
        ) : timer.status === 'paused' || timer.status === 'ready' ? (
          <RoundAction
            icon="play"
            tone="primary"
            label={t.timers.action(t.timers.resume, timer.name)}
            onPress={() => {
              timers.resume(timer.id);
            }}
          />
        ) : (
          <RoundAction
            icon="restart"
            tone="primary"
            label={t.timers.action(t.timers.repeat, timer.name)}
            onPress={() => {
              timers.repeat(timer.id);
            }}
          />
        )}
        <RoundAction
          icon="close"
          label={t.timers.action(t.timers.end, timer.name)}
          onPress={() => {
            timers.remove(timer.id);
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  info: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: space.sm },
});
