import { StyleSheet, View } from 'react-native';

import { clock } from '@/domain/format';
import { LIMITS } from '@/domain/limits';
import type { Step } from '@/domain/routine';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { Sheet } from '@/ui/sheet';
import { Stepper } from '@/ui/stepper';
import { Switch } from '@/ui/switch';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { space } from '@/ui/tokens';

export interface StepActions {
  change: (patch: Partial<Omit<Step, 'id'>>) => void;
  moveUp: (() => void) | null;
  moveDown: (() => void) | null;
  duplicate: () => void;
  insertAfter: () => void;
  remove: (() => void) | null;
}

/** Tudo de uma etapa num lugar só: a lista do bloco fica limpa, como na C02. */
export function StepSheet({
  step,
  actions,
  onClose,
}: {
  step: Step | null;
  actions: StepActions;
  onClose: () => void;
}) {
  if (!step)
    return (
      <Sheet title="" visible={false} onClose={onClose}>
        {null}
      </Sheet>
    );
  const byReps = step.seconds === null;
  return (
    <Sheet title={step.name || 'Etapa'} visible onClose={onClose}>
      <TextField
        label="Nome da etapa"
        value={step.name}
        maxLength={LIMITS.nameMax}
        onChangeText={(name) => {
          actions.change({ name });
        }}
      />
      <View style={styles.chips}>
        <Chip
          label="Exercício"
          selected={step.kind === 'work'}
          onPress={() => {
            actions.change({ kind: 'work' });
          }}
        />
        <Chip
          label="Descanso"
          selected={step.kind === 'rest'}
          onPress={() => {
            actions.change({ kind: 'rest', seconds: step.seconds });
          }}
        />
      </View>
      {step.kind === 'work' ? (
        <View style={styles.chips}>
          <Chip
            label="Por tempo"
            selected={!byReps}
            onPress={() => {
              actions.change({ seconds: step.seconds ?? 30 });
            }}
          />
          <Chip
            label="Por repetições"
            selected={byReps}
            onPress={() => {
              actions.change({ seconds: null });
            }}
          />
        </View>
      ) : null}
      {byReps ? (
        <>
          <Stepper
            label="Repetições"
            value={step.reps ?? 10}
            min={1}
            max={LIMITS.repsMax}
            onChange={(reps) => {
              actions.change({ reps });
            }}
          />
          <Text variant="caption" color="textMuted">
            {'Sem contagem automática: na hora, você toca em "Concluí" para seguir.'}
          </Text>
        </>
      ) : (
        <Stepper
          label="Tempo"
          value={step.seconds ?? 30}
          min={5}
          max={LIMITS.stepMaxSeconds}
          step={5}
          format={(s) => clock(s * 1000)}
          onChange={(seconds) => {
            actions.change({ seconds });
          }}
        />
      )}
      <Toggle
        label="Etapa ativa"
        hint="Desativada fica guardada, mas não roda."
        value={!step.disabled}
        onChange={(on) => {
          actions.change({ disabled: !on });
        }}
      />
      <Toggle
        label="Os dois lados"
        hint="Roda uma vez para cada lado: esquerdo, depois direito."
        value={step.sides === true}
        onChange={(on) => {
          actions.change({ sides: on });
        }}
      />
      {step.kind === 'work' && step.seconds !== null ? (
        <Toggle
          label="Pode terminar antes"
          hint='Como no EMOM: "Terminei" transforma o resto do tempo em descanso.'
          value={step.early === true}
          onChange={(on) => {
            actions.change({ early: on });
          }}
        />
      ) : null}
      <View style={styles.actions}>
        <Button label="Inserir etapa depois" kind="secondary" onPress={actions.insertAfter} />
        <Button label="Duplicar" kind="secondary" onPress={actions.duplicate} />
        {actions.moveUp ? (
          <Button label="Mover para cima" kind="text" onPress={actions.moveUp} />
        ) : null}
        {actions.moveDown ? (
          <Button label="Mover para baixo" kind="text" onPress={actions.moveDown} />
        ) : null}
        {/* Sem botão morto: o motivo fica escrito (no web o inativo-que-explica perde o aria-disabled). */}
        {actions.remove ? (
          <Button label="Apagar etapa" kind="text" onPress={actions.remove} />
        ) : (
          <Text variant="caption" color="textMuted">
            O bloco precisa de pelo menos uma etapa.
          </Text>
        )}
      </View>
    </Sheet>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text variant="label">{label}</Text>
        <Text variant="caption" color="textMuted">
          {hint}
        </Text>
      </View>
      <Switch value={value} accessibilityLabel={label} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowText: { flex: 1, gap: 2 },
  actions: { gap: space.sm },
});
