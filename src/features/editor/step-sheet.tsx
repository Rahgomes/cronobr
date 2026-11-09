import { StyleSheet, View } from 'react-native';

import { clock } from '@/domain/format';
import { LIMITS } from '@/domain/limits';
import { BPM_MAX, BPM_MIN, METRONOME_START } from '@/domain/metronome';
import type { Step } from '@/domain/routine';
import type { AudioClock } from '@/features/metronome/engine';
import { useBeatPreview } from '@/features/metronome/use-preview';
import { useT } from '@/i18n/i18n-context';
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
  createClock,
}: {
  step: Step | null;
  actions: StepActions;
  onClose: () => void;
  /** Relógio de áudio da prévia da cadência; os testes passam um falso. */
  createClock?: () => AudioClock | null;
}) {
  const t = useT();
  const preview = useBeatPreview(createClock);
  if (!step)
    return (
      <Sheet title="" visible={false} onClose={onClose}>
        {null}
      </Sheet>
    );
  const byReps = step.seconds === null;
  return (
    <Sheet title={step.name || t.editor.step} visible onClose={onClose}>
      <TextField
        label={t.editor.stepName}
        value={step.name}
        maxLength={LIMITS.nameMax}
        onChangeText={(name) => {
          actions.change({ name });
        }}
      />
      <View style={styles.chips}>
        <Chip
          label={t.editor.work}
          selected={step.kind === 'work'}
          onPress={() => {
            actions.change({ kind: 'work' });
          }}
        />
        <Chip
          label={t.editor.rest}
          selected={step.kind === 'rest'}
          onPress={() => {
            actions.change({ kind: 'rest', seconds: step.seconds });
          }}
        />
      </View>
      {step.kind === 'work' ? (
        <View style={styles.chips}>
          <Chip
            label={t.editor.byTime}
            selected={!byReps}
            onPress={() => {
              actions.change({ seconds: step.seconds ?? 30 });
            }}
          />
          <Chip
            label={t.editor.byReps}
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
            label={t.editor.reps}
            value={step.reps ?? 10}
            min={1}
            max={LIMITS.repsMax}
            onChange={(reps) => {
              actions.change({ reps });
            }}
          />
          <Text variant="caption" color="textMuted">
            {t.editor.manualHint}
          </Text>
        </>
      ) : (
        <Stepper
          label={t.editor.time}
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
        label={t.editor.activeStep}
        hint={t.editor.activeHint}
        value={!step.disabled}
        onChange={(on) => {
          actions.change({ disabled: !on });
        }}
      />
      <Toggle
        label={t.editor.bothSides}
        hint={t.editor.sidesHint}
        value={step.sides === true}
        onChange={(on) => {
          actions.change({ sides: on });
        }}
      />
      {step.kind === 'work' && step.seconds !== null ? (
        <Toggle
          label={t.editor.early}
          hint={t.editor.earlyHint}
          value={step.early === true}
          onChange={(on) => {
            actions.change({ early: on });
          }}
        />
      ) : null}
      <Toggle
        label={t.editor.cadence}
        hint={t.editor.cadenceHint}
        value={step.bpm !== undefined}
        onChange={(on) => {
          actions.change({ bpm: on ? METRONOME_START.bpm : undefined });
        }}
      />
      {step.bpm === undefined ? null : (
        <>
          <Stepper
            label={t.editor.bpm}
            value={step.bpm}
            min={BPM_MIN}
            max={BPM_MAX}
            step={5}
            format={t.editor.bpmShort}
            onChange={(bpm) => {
              actions.change({ bpm });
            }}
          />
          <Button
            label={t.editor.previewBeats}
            kind="secondary"
            disabled={preview.playing || preview.unavailable}
            disabledHint={preview.unavailable ? t.metronome.unavailable : undefined}
            onPress={() => {
              if (step.bpm !== undefined) preview.play(step.bpm);
            }}
          />
        </>
      )}
      <View style={styles.actions}>
        <Button label={t.editor.insertAfter} kind="secondary" onPress={actions.insertAfter} />
        <Button label={t.editor.duplicate} kind="secondary" onPress={actions.duplicate} />
        {actions.moveUp ? (
          <Button label={t.editor.moveUp} kind="text" onPress={actions.moveUp} />
        ) : null}
        {actions.moveDown ? (
          <Button label={t.editor.moveDown} kind="text" onPress={actions.moveDown} />
        ) : null}
        {/* Sem botão morto: o motivo fica escrito (no web o inativo-que-explica perde o aria-disabled). */}
        {actions.remove ? (
          <Button label={t.editor.deleteStep} kind="text" onPress={actions.remove} />
        ) : (
          <Text variant="caption" color="textMuted">
            {t.editor.stepRequired}
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
