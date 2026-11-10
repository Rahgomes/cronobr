import { StyleSheet, View } from 'react-native';

import { LIMITS } from '@/domain/limits';
import type { Block } from '@/domain/routine';
import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { Sheet } from '@/ui/sheet';
import { Stepper } from '@/ui/stepper';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { space } from '@/ui/tokens';

export interface BlockActions {
  change: (patch: Partial<Pick<Block, 'name' | 'repeat' | 'restAfterSeconds'>>) => void;
  moveUp: (() => void) | null;
  moveDown: (() => void) | null;
  remove: (() => void) | null;
}

export function BlockSheet({
  block,
  last,
  actions,
  onClose,
}: {
  block: Block | null;
  /** Último bloco: o descanso depois dele não roda (D11). */
  last: boolean;
  actions: BlockActions;
  onClose: () => void;
}) {
  const t = useT();
  if (!block)
    return (
      <Sheet title="" visible={false} onClose={onClose}>
        {null}
      </Sheet>
    );
  return (
    <Sheet title={block.name || t.editor.block} visible onClose={onClose}>
      <TextField
        label={t.editor.blockName}
        value={block.name}
        maxLength={LIMITS.nameMax}
        onChangeText={(name) => {
          actions.change({ name });
        }}
      />
      <Stepper
        label={t.editor.rounds}
        value={block.repeat}
        min={1}
        max={LIMITS.repeatMax}
        onChange={(repeat) => {
          actions.change({ repeat });
        }}
      />
      {last ? (
        <Text variant="caption" color="textMuted">
          {t.editor.lastBlockHint}
        </Text>
      ) : (
        <Stepper
          label={t.editor.restAfter}
          value={block.restAfterSeconds}
          min={0}
          max={LIMITS.blockRestMaxSeconds}
          kind="duration"
          onChange={(restAfterSeconds) => {
            actions.change({ restAfterSeconds });
          }}
        />
      )}
      <View style={styles.actions}>
        {actions.moveUp ? (
          <Button label={t.editor.moveBlockUp} kind="text" onPress={actions.moveUp} />
        ) : null}
        {actions.moveDown ? (
          <Button label={t.editor.moveBlockDown} kind="text" onPress={actions.moveDown} />
        ) : null}
        {/* Sem botão morto: o motivo fica escrito (no web o inativo-que-explica perde o aria-disabled). */}
        {actions.remove ? (
          <Button label={t.editor.deleteBlock} kind="text" onPress={actions.remove} />
        ) : (
          <Text variant="caption" color="textMuted">
            {t.editor.blockRequired}
          </Text>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({ actions: { gap: space.sm } });
