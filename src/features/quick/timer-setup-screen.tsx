import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { clock } from '@/domain/format';
import { LIMITS } from '@/domain/limits';
import { quickParams, quickRoutine } from '@/domain/quick';
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
import { useStored } from './use-stored';

export const TIMER_KEY = 'rapido.temporizador';

/** Temporizador: um tempo só, nome opcional e, se quiser, recomeça sozinho ao acabar. */
export function TimerSetupScreen() {
  const [timer, setTimer, ready] = useStored(TIMER_KEY, parseTimer, TIMER_START);
  const minutes = Math.floor(timer.seconds / 60);
  const seconds = timer.seconds % 60;
  const result = quickRoutine(timer);
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
          label={`Começar ${clock(timer.seconds * 1000)}`}
          disabled={!ready || !result.ok}
          disabledHint={result.ok ? undefined : result.message}
          onPress={start}
        />
      }
    >
      <TopBar title="Temporizador" />
      <Card style={styles.card}>
        <Stepper
          label="Minutos"
          value={minutes}
          min={0}
          max={LIMITS.stepMaxSeconds / 60 - 1}
          onChange={(m) => {
            setTimer({ ...timer, seconds: m * 60 + seconds });
          }}
        />
        <Stepper
          label="Segundos"
          value={seconds}
          min={0}
          max={55}
          step={5}
          format={(s) => String(s).padStart(2, '0')}
          onChange={(s) => {
            setTimer({ ...timer, seconds: minutes * 60 + s });
          }}
        />
      </Card>
      <TextField
        label="Nome (opcional)"
        value={timer.name}
        placeholder="Ex.: Prancha"
        maxLength={LIMITS.nameMax}
        onChangeText={(name) => {
          setTimer({ ...timer, name });
        }}
      />
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text variant="label">Repetir ao concluir</Text>
          <Text variant="caption" color="textMuted">
            Recomeça sozinho até você encerrar.
          </Text>
        </View>
        <Switch
          value={timer.loop}
          accessibilityLabel="Repetir ao concluir"
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
