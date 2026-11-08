import { StyleSheet, View } from 'react-native';

import type { Routine } from '@/domain/routine';
import { useOptionalFilePort } from '@/features/transfer/file-port';
import { shareRoutine } from '@/features/transfer/transfer-actions';
import { Button } from '@/ui/button';
import { dialog } from '@/ui/dialog';
import { Sheet } from '@/ui/sheet';
import { space } from '@/ui/tokens';

export interface RoutineOptionActions {
  favorite: boolean;
  toggleFavorite: () => void;
  edit: () => void;
  duplicate?: (() => void) | undefined;
  moveUp?: (() => void) | null | undefined;
  moveDown?: (() => void) | null | undefined;
  remove?: (() => void) | undefined;
}

/** Ações de uma rotina (o "⋯" da linha). Modelo pronto só favorita e edita uma cópia. */
export function RoutineOptions({
  routine,
  actions,
  onClose,
}: {
  routine: Routine | null;
  actions: RoutineOptionActions | null;
  onClose: () => void;
}) {
  const visible = routine !== null && actions !== null;
  const files = useOptionalFilePort();
  const preset = routine?.origin === 'preset';
  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };
  return (
    <Sheet title={routine?.name ?? ''} visible={visible} onClose={onClose}>
      {visible ? (
        <View style={styles.list}>
          <Button
            label={actions.favorite ? 'Tirar das favoritas' : 'Favoritar'}
            kind="secondary"
            onPress={run(actions.toggleFavorite)}
          />
          <Button
            label={preset ? 'Editar uma cópia' : 'Editar'}
            kind="secondary"
            onPress={run(actions.edit)}
          />
          {files ? (
            <Button
              label="Compartilhar"
              kind="secondary"
              onPress={() => {
                onClose();
                void shareRoutine(files, routine);
              }}
            />
          ) : null}
          {actions.duplicate ? (
            <Button label="Duplicar" kind="secondary" onPress={run(actions.duplicate)} />
          ) : null}
          {actions.moveUp ? (
            <Button label="Mover para cima" kind="text" onPress={run(actions.moveUp)} />
          ) : null}
          {actions.moveDown ? (
            <Button label="Mover para baixo" kind="text" onPress={run(actions.moveDown)} />
          ) : null}
          {actions.remove ? (
            <Button
              label="Apagar rotina"
              kind="text"
              onPress={() => {
                const remove = actions.remove;
                if (!remove) return;
                dialog.alert(
                  `Apagar "${routine.name}"?`,
                  'Os treinos já feitos com ela continuam no histórico.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Apagar', style: 'destructive', onPress: run(remove) },
                  ],
                );
              }}
            />
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({ list: { gap: space.sm } });
