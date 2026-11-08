import { StyleSheet, View } from 'react-native';

import { clock } from '@/domain/format';
import { LIMITS } from '@/domain/limits';
import type { Block } from '@/domain/routine';
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
  if (!block)
    return (
      <Sheet title="" visible={false} onClose={onClose}>
        {null}
      </Sheet>
    );
  return (
    <Sheet title={block.name || 'Bloco'} visible onClose={onClose}>
      <TextField
        label="Nome do bloco"
        value={block.name}
        maxLength={LIMITS.nameMax}
        onChangeText={(name) => {
          actions.change({ name });
        }}
      />
      <Stepper
        label="Rodadas"
        value={block.repeat}
        min={1}
        max={LIMITS.repeatMax}
        onChange={(repeat) => {
          actions.change({ repeat });
        }}
      />
      {last ? (
        <Text variant="caption" color="textMuted">
          Último bloco: depois dele vem o encerramento, sem descanso entre blocos.
        </Text>
      ) : (
        <Stepper
          label="Descanso depois"
          value={block.restAfterSeconds}
          min={0}
          max={LIMITS.blockRestMaxSeconds}
          step={15}
          format={(s) => clock(s * 1000)}
          onChange={(restAfterSeconds) => {
            actions.change({ restAfterSeconds });
          }}
        />
      )}
      <View style={styles.actions}>
        {actions.moveUp ? (
          <Button label="Mover bloco para cima" kind="text" onPress={actions.moveUp} />
        ) : null}
        {actions.moveDown ? (
          <Button label="Mover bloco para baixo" kind="text" onPress={actions.moveDown} />
        ) : null}
        {/* Sem botão morto: o motivo fica escrito (no web o inativo-que-explica perde o aria-disabled). */}
        {actions.remove ? (
          <Button label="Apagar bloco" kind="text" onPress={actions.remove} />
        ) : (
          <Text variant="caption" color="textMuted">
            A rotina precisa de pelo menos um bloco.
          </Text>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({ actions: { gap: space.sm } });
