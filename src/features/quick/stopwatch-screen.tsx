import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useStored } from '@/data/use-stored';
import type { Instant } from '@/domain/engine';
import { stopwatchTime } from '@/domain/format';
import {
  elapsed,
  IDLE,
  lap,
  lapRows,
  parseStopwatch,
  pause,
  rebase,
  reset,
  startOrResume,
  type Stopwatch,
} from '@/domain/stopwatch';
import { useCues } from '@/features/cues/cue-context';
import { systemClock, type Clock } from '@/features/session/clock';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { dialog } from '@/ui/dialog';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

export const STOPWATCH_KEY = 'cronometro';
const TICK_MS = 100;

/**
 * Cronômetro com voltas. Continua contando fora da tela (o tempo é derivado do marco) e volta
 * certo depois de fechar o app. Zerar só pausado e com confirmação.
 */
export function StopwatchScreen({ clockSource = systemClock }: { clockSource?: Clock }) {
  const { port } = useCues();
  // Ao ler o gravado, o marco é recalculado pelo relógio civil (outro processo, outro mono).
  const [sw, save, ready] = useStored(
    STOPWATCH_KEY,
    (raw) => rebase(parseStopwatch(raw), clockSource.now()),
    IDLE,
  );
  // A hora da tela anda no intervalo (ler o relógio durante o render quebraria a pureza).
  const [now, setNow] = useState(() => clockSource.now());

  const running = sw.status === 'running';
  useEffect(() => {
    port.keepAwake(running);
    if (!running) return;
    const id = setInterval(() => {
      setNow(clockSource.now());
    }, TICK_MS);
    return () => {
      clearInterval(id);
      port.keepAwake(false);
    };
  }, [running, port, clockSource]);

  const act = (step: (s: Stopwatch, at: Instant) => Stopwatch) => {
    const at = clockSource.now();
    setNow(at);
    save(step(sw, at));
  };
  const confirmReset = () => {
    dialog.alert('Zerar o cronômetro?', 'O tempo e as voltas marcadas somem.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Zerar',
        style: 'destructive',
        onPress: () => {
          save(reset(sw));
        },
      },
    ]);
  };

  const total = elapsed(sw, now);
  const rows = lapRows(sw);
  const current = total - (sw.laps.at(-1) ?? 0);

  const footer =
    sw.status === 'idle' ? (
      <Button
        label="Iniciar"
        disabled={!ready}
        onPress={() => {
          act(startOrResume);
        }}
      />
    ) : (
      <View style={styles.actions}>
        <View style={styles.action}>
          {running ? (
            <Button
              label="Marcar volta"
              kind="secondary"
              onPress={() => {
                act(lap);
              }}
            />
          ) : (
            <Button label="Zerar" kind="secondary" onPress={confirmReset} />
          )}
        </View>
        <View style={styles.action}>
          {running ? (
            <Button
              label="Pausar"
              onPress={() => {
                act(pause);
              }}
            />
          ) : (
            <Button
              label="Retomar"
              onPress={() => {
                act(startOrResume);
              }}
            />
          )}
        </View>
      </View>
    );

  return (
    <Screen footer={footer}>
      <TopBar title="Cronômetro" />
      <View style={styles.big}>
        <Text
          variant="display"
          tabular
          style={styles.time}
          accessibilityRole="timer"
          accessibilityLabel={`Tempo total ${stopwatchTime(total)}`}
        >
          {stopwatchTime(total)}
        </Text>
        {sw.laps.length > 0 ? (
          <Text color="textMuted" tabular>
            Volta {String(sw.laps.length + 1)}: {stopwatchTime(current)}
          </Text>
        ) : null}
        {sw.status === 'paused' ? <Text color="textMuted">Pausado</Text> : null}
      </View>
      {rows.length > 0 ? (
        <Card>
          {rows.map((row) => (
            <View key={row.number} style={styles.lap}>
              <Text variant="label">Volta {String(row.number)}</Text>
              <Text tabular>{stopwatchTime(row.lapMs)}</Text>
              <Text tabular color="textMuted">
                {stopwatchTime(row.totalMs)}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { alignItems: 'center', gap: space.xs, paddingVertical: space.xl },
  time: { fontSize: 64, lineHeight: 72 },
  actions: { flexDirection: 'row', gap: space.md },
  action: { flex: 1 },
  lap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    gap: space.md,
  },
});
