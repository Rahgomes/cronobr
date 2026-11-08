import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useStored } from '@/data/use-stored';
import { clock } from '@/domain/format';
import { LIMITS } from '@/domain/limits';
import { quickParams, quickRoutine } from '@/domain/quick';
import { buildTimeline, summarize } from '@/domain/timeline';
import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Screen } from '@/ui/screen';
import { Stepper } from '@/ui/stepper';
import { Text } from '@/ui/text';
import { space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { parseInterval } from './parse';

export const INTERVAL_KEY = 'rapido.intervalo';

const seconds = (s: number) => clock(s * 1000);

const FIELDS: {
  key: 'prepSeconds' | 'workSeconds' | 'restSeconds' | 'rounds';
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}[] = [
  {
    key: 'prepSeconds',
    label: 'Preparação',
    min: 0,
    max: LIMITS.prepMaxSeconds,
    step: 5,
    format: seconds,
  },
  { key: 'workSeconds', label: 'Exercício', min: 5, max: 60 * 60, step: 5, format: seconds },
  { key: 'restSeconds', label: 'Descanso', min: 0, max: 60 * 60, step: 5, format: seconds },
  { key: 'rounds', label: 'Rodadas', min: 1, max: LIMITS.repeatMax, step: 1, format: String },
];

/** Intervalado: preparação, exercício, descanso e rodadas. Lembra a última configuração. */
export function IntervalSetupScreen() {
  const t = useT();
  const [config, setConfig, ready] = useStored(
    INTERVAL_KEY,
    parseInterval,
    parseInterval(undefined),
  );
  const result = quickRoutine(config, t.words);
  const total = result.ok ? summarize(buildTimeline(result.routine)).knownMs : 0;
  return (
    <Screen
      footer={
        <Button
          label={`Começar ${clock(total)}`}
          disabled={!ready || !result.ok}
          disabledHint={result.ok ? undefined : result.message}
          onPress={() => {
            router.push({ pathname: '/sessao', params: quickParams(config) });
          }}
        />
      }
    >
      <TopBar title="Intervalado" />
      <Card style={styles.card}>
        {FIELDS.map((f) => (
          <Stepper
            key={f.key}
            label={f.label}
            value={config[f.key]}
            min={f.min}
            max={f.max}
            step={f.step}
            format={f.format}
            onChange={(value) => {
              setConfig({ ...config, [f.key]: value });
            }}
          />
        ))}
      </Card>
      <Text color="textMuted">Sem descanso depois da última rodada. Total: {clock(total)}.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({ card: { gap: space.sm } });
