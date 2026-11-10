import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useStored } from '@/data/use-stored';
import { clock } from '@/domain/format';
import { LIMITS } from '@/domain/limits';
import { quickParams, quickRoutine } from '@/domain/quick';
import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Screen } from '@/ui/screen';
import { Stepper } from '@/ui/stepper';
import { Switch } from '@/ui/switch';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { parseTimer, TIMER_START } from './parse';

export const TIMER_KEY = 'rapido.temporizador';

/** Temporizador: um tempo só, nome opcional e, se quiser, recomeça sozinho ao acabar. */
export function TimerSetupScreen() {
  const t = useT();
  const [timer, setTimer, ready] = useStored(TIMER_KEY, parseTimer, TIMER_START);
  const minutes = Math.floor(timer.seconds / 60);
  const seconds = timer.seconds % 60;
  const result = quickRoutine(timer, t.words);
  const start = () => {
    router.push({
      pathname: '/sessao',
      params: { ...quickParams(timer), ...(timer.loop ? { denovo: '1' } : {}) },
    });
  };
  return (
    <Screen
      footer={
        <Button
          label={t.quick.startTime(clock(timer.seconds * 1000))}
          disabled={!ready || !result.ok}
          disabledHint={result.ok ? undefined : result.message}
          onPress={start}
        />
      }
    >
      <TopBar title={t.quick.timer} />
      <Card style={styles.card}>
        <Stepper
          label={t.quick.minutes}
          value={minutes}
          min={0}
          max={LIMITS.stepMaxSeconds / 60 - 1}
          onChange={(m) => {
            setTimer({ ...timer, seconds: m * 60 + seconds });
          }}
        />
        <Stepper
          label={t.quick.seconds}
          value={seconds}
          min={0}
          max={59}
          format={(s) => String(s).padStart(2, '0')}
          onChange={(s) => {
            setTimer({ ...timer, seconds: minutes * 60 + s });
          }}
        />
      </Card>
      <TextField
        label={t.quick.name}
        value={timer.name}
        placeholder={t.quick.namePlaceholder}
        maxLength={LIMITS.nameMax}
        onChangeText={(name) => {
          setTimer({ ...timer, name });
        }}
      />
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text variant="label">{t.quick.repeat}</Text>
          <Text variant="caption" color="textMuted">
            {t.quick.repeatHint}
          </Text>
        </View>
        <Switch
          value={timer.loop}
          accessibilityLabel={t.quick.repeat}
          onValueChange={(loop) => {
            setTimer({ ...timer, loop });
          }}
        />
      </View>
      {result.ok ? null : <Text color="danger">{result.message}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowText: { flex: 1, gap: 2 },
});
